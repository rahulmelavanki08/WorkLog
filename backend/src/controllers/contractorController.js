const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { calculateHaversineDistance } = require('../utils/haversine');
const {
  onWorkerConfirmedShift,
  onContractorOnTimePayment,
  onContractorLatePayment,
} = require('../services/trustScoreService');

const prisma = new PrismaClient();

/**
 * Generate a clean 6-character alphanumeric site invite code (e.g. WL-8A2F)
 */
function generateSiteInviteCode() {
  return 'WL-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

/**
 * Contractor Dashboard Overview
 */
async function getDashboard(req, res) {
  try {
    const contractorId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: contractorId },
      include: {
        sites: true,
        trustScoreHistory: {
          orderBy: { date: 'desc' },
          take: 5,
        }
      }
    });

    const activeSitesCount = await prisma.site.count({ where: { contractorId } });
    const openJobsCount = await prisma.jobPosting.count({
      where: { contractorId, status: 'OPEN' }
    });

    // Pending attendance verifications across contractor's sites
    const pendingAttendanceCount = await prisma.attendanceRecord.count({
      where: {
        confirmationStatus: 'PENDING',
        OR: [
          { site: { contractorId } },
          { job: { contractorId } }
        ]
      }
    });

    // Active linked workers
    const activeWorkersCount = await prisma.workerContractorLink.count({
      where: { contractorId, status: 'ACTIVE' }
    });

    // Safety Reports across contractor's sites
    const safetyReports = await prisma.safetyReport.findMany({
      where: {
        site: { contractorId }
      },
      include: {
        worker: { select: { id: true, name: true, phone: true, trustScore: true } },
        site: true,
      },
      orderBy: { date: 'desc' },
      take: 6,
    });

    const pendingSafetyReportsCount = await prisma.safetyReport.count({
      where: {
        site: { contractorId },
        status: 'PENDING'
      }
    });

    // Recent payments
    const payments = await prisma.paymentRecord.findMany({
      where: { contractorId },
      orderBy: { date: 'desc' },
      take: 5,
      include: { worker: { select: { id: true, name: true, phone: true } } }
    });

    res.json({
      success: true,
      contractor: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        trustScore: user.trustScore,
        profilePhoto: user.profilePhoto,
      },
      metrics: {
        activeSitesCount,
        openJobsCount,
        pendingAttendanceCount,
        activeWorkersCount,
        pendingSafetyReportsCount,
      },
      sites: user.sites,
      recentPayments: payments,
      safetyReports: safetyReports.map(s => ({
        id: s.id,
        date: s.date,
        riskType: s.riskType,
        temperature: s.temperature,
        weatherDescription: s.weatherDescription,
        details: s.details,
        status: s.status,
        resolutionNote: s.resolutionNote,
        worker: s.worker,
        siteName: s.site?.name,
        siteType: s.site?.siteType,
      })),
      trustScoreHistory: user.trustScoreHistory,
    });
  } catch (error) {
    console.error('[ContractorController.getDashboard] Error:', error);
    res.status(500).json({ error: 'Failed to load contractor dashboard' });
  }
}

/**
 * Create a new Works Site with GPS, site type, and auto invite code
 */
async function createSite(req, res) {
  try {
    const contractorId = req.user.id;
    const { name, lat, lng, siteType } = req.body;

    if (!name || lat == null || lng == null) {
      return res.status(400).json({ error: 'Site name and GPS coordinates are required' });
    }

    let inviteCode = generateSiteInviteCode();
    // Ensure uniqueness
    let exists = await prisma.site.findUnique({ where: { inviteCode } });
    while (exists) {
      inviteCode = generateSiteInviteCode();
      exists = await prisma.site.findUnique({ where: { inviteCode } });
    }

    const site = await prisma.site.create({
      data: {
        contractorId,
        name: name.trim(),
        lat: Number(lat),
        lng: Number(lng),
        siteType: siteType || 'construction',
        inviteCode,
      }
    });

    res.status(201).json({
      success: true,
      message: `Site "${site.name}" created with direct invite code: ${inviteCode}`,
      site,
    });
  } catch (error) {
    console.error('[ContractorController.createSite] Error:', error);
    res.status(500).json({ error: 'Failed to create site' });
  }
}

/**
 * Get all contractor's sites
 */
async function getSites(req, res) {
  try {
    const contractorId = req.user.id;

    const sites = await prisma.site.findMany({
      where: { contractorId },
      include: {
        workerLinks: {
          include: { worker: { select: { id: true, name: true, phone: true, trustScore: true } } }
        },
        _count: {
          select: { attendanceRecords: true, jobPostings: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, sites });
  } catch (error) {
    console.error('[ContractorController.getSites] Error:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
}

/**
 * Post a new Job
 */
async function postJob(req, res) {
  try {
    const contractorId = req.user.id;
    const {
      title,
      requiredTrades,
      workersNeeded,
      dailyWage,
      startDate,
      durationType,
      siteId,
      lat,
      lng,
    } = req.body;

    if (!title || !requiredTrades || !dailyWage || lat == null || lng == null) {
      return res.status(400).json({ error: 'Title, trades, daily wage, and GPS location are required' });
    }

    const job = await prisma.jobPosting.create({
      data: {
        contractorId,
        siteId: siteId || null,
        title: title.trim(),
        requiredTrades: Array.isArray(requiredTrades) ? requiredTrades : [requiredTrades],
        workersNeeded: Number(workersNeeded) || 1,
        dailyWage: Number(dailyWage),
        startDate: startDate ? new Date(startDate) : new Date(),
        durationType: durationType || 'multi_day',
        lat: Number(lat),
        lng: Number(lng),
        status: 'OPEN',
      },
      include: {
        site: true,
      }
    });

    res.status(201).json({
      success: true,
      message: `Job "${job.title}" posted successfully!`,
      job,
    });
  } catch (error) {
    console.error('[ContractorController.postJob] Error:', error);
    res.status(500).json({ error: 'Failed to post job' });
  }
}

/**
 * Manage Jobs & Applicants
 */
async function getManageJobs(req, res) {
  try {
    const contractorId = req.user.id;
    const { sortBy } = req.query; // 'distance' | 'trust'

    const jobs = await prisma.jobPosting.findMany({
      where: { contractorId },
      include: {
        site: true,
        applications: {
          include: {
            worker: {
              include: {
                workerProfile: true,
                attendanceRecords: { take: 5, orderBy: { date: 'desc' } }
              }
            }
          },
          orderBy: { appliedAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format & sort applicants per job
    const formattedJobs = jobs.map((job) => {
      let applicants = job.applications.map((app) => {
        const worker = app.worker;
        const dist = app.distanceKm != null ? app.distanceKm : calculateHaversineDistance(
          worker.workerProfile?.lat || 12.9716,
          worker.workerProfile?.lng || 77.5946,
          job.lat,
          job.lng
        );

        return {
          applicationId: app.id,
          appliedAt: app.appliedAt,
          status: app.status,
          distanceKm: dist,
          worker: {
            id: worker.id,
            name: worker.name,
            phone: worker.phone,
            trustScore: worker.trustScore,
            profilePhoto: worker.profilePhoto,
            trades: worker.workerProfile?.trades || [],
            yearsExperience: worker.workerProfile?.yearsExperience || 1,
            historyCount: worker.attendanceRecords.length,
          }
        };
      });

      if (sortBy === 'distance') {
        applicants.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
      } else if (sortBy === 'trust') {
        applicants.sort((a, b) => b.worker.trustScore - a.worker.trustScore);
      }

      return {
        id: job.id,
        title: job.title,
        status: job.status,
        requiredTrades: job.requiredTrades,
        workersNeeded: job.workersNeeded,
        dailyWage: Number(job.dailyWage),
        startDate: job.startDate,
        durationType: job.durationType,
        siteName: job.site?.name || 'Main Job Site',
        applicantCount: applicants.length,
        applicants,
      };
    });

    res.json({
      success: true,
      jobs: formattedJobs,
    });
  } catch (error) {
    console.error('[ContractorController.getManageJobs] Error:', error);
    res.status(500).json({ error: 'Failed to fetch job management data' });
  }
}

/**
 * Update Job Status (OPEN, FILLED, CLOSED)
 */
async function updateJobStatus(req, res) {
  try {
    const contractorId = req.user.id;
    const { jobId } = req.params;
    const { status } = req.body;

    const job = await prisma.jobPosting.findFirst({
      where: { id: jobId, contractorId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job posting not found' });
    }

    const updated = await prisma.jobPosting.update({
      where: { id: jobId },
      data: { status: status.toUpperCase() }
    });

    res.json({
      success: true,
      message: `Job status updated to ${updated.status}`,
      job: updated,
    });
  } catch (error) {
    console.error('[ContractorController.updateJobStatus] Error:', error);
    res.status(500).json({ error: 'Failed to update job status' });
  }
}

/**
 * Accept Worker Applicant & Create Active Site Link
 */
async function acceptApplicant(req, res) {
  try {
    const contractorId = req.user.id;
    const { applicationId } = req.body;

    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        worker: true,
      }
    });

    if (!application || application.job.contractorId !== contractorId) {
      return res.status(404).json({ error: 'Application not found or unauthorized' });
    }

    // Update application status
    await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: 'ACCEPTED' }
    });

    // Create or update active worker link
    const link = await prisma.workerContractorLink.upsert({
      where: {
        workerId_contractorId_siteId: {
          workerId: application.workerId,
          contractorId,
          siteId: application.job.siteId || 'default-site',
        }
      },
      update: { status: 'ACTIVE' },
      create: {
        workerId: application.workerId,
        contractorId,
        siteId: application.job.siteId || null,
        status: 'ACTIVE',
      }
    });

    res.json({
      success: true,
      message: `Accepted ${application.worker.name}! Worker linked to site.`,
      link,
    });
  } catch (error) {
    console.error('[ContractorController.acceptApplicant] Error:', error);
    res.status(500).json({ error: 'Failed to accept applicant' });
  }
}

/**
 * Get Pending Attendance Records to verify
 */
async function getPendingAttendance(req, res) {
  try {
    const contractorId = req.user.id;

    const records = await prisma.attendanceRecord.findMany({
      where: {
        OR: [
          { site: { contractorId } },
          { job: { contractorId } }
        ]
      },
      include: {
        worker: {
          select: { id: true, name: true, phone: true, trustScore: true, profilePhoto: true }
        },
        site: true,
        job: true,
      },
      orderBy: { checkInTime: 'desc' }
    });

    const formatted = records.map((r) => ({
      id: r.id,
      date: r.date,
      checkInTime: r.checkInTime,
      checkOutTime: r.checkOutTime,
      checkInPhoto: r.checkInPhoto,
      checkOutPhoto: r.checkOutPhoto,
      checkInLat: r.checkInLat,
      checkInLng: r.checkInLng,
      confirmationStatus: r.confirmationStatus,
      flagReason: r.flagReason,
      earnedAmount: Number(r.earnedAmount) || 800,
      worker: r.worker,
      siteName: r.site?.name || r.job?.title || 'Contractor Site',
      siteType: r.site?.siteType || 'construction',
    }));

    res.json({
      success: true,
      records: formatted,
    });
  } catch (error) {
    console.error('[ContractorController.getPendingAttendance] Error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance list' });
  }
}

/**
 * Confirm Worker Attendance (Grants worker +3 Trust Score)
 */
async function confirmAttendance(req, res) {
  try {
    const contractorId = req.user.id;
    const { attendanceId, earnedAmount } = req.body;

    const record = await prisma.attendanceRecord.findUnique({
      where: { id: attendanceId },
      include: { site: true, job: true, worker: true }
    });

    if (!record) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    const isAuthorized = (record.site && record.site.contractorId === contractorId) ||
                         (record.job && record.job.contractorId === contractorId);

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Unauthorized: You are not the contractor for this record.' });
    }

    const wage = earnedAmount ? Number(earnedAmount) : (record.earnedAmount ? Number(record.earnedAmount) : 800);

    const updated = await prisma.attendanceRecord.update({
      where: { id: attendanceId },
      data: {
        confirmationStatus: 'CONFIRMED',
        earnedAmount: wage,
        flagReason: null,
      }
    });

    // Also activate worker link if it was pending
    if (record.siteId) {
      await prisma.workerContractorLink.updateMany({
        where: {
          workerId: record.workerId,
          contractorId,
          siteId: record.siteId,
          status: 'PENDING'
        },
        data: { status: 'ACTIVE' }
      });
    }

    // Worker Trust Score +3 for fully confirmed shift
    await onWorkerConfirmedShift(record.workerId, new Date(record.date).toLocaleDateString('en-IN'));

    res.json({
      success: true,
      message: `Attendance confirmed for ${record.worker.name}. Wage of ₹${wage} credited to worker ledger. (+3 Worker Trust Score granted)`,
      record: updated,
    });
  } catch (error) {
    console.error('[ContractorController.confirmAttendance] Error:', error);
    res.status(500).json({ error: 'Failed to confirm attendance' });
  }
}

/**
 * Flag Worker Attendance as Mismatch (Requires short reason)
 */
async function flagAttendance(req, res) {
  try {
    const contractorId = req.user.id;
    const { attendanceId, flagReason } = req.body;

    if (!flagReason || !flagReason.trim()) {
      return res.status(400).json({ error: 'A short reason is required when flagging an attendance mismatch.' });
    }

    const record = await prisma.attendanceRecord.findUnique({
      where: { id: attendanceId },
      include: { site: true, job: true, worker: true }
    });

    if (!record) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    const updated = await prisma.attendanceRecord.update({
      where: { id: attendanceId },
      data: {
        confirmationStatus: 'FLAGGED',
        flagReason: flagReason.trim(),
      }
    });

    // Note: Contractor flag alone does NOT deduct worker's score (prevents unilateral harm)
    res.json({
      success: true,
      message: `Attendance flagged as mismatch: "${flagReason}". Worker has been notified.`,
      record: updated,
    });
  } catch (error) {
    console.error('[ContractorController.flagAttendance] Error:', error);
    res.status(500).json({ error: 'Failed to flag attendance' });
  }
}

/**
 * Log Payment to Worker (CASH / UPI, FULL / PARTIAL / UNPAID)
 */
async function logPayment(req, res) {
  try {
    const contractorId = req.user.id;
    const { workerId, siteId, amount, mode, status, date, dueDate, notes } = req.body;

    if (!workerId || !amount || !mode || !status) {
      return res.status(400).json({ error: 'Worker, amount, mode (CASH/UPI), and status are required' });
    }

    const numAmount = Number(amount);
    const pmtDate = date ? new Date(date) : new Date();
    const defaultDueDate = new Date(pmtDate);
    defaultDueDate.setDate(defaultDueDate.getDate() + 7); // Default 7-day payment cycle

    const payment = await prisma.paymentRecord.create({
      data: {
        workerId,
        contractorId,
        siteId: siteId || null,
        amount: numAmount,
        mode: mode.toUpperCase(),
        status: status.toUpperCase(),
        date: pmtDate,
        dueDate: dueDate ? new Date(dueDate) : defaultDueDate,
        notes: notes || null,
      },
      include: {
        worker: { select: { id: true, name: true, phone: true } }
      }
    });

    // Trust score adjustments:
    // +5 when full pay cycle is confirmed and paid on time
    if (status.toUpperCase() === 'FULL') {
      await onContractorOnTimePayment(contractorId, numAmount);
    } else if (status.toUpperCase() === 'PARTIAL' || status.toUpperCase() === 'UNPAID') {
      // If overdue
      const isOverdue = payment.dueDate && new Date() > new Date(payment.dueDate);
      if (isOverdue) {
        const daysLate = Math.floor((Date.now() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        await onContractorLatePayment(contractorId, numAmount, daysLate);
      }
    }

    res.status(201).json({
      success: true,
      message: `Payment of ₹${numAmount} logged for ${payment.worker.name} (${status}).`,
      payment,
    });
  } catch (error) {
    console.error('[ContractorController.logPayment] Error:', error);
    res.status(500).json({ error: 'Failed to log payment' });
  }
}

/**
 * Get Contractor's Payment History & Linked Workers
 */
async function getPaymentHistory(req, res) {
  try {
    const contractorId = req.user.id;

    const [payments, linkedWorkers] = await Promise.all([
      prisma.paymentRecord.findMany({
        where: { contractorId },
        include: {
          worker: { select: { id: true, name: true, phone: true, trustScore: true } }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.workerContractorLink.findMany({
        where: { contractorId, status: 'ACTIVE' },
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
          site: true,
        }
      })
    ]);

    res.json({
      success: true,
      payments,
      linkedWorkers: linkedWorkers.map(lw => ({
        id: lw.worker.id,
        name: lw.worker.name,
        phone: lw.worker.phone,
        trustScore: lw.worker.trustScore,
        trades: lw.worker.workerProfile?.trades || [],
        siteName: lw.site?.name || 'General Project',
      }))
    });
  } catch (error) {
    console.error('[ContractorController.getPaymentHistory] Error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
}

/**
 * Get Contractor's Own Trust Score & History
 */
async function getTrustScore(req, res) {
  try {
    const contractorId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: contractorId },
      include: {
        trustScoreHistory: {
          orderBy: { date: 'desc' },
          take: 25,
        }
      }
    });

    res.json({
      success: true,
      trustScore: user.trustScore,
      history: user.trustScoreHistory,
    });
  } catch (error) {
    console.error('[ContractorController.getTrustScore] Error:', error);
    res.status(500).json({ error: 'Failed to fetch trust score history' });
  }
}

/**
 * Get all Safety & Weather Hazard Reports logged for contractor's sites
 */
async function getSafetyReports(req, res) {
  try {
    const contractorId = req.user.id;

    const reports = await prisma.safetyReport.findMany({
      where: {
        site: { contractorId }
      },
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
        site: true,
      },
      orderBy: { date: 'desc' }
    });

    res.json({
      success: true,
      reports: reports.map(s => ({
        id: s.id,
        date: s.date,
        riskType: s.riskType,
        temperature: s.temperature,
        weatherDescription: s.weatherDescription,
        details: s.details,
        status: s.status,
        resolutionNote: s.resolutionNote,
        worker: {
          id: s.worker.id,
          name: s.worker.name,
          phone: s.worker.phone,
          trustScore: s.worker.trustScore,
          trades: s.worker.workerProfile?.trades || [],
        },
        siteName: s.site?.name,
        siteType: s.site?.siteType,
      }))
    });
  } catch (error) {
    console.error('[ContractorController.getSafetyReports] Error:', error);
    res.status(500).json({ error: 'Failed to fetch safety reports' });
  }
}

/**
 * Contractor Acknowledge / Resolve Safety Report
 */
async function resolveSafetyReport(req, res) {
  try {
    const contractorId = req.user.id;
    const { reportId, resolutionNote } = req.body;

    if (!reportId || !resolutionNote) {
      return res.status(400).json({ error: 'Report ID and resolution/remediation notes are required' });
    }

    const report = await prisma.safetyReport.findUnique({
      where: { id: reportId },
      include: { site: true }
    });

    if (!report || report.site?.contractorId !== contractorId) {
      return res.status(404).json({ error: 'Safety report not found or unauthorized' });
    }

    const updated = await prisma.safetyReport.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        resolutionNote: resolutionNote.trim(),
      }
    });

    res.json({
      success: true,
      message: `Safety remediation logged for ${report.riskType?.replace('_', ' ')}: "${resolutionNote.trim()}"`,
      report: updated,
    });
  } catch (error) {
    console.error('[ContractorController.resolveSafetyReport] Error:', error);
    res.status(500).json({ error: 'Failed to resolve safety report' });
  }
}

module.exports = {
  getDashboard,
  createSite,
  getSites,
  postJob,
  getManageJobs,
  updateJobStatus,
  acceptApplicant,
  getPendingAttendance,
  confirmAttendance,
  flagAttendance,
  logPayment,
  getPaymentHistory,
  getTrustScore,
  getSafetyReports,
  resolveSafetyReport,
};

