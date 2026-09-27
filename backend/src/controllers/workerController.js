const { PrismaClient } = require('@prisma/client');
const { calculateHaversineDistance } = require('../utils/haversine');
const { storageService } = require('../services/storageService');
const { fetchCurrentWeather } = require('../services/weatherService');
const { generateDisputeSummary } = require('../services/disputeAiService');
const { createDisputePdf } = require('../services/pdfService');

const prisma = new PrismaClient();

/**
 * Worker Dashboard Overview
 */
async function getDashboard(req, res) {
  try {
    const workerId = req.user.id;

    // 1. Worker Profile & Trust Score
    const user = await prisma.user.findUnique({
      where: { id: workerId },
      include: { workerProfile: true }
    });

    // 2. Today's Attendance Record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await prisma.attendanceRecord.findFirst({
      where: {
        workerId,
        date: { gte: today, lt: tomorrow }
      },
      include: {
        site: { include: { contractor: true } },
        job: { include: { contractor: true } }
      },
      orderBy: { checkInTime: 'desc' }
    });

    // 3. Linked Sites / Contractors
    const links = await prisma.workerContractorLink.findMany({
      where: { workerId, status: { in: ['PENDING', 'ACTIVE'] } },
      include: {
        contractor: { select: { id: true, name: true, phone: true, trustScore: true } },
        site: true,
      }
    });

    // 4. Financial calculation (Earned vs Paid vs Outstanding)
    // Confirmed days sum
    const confirmedAttendance = await prisma.attendanceRecord.findMany({
      where: {
        workerId,
        confirmationStatus: 'CONFIRMED'
      },
      select: { earnedAmount: true }
    });

    const totalEarned = confirmedAttendance.reduce(
      (sum, r) => sum + (Number(r.earnedAmount) || 0),
      0
    );

    // Payments received
    const payments = await prisma.paymentRecord.findMany({
      where: { workerId },
      select: { amount: true, status: true }
    });

    const totalPaid = payments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );

    const outstandingBalance = Math.max(0, totalEarned - totalPaid);

    // 5. Recent notifications / pending actions
    const pendingApplicationsCount = await prisma.jobApplication.count({
      where: { workerId, status: 'PENDING' }
    });

    res.json({
      success: true,
      worker: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        trustScore: user.trustScore,
        profilePhoto: user.profilePhoto,
        trades: user.workerProfile?.trades || [],
        searchRadius: user.workerProfile?.searchRadius || 10,
      },
      todayStatus: todayAttendance ? {
        id: todayAttendance.id,
        checkInTime: todayAttendance.checkInTime,
        checkOutTime: todayAttendance.checkOutTime,
        checkInPhoto: todayAttendance.checkInPhoto,
        checkOutPhoto: todayAttendance.checkOutPhoto,
        confirmationStatus: todayAttendance.confirmationStatus,
        siteName: todayAttendance.site?.name || todayAttendance.job?.title || 'Direct Work',
        contractorName: todayAttendance.site?.contractor?.name || todayAttendance.job?.contractor?.name || 'Contractor',
        siteType: todayAttendance.site?.siteType || 'construction',
        earnedAmount: todayAttendance.earnedAmount,
      } : null,
      wages: {
        totalEarned,
        totalPaid,
        outstandingBalance,
      },
      linkedSitesCount: links.length,
      linkedSites: links,
      pendingApplicationsCount,
    });
  } catch (error) {
    console.error('[WorkerController.getDashboard] Error:', error);
    res.status(500).json({ error: 'Failed to load worker dashboard' });
  }
}

/**
 * Find Work: Filter by trade and GPS proximity using Haversine formula
 */
async function findWork(req, res) {
  try {
    const workerId = req.user.id;
    const { sortBy, filterTrade, maxDistance, lat, lng } = req.query;

    const worker = await prisma.user.findUnique({
      where: { id: workerId },
      include: { workerProfile: true, applications: true }
    });

    const workerTrades = worker.workerProfile?.trades || [];
    const workerLat = lat ? Number(lat) : (worker.workerProfile?.lat || 12.9716);
    const workerLng = lng ? Number(lng) : (worker.workerProfile?.lng || 77.5946);
    const searchRadius = maxDistance ? Number(maxDistance) : (worker.workerProfile?.searchRadius || 15.0);

    // Fetch open jobs
    const jobs = await prisma.jobPosting.findMany({
      where: {
        status: 'OPEN'
      },
      include: {
        contractor: {
          select: { id: true, name: true, phone: true, trustScore: true, profilePhoto: true }
        },
        site: {
          select: { id: true, name: true, siteType: true }
        },
        applications: {
          where: { workerId },
          select: { id: true, status: true, appliedAt: true }
        }
      }
    });

    // Calculate distance and match scores
    const enrichedJobs = jobs.map((job) => {
      const distance = calculateHaversineDistance(workerLat, workerLng, job.lat, job.lng);
      
      // Trade match check
      const matchesTrade = filterTrade
        ? job.requiredTrades.includes(filterTrade)
        : job.requiredTrades.some((t) => workerTrades.includes(t)) || workerTrades.length === 0;

      const myApplication = job.applications[0] || null;

      return {
        id: job.id,
        title: job.title,
        requiredTrades: job.requiredTrades,
        workersNeeded: job.workersNeeded,
        dailyWage: Number(job.dailyWage),
        startDate: job.startDate,
        durationType: job.durationType,
        lat: job.lat,
        lng: job.lng,
        distanceKm: distance,
        siteName: job.site?.name || 'Main Job Site',
        siteType: job.site?.siteType || 'construction',
        contractor: {
          id: job.contractor.id,
          name: job.contractor.name,
          trustScore: job.contractor.trustScore,
          profilePhoto: job.contractor.profilePhoto,
        },
        matchesTrade,
        myApplication: myApplication ? {
          id: myApplication.id,
          status: myApplication.status,
          appliedAt: myApplication.appliedAt,
        } : null,
      };
    });

    // Filter by radius and trade if requested
    let filteredJobs = enrichedJobs.filter((job) => {
      if (searchRadius && job.distanceKm !== null && job.distanceKm > searchRadius) {
        return false;
      }
      if (filterTrade && !job.requiredTrades.includes(filterTrade)) {
        return false;
      }
      return true;
    });

    // Sort
    if (sortBy === 'wage_high') {
      filteredJobs.sort((a, b) => b.dailyWage - a.dailyWage);
    } else if (sortBy === 'newest') {
      filteredJobs.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    } else {
      // Default: nearest first
      filteredJobs.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    }

    res.json({
      success: true,
      workerLocation: { lat: workerLat, lng: workerLng },
      workerTrades,
      totalCount: filteredJobs.length,
      jobs: filteredJobs,
    });
  } catch (error) {
    console.error('[WorkerController.findWork] Error:', error);
    res.status(500).json({ error: 'Failed to fetch job feed' });
  }
}

/**
 * Apply to an open Job
 */
async function applyJob(req, res) {
  try {
    const workerId = req.user.id;
    const { jobId, lat, lng } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: { contractor: true }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job posting not found' });
    }

    // Check existing application
    const existing = await prisma.jobApplication.findUnique({
      where: {
        jobId_workerId: { jobId, workerId }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already applied for this job.' });
    }

    const distance = calculateHaversineDistance(
      lat ? Number(lat) : 12.9716,
      lng ? Number(lng) : 77.5946,
      job.lat,
      job.lng
    );

    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        workerId,
        status: 'PENDING',
        distanceKm: distance,
      },
      include: {
        job: { select: { title: true, dailyWage: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: `Applied successfully for ${job.title}! The contractor has been notified.`,
      application,
    });
  } catch (error) {
    console.error('[WorkerController.applyJob] Error:', error);
    res.status(500).json({ error: 'Failed to submit job application' });
  }
}

/**
 * Get Worker's Applications
 */
async function getMyApplications(req, res) {
  try {
    const workerId = req.user.id;

    const applications = await prisma.jobApplication.findMany({
      where: { workerId },
      include: {
        job: {
          include: {
            contractor: { select: { id: true, name: true, phone: true, trustScore: true } },
            site: true,
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    res.json({
      success: true,
      applications: applications.map(app => ({
        id: app.id,
        status: app.status,
        appliedAt: app.appliedAt,
        distanceKm: app.distanceKm,
        job: {
          id: app.job.id,
          title: app.job.title,
          dailyWage: Number(app.job.dailyWage),
          requiredTrades: app.job.requiredTrades,
          durationType: app.job.durationType,
          startDate: app.job.startDate,
          contractor: app.job.contractor,
          site: app.job.site,
        }
      }))
    });
  } catch (error) {
    console.error('[WorkerController.getMyApplications] Error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
}

/**
 * Join Site Directly via Contractor Invite Code
 */
async function joinSiteDirect(req, res) {
  try {
    const workerId = req.user.id;
    const { inviteCode } = req.body;

    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const code = inviteCode.trim().toUpperCase();

    const site = await prisma.site.findUnique({
      where: { inviteCode: code },
      include: { contractor: true }
    });

    if (!site) {
      return res.status(404).json({ error: 'Invalid invite code. Site not found.' });
    }

    // Upsert link with status PENDING
    const link = await prisma.workerContractorLink.upsert({
      where: {
        workerId_contractorId_siteId: {
          workerId,
          contractorId: site.contractorId,
          siteId: site.id,
        }
      },
      update: {
        status: 'PENDING'
      },
      create: {
        workerId,
        contractorId: site.contractorId,
        siteId: site.id,
        status: 'PENDING'
      },
      include: {
        site: true,
        contractor: { select: { id: true, name: true, phone: true, trustScore: true } }
      }
    });

    res.json({
      success: true,
      message: `Direct link request sent for site "${site.name}". Link will activate upon first confirmed check-in.`,
      link,
    });
  } catch (error) {
    console.error('[WorkerController.joinSiteDirect] Error:', error);
    res.status(500).json({ error: 'Failed to join site' });
  }
}

/**
 * Perform Live Camera Check-in (Strict live camera only)
 */
async function performCheckIn(req, res) {
  try {
    const workerId = req.user.id;
    const { siteId, jobId, photoData, lat, lng } = req.body;

    if (!photoData) {
      return res.status(400).json({ error: 'Live camera selfie is strictly required for attendance.' });
    }

    if (lat == null || lng == null) {
      return res.status(400).json({ error: 'GPS coordinates from device are required.' });
    }

    // Save photo using storage service
    const photoUrl = await storageService.savePhoto(photoData, 'checkin');

    const checkInLat = Number(lat);
    const checkInLng = Number(lng);

    // Fetch site if provided to check weather safety
    let site = null;
    let weatherData = null;
    if (siteId) {
      site = await prisma.site.findUnique({ where: { id: siteId } });
    }

    // Weather check for outdoor sites (construction, agriculture, roadwork)
    const isOutdoorSite = !site || ['construction', 'agriculture', 'roadwork'].includes(site.siteType?.toLowerCase());
    if (isOutdoorSite) {
      weatherData = await fetchCurrentWeather(checkInLat, checkInLng);
    }

    // Determine default earned wage from job or site average
    let dailyRate = 750; // default ₹750/day
    if (jobId) {
      const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
      if (job) dailyRate = Number(job.dailyWage);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await prisma.attendanceRecord.create({
      data: {
        workerId,
        siteId: siteId || null,
        jobId: jobId || null,
        date: today,
        checkInTime: new Date(), // Server-side timestamp (never client device time)
        checkInPhoto: photoUrl,
        checkInLat,
        checkInLng,
        confirmationStatus: 'PENDING',
        earnedAmount: dailyRate,
      },
      include: {
        site: { include: { contractor: true } },
        job: true,
      }
    });

    res.status(201).json({
      success: true,
      message: 'Check-in recorded successfully with server timestamp & GPS!',
      record,
      weatherSafety: weatherData,
    });
  } catch (error) {
    console.error('[WorkerController.performCheckIn] Error:', error);
    res.status(500).json({ error: 'Check-in failed. ' + error.message });
  }
}

/**
 * Perform Live Camera Check-out
 */
async function performCheckOut(req, res) {
  try {
    const workerId = req.user.id;
    const { attendanceId, photoData, lat, lng } = req.body;

    if (!attendanceId) {
      return res.status(400).json({ error: 'Attendance Record ID is required for checkout' });
    }

    if (!photoData) {
      return res.status(400).json({ error: 'Live camera selfie is required for checkout.' });
    }

    const record = await prisma.attendanceRecord.findFirst({
      where: { id: attendanceId, workerId }
    });

    if (!record) {
      return res.status(404).json({ error: 'Attendance record not found.' });
    }

    const photoUrl = await storageService.savePhoto(photoData, 'checkout');

    const updated = await prisma.attendanceRecord.update({
      where: { id: attendanceId },
      data: {
        checkOutTime: new Date(), // Server timestamp
        checkOutPhoto: photoUrl,
        checkOutLat: lat ? Number(lat) : null,
        checkOutLng: lng ? Number(lng) : null,
      }
    });

    res.json({
      success: true,
      message: 'Check-out completed successfully! Attendance submitted for contractor confirmation.',
      record: updated,
    });
  } catch (error) {
    console.error('[WorkerController.performCheckOut] Error:', error);
    res.status(500).json({ error: 'Check-out failed' });
  }
}

/**
 * Report Unsafe Work Condition (Safety Check feature)
 */
async function reportSafetyCondition(req, res) {
  try {
    const workerId = req.user.id;
    const { siteId, attendanceId, riskType, temperature, weatherDescription, details } = req.body;

    if (!siteId) {
      return res.status(400).json({ error: 'Site ID is required to log safety report' });
    }

    const report = await prisma.safetyReport.create({
      data: {
        workerId,
        siteId,
        attendanceId: attendanceId || null,
        riskType: riskType || 'extreme_heat',
        temperature: temperature ? Number(temperature) : null,
        weatherDescription: weatherDescription || null,
        details: details || 'Worker reported hazardous climate/environmental condition.',
        status: 'PENDING',
      },
      include: {
        site: true,
      }
    });

    res.status(201).json({
      success: true,
      message: 'Safety incident report submitted to platform administrators and site supervisor.',
      report,
    });
  } catch (error) {
    console.error('[WorkerController.reportSafetyCondition] Error:', error);
    res.status(500).json({ error: 'Failed to submit safety report' });
  }
}

/**
 * Wage Ledger Table View
 */
async function getWageLedger(req, res) {
  try {
    const workerId = req.user.id;

    // Fetch all attendance records
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { workerId },
      include: {
        site: { include: { contractor: true } },
        job: true,
      },
      orderBy: { date: 'desc' }
    });

    // Fetch all payment records
    const paymentRecords = await prisma.paymentRecord.findMany({
      where: { workerId },
      include: {
        contractor: { select: { id: true, name: true, phone: true } }
      },
      orderBy: { date: 'desc' }
    });

    // Calculate totals
    let totalEarned = 0;
    const ledgerEntries = attendanceRecords.map((att) => {
      const earned = att.confirmationStatus === 'CONFIRMED' ? (Number(att.earnedAmount) || 0) : 0;
      totalEarned += earned;

      return {
        id: att.id,
        date: att.date,
        checkInTime: att.checkInTime,
        checkOutTime: att.checkOutTime,
        checkInPhoto: att.checkInPhoto,
        checkOutPhoto: att.checkOutPhoto,
        siteName: att.site?.name || att.job?.title || 'General Shift',
        contractorName: att.site?.contractor?.name || 'Contractor',
        confirmationStatus: att.confirmationStatus,
        flagReason: att.flagReason,
        dailyRate: Number(att.earnedAmount) || 750,
        amountEarned: earned,
      };
    });

    const totalPaid = paymentRecords.reduce((sum, p) => sum + Number(p.amount), 0);
    const runningBalance = Math.max(0, totalEarned - totalPaid);

    res.json({
      success: true,
      summary: {
        totalEarned,
        totalPaid,
        runningBalance,
        totalDays: attendanceRecords.length,
        confirmedDays: attendanceRecords.filter(a => a.confirmationStatus === 'CONFIRMED').length,
        flaggedDays: attendanceRecords.filter(a => a.confirmationStatus === 'FLAGGED').length,
        pendingDays: attendanceRecords.filter(a => a.confirmationStatus === 'PENDING').length,
      },
      ledger: ledgerEntries,
      payments: paymentRecords,
    });
  } catch (error) {
    console.error('[WorkerController.getWageLedger] Error:', error);
    res.status(500).json({ error: 'Failed to load wage ledger' });
  }
}

/**
 * Smart Dispute Assistant: Generate dispute report with AI prompt template
 */
async function generateDisputeReport(req, res) {
  try {
    const workerId = req.user.id;
    const { contractorId, siteId, startDate, endDate, dailyRate } = req.body;

    const worker = await prisma.user.findUnique({
      where: { id: workerId },
    });

    let contractorName = 'All Assigned Contractors';
    let contractorObj = null;
    if (contractorId) {
      contractorObj = await prisma.user.findUnique({ where: { id: contractorId } });
      if (contractorObj) contractorName = contractorObj.name;
    }

    let siteName = 'All Worksites';
    if (siteId) {
      const siteObj = await prisma.site.findUnique({ where: { id: siteId } });
      if (siteObj) siteName = siteObj.name;
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Query attendance records in date range
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        workerId,
        date: { gte: start, lte: end },
        ...(siteId ? { siteId } : {}),
      },
      orderBy: { date: 'asc' }
    });

    // Query payments in range
    const paymentRecords = await prisma.paymentRecord.findMany({
      where: {
        workerId,
        date: { gte: start, lte: end },
        ...(contractorId ? { contractorId } : {}),
      },
      orderBy: { date: 'asc' }
    });

    const rate = dailyRate ? Number(dailyRate) : (attendanceRecords[0]?.earnedAmount ? Number(attendanceRecords[0].earnedAmount) : 800);

    const formattedAttendance = attendanceRecords.map(a => ({
      id: a.id,
      dateStr: new Date(a.date).toLocaleDateString('en-IN'),
      checkInStr: new Date(a.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      checkOutStr: a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—',
      gpsStr: `${a.checkInLat.toFixed(4)}, ${a.checkInLng.toFixed(4)}`,
      confirmationStatus: a.confirmationStatus,
      flagReason: a.flagReason,
      photoUrl: a.checkInPhoto,
    }));

    const formattedPayments = paymentRecords.map(p => ({
      id: p.id,
      dateStr: new Date(p.date).toLocaleDateString('en-IN'),
      amount: Number(p.amount),
      mode: p.mode,
      status: p.status,
    }));

    // Call AI dispute generator
    const { promptTemplate, summaryText, stats } = generateDisputeSummary({
      workerName: worker.name,
      contractorName,
      siteName,
      startDateStr: start.toLocaleDateString('en-IN'),
      endDateStr: end.toLocaleDateString('en-IN'),
      attendanceList: formattedAttendance,
      paymentList: formattedPayments,
      dailyRate: rate,
    });

    // Persist dispute record
    const dispute = await prisma.disputeReport.create({
      data: {
        workerId,
        contractorId: contractorId || (contractorObj ? contractorObj.id : workerId),
        siteId: siteId || null,
        startDate: start,
        endDate: end,
        generatedSummary: summaryText,
        totalEarned: stats.totalEarned,
        totalPaid: stats.totalPaid,
        balance: stats.outstandingBalance,
        linkedRecordIds: attendanceRecords.map(a => a.id),
      }
    });

    res.json({
      success: true,
      disputeId: dispute.id,
      promptTemplate,
      summaryText,
      stats,
      evidence: {
        worker: { name: worker.name, phone: worker.phone },
        contractor: { name: contractorName },
        site: { name: siteName },
        dateRange: `${start.toLocaleDateString('en-IN')} to ${end.toLocaleDateString('en-IN')}`,
        attendance: formattedAttendance,
        payments: formattedPayments,
      }
    });
  } catch (error) {
    console.error('[WorkerController.generateDisputeReport] Error:', error);
    res.status(500).json({ error: 'Failed to generate dispute report' });
  }
}

/**
 * Download Dispute PDF
 */
async function downloadDisputePdf(req, res) {
  try {
    const workerId = req.user.id;
    const { disputeId } = req.params;

    const dispute = await prisma.disputeReport.findUnique({
      where: { id: disputeId },
      include: {
        worker: true,
        contractor: true,
        site: true,
      }
    });

    if (!dispute || dispute.workerId !== workerId) {
      return res.status(404).json({ error: 'Dispute report not found' });
    }

    // Fetch linked attendance records
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { id: { in: dispute.linkedRecordIds } },
      orderBy: { date: 'asc' }
    });

    const paymentRecords = await prisma.paymentRecord.findMany({
      where: {
        workerId,
        date: { gte: dispute.startDate, lte: dispute.endDate }
      },
      orderBy: { date: 'asc' }
    });

    const formattedAttendance = attendanceRecords.map(a => ({
      dateStr: new Date(a.date).toLocaleDateString('en-IN'),
      checkInStr: new Date(a.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      checkOutStr: a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—',
      gpsStr: `${a.checkInLat.toFixed(4)}, ${a.checkInLng.toFixed(4)}`,
      confirmationStatus: a.confirmationStatus,
    }));

    const formattedPayments = paymentRecords.map(p => ({
      dateStr: new Date(p.date).toLocaleDateString('en-IN'),
      amount: Number(p.amount),
      mode: p.mode,
      status: p.status,
    }));

    const stats = {
      totalDaysLogged: attendanceRecords.length,
      confirmedDays: attendanceRecords.filter(a => a.confirmationStatus === 'CONFIRMED').length,
      dailyRate: attendanceRecords[0]?.earnedAmount ? Number(attendanceRecords[0].earnedAmount) : 800,
      totalEarned: Number(dispute.totalEarned),
      totalPaid: Number(dispute.totalPaid),
      outstandingBalance: Number(dispute.balance),
    };

    const doc = createDisputePdf({
      workerName: dispute.worker.name,
      workerPhone: dispute.worker.phone,
      contractorName: dispute.contractor?.name || 'Assigned Contractor',
      siteName: dispute.site?.name || 'All Worksites',
      startDateStr: new Date(dispute.startDate).toLocaleDateString('en-IN'),
      endDateStr: new Date(dispute.endDate).toLocaleDateString('en-IN'),
      summaryText: dispute.generatedSummary,
      stats,
      attendanceList: formattedAttendance,
      paymentList: formattedPayments,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="WorkLog_Dispute_${dispute.worker.name.replace(/\s+/g, '_')}.pdf"`);

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('[WorkerController.downloadDisputePdf] Error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

module.exports = {
  getDashboard,
  findWork,
  applyJob,
  getMyApplications,
  joinSiteDirect,
  performCheckIn,
  performCheckOut,
  reportSafetyCondition,
  getWageLedger,
  generateDisputeReport,
  downloadDisputePdf,
};
