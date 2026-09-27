const { PrismaClient } = require('@prisma/client');
const { onWorkerMismatchUpheldByAdmin, adjustTrustScore } = require('../services/trustScoreService');

const prisma = new PrismaClient();

/**
 * Admin Dashboard Overview & Platform Analytics
 */
async function getDashboard(req, res) {
  try {
    const [workersCount, contractorsCount, sitesCount, openDisputesCount, openSafetyReportsCount] = await Promise.all([
      prisma.user.count({ where: { role: 'WORKER' } }),
      prisma.user.count({ where: { role: 'CONTRACTOR' } }),
      prisma.site.count(),
      prisma.attendanceRecord.count({ where: { confirmationStatus: 'FLAGGED' } }),
      prisma.safetyReport.count({ where: { status: 'PENDING' } }),
    ]);

    // Aggregate disputes per contractor (to surface repeat offenders)
    const contractors = await prisma.user.findMany({
      where: { role: 'CONTRACTOR' },
      select: {
        id: true,
        name: true,
        phone: true,
        trustScore: true,
        sites: {
          select: {
            id: true,
            name: true,
            attendanceRecords: {
              where: { confirmationStatus: 'FLAGGED' },
              select: { id: true }
            },
            safetyReports: {
              where: { status: 'PENDING' },
              select: { id: true }
            }
          }
        }
      }
    });

    const contractorDisputeStats = contractors.map((c) => {
      let flaggedDisputes = 0;
      let safetyIssues = 0;
      c.sites.forEach((s) => {
        flaggedDisputes += s.attendanceRecords.length;
        safetyIssues += s.safetyReports.length;
      });

      return {
        contractorId: c.id,
        contractorName: c.name,
        phone: c.phone,
        trustScore: c.trustScore,
        flaggedDisputes,
        safetyIssues,
        totalIssues: flaggedDisputes + safetyIssues,
        isRepeatOffender: (flaggedDisputes + safetyIssues) >= 2 || c.trustScore < 80,
      };
    });

    // Sort highest disputes first
    contractorDisputeStats.sort((a, b) => b.totalIssues - a.totalIssues);

    res.json({
      success: true,
      totals: {
        workers: workersCount,
        contractors: contractorsCount,
        sites: sitesCount,
        openDisputes: openDisputesCount,
        openSafetyReports: openSafetyReportsCount,
      },
      contractorDisputeStats,
    });
  } catch (error) {
    console.error('[AdminController.getDashboard] Error:', error);
    res.status(500).json({ error: 'Failed to load admin dashboard' });
  }
}

/**
 * Get all Flagged Mismatches and Safety Reports across all sites
 */
async function getDisputesAndSafetyReports(req, res) {
  try {
    const { status, contractorId } = req.query;

    // Flagged Attendance Records
    const attendanceDisputes = await prisma.attendanceRecord.findMany({
      where: {
        confirmationStatus: status ? status.toUpperCase() : { in: ['FLAGGED', 'PENDING'] },
        ...(contractorId ? {
          OR: [
            { site: { contractorId } },
            { job: { contractorId } }
          ]
        } : {})
      },
      include: {
        worker: { select: { id: true, name: true, phone: true, trustScore: true } },
        site: { include: { contractor: { select: { id: true, name: true, phone: true, trustScore: true } } } },
        job: { include: { contractor: { select: { id: true, name: true, phone: true, trustScore: true } } } },
      },
      orderBy: { checkInTime: 'desc' }
    });

    // Safety Reports
    const safetyReports = await prisma.safetyReport.findMany({
      where: {
        ...(status ? { status: status.toUpperCase() } : {}),
        ...(contractorId ? { site: { contractorId } } : {})
      },
      include: {
        worker: { select: { id: true, name: true, phone: true, trustScore: true } },
        site: { include: { contractor: { select: { id: true, name: true, phone: true, trustScore: true } } } },
        attendance: true,
      },
      orderBy: { date: 'desc' }
    });

    res.json({
      success: true,
      attendanceDisputes: attendanceDisputes.map(d => ({
        id: d.id,
        type: 'ATTENDANCE_MISMATCH',
        date: d.date,
        checkInTime: d.checkInTime,
        checkOutTime: d.checkOutTime,
        checkInPhoto: d.checkInPhoto,
        checkOutPhoto: d.checkOutPhoto,
        checkInGps: `${d.checkInLat.toFixed(4)}, ${d.checkInLng.toFixed(4)}`,
        status: d.confirmationStatus,
        reason: d.flagReason,
        earnedAmount: Number(d.earnedAmount) || 800,
        worker: d.worker,
        contractor: d.site?.contractor || d.job?.contractor,
        siteName: d.site?.name || d.job?.title || 'Main Site',
        siteType: d.site?.siteType || 'construction',
      })),
      safetyReports: safetyReports.map(s => ({
        id: s.id,
        type: 'SAFETY_REPORT',
        date: s.date,
        riskType: s.riskType,
        temperature: s.temperature,
        weatherDescription: s.weatherDescription,
        details: s.details,
        status: s.status,
        resolutionNote: s.resolutionNote,
        worker: s.worker,
        contractor: s.site?.contractor,
        siteName: s.site?.name,
        siteType: s.site?.siteType,
      }))
    });
  } catch (error) {
    console.error('[AdminController.getDisputesAndSafetyReports] Error:', error);
    res.status(500).json({ error: 'Failed to fetch disputes' });
  }
}

/**
 * Resolve a Dispute or Safety Report
 */
async function resolveDispute(req, res) {
  try {
    const { itemType, itemId, resolutionNote, upholdMismatchAgainstWorker } = req.body;

    if (!itemId || !resolutionNote) {
      return res.status(400).json({ error: 'Item ID and resolution note are required' });
    }

    if (itemType === 'SAFETY_REPORT') {
      const updated = await prisma.safetyReport.update({
        where: { id: itemId },
        data: {
          status: 'RESOLVED',
          resolutionNote: resolutionNote.trim(),
        }
      });

      return res.json({
        success: true,
        message: 'Safety report marked as resolved.',
        report: updated,
      });
    }

    // Default: Attendance Mismatch dispute
    const record = await prisma.attendanceRecord.findUnique({
      where: { id: itemId },
      include: { worker: true, site: true }
    });

    if (!record) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    // If Admin upholds mismatch against worker -> worker trust score -5
    if (upholdMismatchAgainstWorker) {
      await onWorkerMismatchUpheldByAdmin(record.workerId, resolutionNote);
    } else {
      // Mismatch resolved in worker's favor -> mark confirmed
      await prisma.attendanceRecord.update({
        where: { id: itemId },
        data: {
          confirmationStatus: 'CONFIRMED',
          flagReason: `Resolved by Admin: ${resolutionNote.trim()}`,
        }
      });
    }

    res.json({
      success: true,
      message: `Dispute resolved successfully. Resolution logged: "${resolutionNote}".`,
    });
  } catch (error) {
    console.error('[AdminController.resolveDispute] Error:', error);
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
}

/**
 * Get all Worker-Contractor Links
 */
async function getLinks(req, res) {
  try {
    const links = await prisma.workerContractorLink.findMany({
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            phone: true,
            trustScore: true,
            workerProfile: true,
          }
        },
        contractor: {
          select: {
            id: true,
            name: true,
            phone: true,
            trustScore: true,
          }
        },
        site: true,
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      success: true,
      links: links.map(l => ({
        id: l.id,
        status: l.status,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
        worker: {
          id: l.worker.id,
          name: l.worker.name,
          phone: l.worker.phone,
          trustScore: l.worker.trustScore,
          trades: l.worker.workerProfile?.trades || [],
        },
        contractor: l.contractor,
        site: l.site,
      }))
    });
  } catch (error) {
    console.error('[AdminController.getLinks] Error:', error);
    res.status(500).json({ error: 'Failed to fetch links' });
  }
}

/**
 * Revoke Worker-Contractor Link (non-destructively)
 * Prevents new attendance under this link without deleting historical attendance/payment records
 */
async function revokeLink(req, res) {
  try {
    const { linkId, reason } = req.body;

    if (!linkId) {
      return res.status(400).json({ error: 'Link ID is required' });
    }

    const link = await prisma.workerContractorLink.findUnique({
      where: { id: linkId },
      include: { worker: true, contractor: true, site: true }
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const updated = await prisma.workerContractorLink.update({
      where: { id: linkId },
      data: {
        status: 'REVOKED',
      }
    });

    console.log(`[AdminLinkRevocation] Revoked link ${linkId} for Worker ${link.worker.name} & Contractor ${link.contractor.name}. Reason: ${reason || 'Admin intervention'}`);

    res.json({
      success: true,
      message: `Worker-Contractor link between "${link.worker.name}" and "${link.contractor.name}" has been revoked. Historical records remain fully preserved.`,
      link: updated,
    });
  } catch (error) {
    console.error('[AdminController.revokeLink] Error:', error);
    res.status(500).json({ error: 'Failed to revoke link' });
  }
}

module.exports = {
  getDashboard,
  getDisputesAndSafetyReports,
  resolveDispute,
  getLinks,
  revokeLink,
};
