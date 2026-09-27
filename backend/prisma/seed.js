const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Helper to create simple mock selfie images in uploads folder
function generateMockSelfieSvg(name, role, timeStr) {
  const bg = role === 'WORKER' ? '#0F6E56' : '#7F77DD';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="300" height="300" fill="#F3F4F6"/>
    <circle cx="150" cy="110" r="55" fill="${bg}"/>
    <path d="M70 260 C70 190 230 190 230 260 Z" fill="${bg}"/>
    <circle cx="150" cy="100" r="35" fill="#FFE0B2"/>
    <rect x="20" y="235" width="260" height="50" rx="6" fill="#1F2937" opacity="0.9"/>
    <text x="150" y="255" fill="#FFFFFF" font-family="Arial" font-size="13" font-weight="bold" text-anchor="middle">${name}</text>
    <text x="150" y="275" fill="#10B981" font-family="Arial" font-size="11" text-anchor="middle">LIVE VERIFIED: ${timeStr}</text>
  </svg>`;
}

async function main() {
  console.log('🌱 Starting database seeding for WorkLog...');

  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Clear existing records in correct foreign key order
  await prisma.safetyReport.deleteMany();
  await prisma.trustScoreHistory.deleteMany();
  await prisma.disputeReport.deleteMany();
  await prisma.paymentRecord.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.workerContractorLink.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.site.deleteMany();
  await prisma.workerProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing tables.');

  // Create Mock Selfies
  const selfie1 = '/uploads/sample_ramesh_selfie.svg';
  const selfie2 = '/uploads/sample_suresh_selfie.svg';
  const selfie3 = '/uploads/sample_anil_selfie.svg';
  const selfie4 = '/uploads/sample_mohan_selfie.svg';
  const selfie5 = '/uploads/sample_sunita_selfie.svg';

  fs.writeFileSync(path.join(uploadsDir, 'sample_ramesh_selfie.svg'), generateMockSelfieSvg('Ramesh Kumar', 'WORKER', '08:30 AM (GPS 12.9716, 77.5946)'));
  fs.writeFileSync(path.join(uploadsDir, 'sample_suresh_selfie.svg'), generateMockSelfieSvg('Suresh Verma', 'WORKER', '08:45 AM (GPS 12.9698, 77.7499)'));
  fs.writeFileSync(path.join(uploadsDir, 'sample_anil_selfie.svg'), generateMockSelfieSvg('Anil Rao', 'WORKER', '09:00 AM (GPS 12.9716, 77.5946)'));
  fs.writeFileSync(path.join(uploadsDir, 'sample_mohan_selfie.svg'), generateMockSelfieSvg('Mohan Lal', 'WORKER', '08:15 AM (GPS 12.9698, 77.7499)'));
  fs.writeFileSync(path.join(uploadsDir, 'sample_sunita_selfie.svg'), generateMockSelfieSvg('Sunita Devi', 'WORKER', '08:20 AM (GPS 12.9716, 77.5946)'));

  // 1. ADMIN
  const admin = await prisma.user.create({
    data: {
      phone: '9999999999',
      name: 'Officer Meera Sen',
      role: 'ADMIN',
      trustScore: 100,
    }
  });

  // 2. CONTRACTORS
  const contractor1 = await prisma.user.create({
    data: {
      phone: '9876543210',
      name: 'Rajesh Sharma (Apex Infra)',
      role: 'CONTRACTOR',
      trustScore: 92,
      trustScoreHistory: {
        create: [
          { change: 0, reason: 'Initial baseline trust score', resultingScore: 100 },
          { change: 5, reason: 'Completed on-time full payment cycle', resultingScore: 100 },
          { change: -10, reason: 'Flagged mismatch unresolved for over 48 hours', resultingScore: 90 },
          { change: 5, reason: 'Completed on-time full payment of ₹12,000', resultingScore: 95 },
          { change: -15, reason: 'Payment logged Partial/Unpaid past 7-day due date', resultingScore: 80 },
          { change: 5, reason: 'Completed on-time full payment of ₹6,400', resultingScore: 85 },
          { change: 7, reason: 'Proactive resolution of dispute report', resultingScore: 92 },
        ]
      }
    }
  });

  const contractor2 = await prisma.user.create({
    data: {
      phone: '9876543211',
      name: 'Vikram Patel (Greenfield Constructions)',
      role: 'CONTRACTOR',
      trustScore: 95,
      trustScoreHistory: {
        create: [
          { change: 0, reason: 'Initial baseline trust score', resultingScore: 100 },
          { change: 5, reason: 'Completed on-time full payment cycle', resultingScore: 100 },
          { change: -10, reason: 'Flagged mismatch unresolved for over 48 hours', resultingScore: 90 },
          { change: 5, reason: 'Completed on-time full payment of ₹8,500', resultingScore: 95 },
        ]
      }
    }
  });

  // 3. SITES
  const site1 = await prisma.site.create({
    data: {
      contractorId: contractor1.id,
      name: 'Metro Station Pier 4 Site',
      lat: 12.9716,
      lng: 77.5946,
      siteType: 'construction',
      inviteCode: 'WL-METRO4',
    }
  });

  const site2 = await prisma.site.create({
    data: {
      contractorId: contractor2.id,
      name: 'Whitefield Tech Park Block C',
      lat: 12.9698,
      lng: 77.7499,
      siteType: 'construction',
      inviteCode: 'WL-TECHC',
    }
  });

  // 4. OPEN JOB POSTINGS (3 jobs with different trades)
  const job1 = await prisma.jobPosting.create({
    data: {
      contractorId: contractor1.id,
      siteId: site1.id,
      title: 'Senior Mason & Centering Specialist for Foundation',
      requiredTrades: ['Mason', 'Centering Worker', 'Bar Bender'],
      workersNeeded: 4,
      dailyWage: 950,
      startDate: new Date(),
      durationType: 'multi_day',
      lat: 12.9716,
      lng: 77.5946,
      status: 'OPEN',
    }
  });

  const job2 = await prisma.jobPosting.create({
    data: {
      contractorId: contractor2.id,
      siteId: site2.id,
      title: 'Commercial Electrician - High-Voltage Conduit Wiring',
      requiredTrades: ['Electrician'],
      workersNeeded: 2,
      dailyWage: 1100,
      startDate: new Date(),
      durationType: 'ongoing',
      lat: 12.9698,
      lng: 77.7499,
      status: 'OPEN',
    }
  });

  const job3 = await prisma.jobPosting.create({
    data: {
      contractorId: contractor1.id,
      siteId: site1.id,
      title: 'Sanitary Plumbing & Pipefitting Specialist',
      requiredTrades: ['Plumber', 'Welder'],
      workersNeeded: 3,
      dailyWage: 850,
      startDate: new Date(),
      durationType: 'single_day',
      lat: 12.9716,
      lng: 77.5946,
      status: 'OPEN',
    }
  });

  // 5. WORKERS (5 workers with varied trades)
  const worker1 = await prisma.user.create({
    data: {
      phone: '9800000001',
      name: 'Ramesh Kumar',
      role: 'WORKER',
      profilePhoto: selfie1,
      trustScore: 94,
      workerProfile: {
        create: {
          trades: ['Mason', 'Centering Worker', 'Bar Bender'],
          yearsExperience: 6,
          searchRadius: 15.0,
          lat: 12.9720,
          lng: 77.5950,
        }
      },
      trustScoreHistory: {
        create: [
          { change: 0, reason: 'Initial baseline trust score', resultingScore: 100 },
          { change: 3, reason: 'Confirmed attendance shift', resultingScore: 100 },
          { change: 3, reason: 'Confirmed attendance shift', resultingScore: 100 },
          { change: -6, reason: 'Attendance mismatch upheld by Admin', resultingScore: 94 },
        ]
      }
    }
  });

  const worker2 = await prisma.user.create({
    data: {
      phone: '9800000002',
      name: 'Suresh Verma',
      role: 'WORKER',
      profilePhoto: selfie2,
      trustScore: 98,
      workerProfile: {
        create: {
          trades: ['Plumber', 'Welder'],
          yearsExperience: 4,
          searchRadius: 12.0,
          lat: 12.9650,
          lng: 77.6000,
        }
      },
      trustScoreHistory: {
        create: [
          { change: 0, reason: 'Initial baseline score', resultingScore: 100 },
          { change: 3, reason: 'Confirmed shift on site', resultingScore: 100 },
        ]
      }
    }
  });

  const worker3 = await prisma.user.create({
    data: {
      phone: '9800000003',
      name: 'Anil Rao',
      role: 'WORKER',
      profilePhoto: selfie3,
      trustScore: 92,
      workerProfile: {
        create: {
          trades: ['Electrician'],
          yearsExperience: 5,
          searchRadius: 20.0,
          lat: 12.9700,
          lng: 77.5900,
        }
      }
    }
  });

  const worker4 = await prisma.user.create({
    data: {
      phone: '9800000004',
      name: 'Mohan Lal',
      role: 'WORKER',
      profilePhoto: selfie4,
      trustScore: 88,
      workerProfile: {
        create: {
          trades: ['Painter', 'Tile Layer'],
          yearsExperience: 3,
          searchRadius: 10.0,
          lat: 12.9780,
          lng: 77.6100,
        }
      }
    }
  });

  const worker5 = await prisma.user.create({
    data: {
      phone: '9800000005',
      name: 'Sunita Devi',
      role: 'WORKER',
      profilePhoto: selfie5,
      trustScore: 96,
      workerProfile: {
        create: {
          trades: ['Helper/Unskilled Labor', 'Driver'],
          yearsExperience: 2,
          searchRadius: 15.0,
          lat: 12.9800,
          lng: 77.6200,
        }
      }
    }
  });

  // 6. WORKER CONTRACTOR LINKS
  await prisma.workerContractorLink.createMany({
    data: [
      { workerId: worker1.id, contractorId: contractor1.id, siteId: site1.id, status: 'ACTIVE' },
      { workerId: worker2.id, contractorId: contractor1.id, siteId: site1.id, status: 'ACTIVE' },
      { workerId: worker3.id, contractorId: contractor2.id, siteId: site2.id, status: 'ACTIVE' },
      { workerId: worker4.id, contractorId: contractor2.id, siteId: site2.id, status: 'PENDING' },
      { workerId: worker5.id, contractorId: contractor1.id, siteId: site1.id, status: 'ACTIVE' },
    ]
  });

  // 7. JOB APPLICATIONS
  await prisma.jobApplication.createMany({
    data: [
      { jobId: job1.id, workerId: worker1.id, status: 'ACCEPTED', distanceKm: 0.8 },
      { jobId: job2.id, workerId: worker3.id, status: 'ACCEPTED', distanceKm: 2.1 },
      { jobId: job3.id, workerId: worker2.id, status: 'PENDING', distanceKm: 1.5 },
      { jobId: job1.id, workerId: worker5.id, status: 'CONTACTED', distanceKm: 3.4 },
    ]
  });

  // 8. 10 DAYS OF ATTENDANCE HISTORY (Mix of confirmed, flagged, and pending)
  const now = new Date();
  const attendanceList = [];

  for (let i = 9; i >= 0; i--) {
    const shiftDate = new Date(now);
    shiftDate.setDate(shiftDate.getDate() - i);
    shiftDate.setHours(0, 0, 0, 0);

    const checkIn = new Date(shiftDate);
    checkIn.setHours(8, 30 + Math.floor(Math.random() * 20), 0);

    const checkOut = new Date(shiftDate);
    checkOut.setHours(17, 30 + Math.floor(Math.random() * 30), 0);

    // Ramesh Kumar attendance (Site 1)
    let status = 'CONFIRMED';
    let flagReason = null;
    if (i === 0) {
      status = 'PENDING'; // Today
    } else if (i === 3) {
      status = 'FLAGGED';
      flagReason = 'Selfie GPS location outside perimeter (0.8km deviation)';
    }

    attendanceList.push({
      workerId: worker1.id,
      siteId: site1.id,
      jobId: job1.id,
      date: shiftDate,
      checkInTime: checkIn,
      checkOutTime: i === 0 ? null : checkOut,
      checkInPhoto: selfie1,
      checkOutPhoto: i === 0 ? null : selfie1,
      checkInLat: 12.9716,
      checkInLng: 77.5946,
      checkOutLat: 12.9716,
      checkOutLng: 77.5946,
      confirmationStatus: status,
      flagReason,
      earnedAmount: 950,
    });

    // Suresh Verma attendance (Site 1)
    if (i % 2 === 0) {
      attendanceList.push({
        workerId: worker2.id,
        siteId: site1.id,
        jobId: job3.id,
        date: shiftDate,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        checkInPhoto: selfie2,
        checkOutPhoto: selfie2,
        checkInLat: 12.9716,
        checkInLng: 77.5946,
        confirmationStatus: 'CONFIRMED',
        earnedAmount: 850,
      });
    }

    // Anil Rao attendance (Site 2)
    if (i >= 2) {
      attendanceList.push({
        workerId: worker3.id,
        siteId: site2.id,
        jobId: job2.id,
        date: shiftDate,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        checkInPhoto: selfie3,
        checkOutPhoto: selfie3,
        checkInLat: 12.9698,
        checkInLng: 77.7499,
        confirmationStatus: 'CONFIRMED',
        earnedAmount: 1100,
      });
    }
  }

  for (const att of attendanceList) {
    await prisma.attendanceRecord.create({ data: att });
  }

  // 9. PAYMENT RECORDS (Including Cash, UPI, Full, Partial, Unpaid with past-due dates)
  const payDate1 = new Date(now);
  payDate1.setDate(payDate1.getDate() - 7);

  const payDate2 = new Date(now);
  payDate2.setDate(payDate2.getDate() - 2);

  const pastDue = new Date(now);
  pastDue.setDate(pastDue.getDate() - 3); // 3 days overdue

  await prisma.paymentRecord.createMany({
    data: [
      {
        workerId: worker1.id,
        contractorId: contractor1.id,
        siteId: site1.id,
        amount: 3800,
        mode: 'UPI',
        status: 'FULL',
        date: payDate1,
        dueDate: payDate1,
        notes: 'Weekly wage settlement for 4 confirmed shifts (Metro Site)',
      },
      {
        workerId: worker1.id,
        contractorId: contractor1.id,
        siteId: site1.id,
        amount: 1900,
        mode: 'CASH',
        status: 'PARTIAL',
        date: payDate2,
        dueDate: pastDue,
        notes: 'Partial advance against 3 working days. Balance pending.',
      },
      {
        workerId: worker2.id,
        contractorId: contractor1.id,
        siteId: site1.id,
        amount: 4250,
        mode: 'UPI',
        status: 'FULL',
        date: payDate1,
        dueDate: payDate1,
        notes: 'Full payment for 5 plumbing shifts',
      },
      {
        workerId: worker3.id,
        contractorId: contractor2.id,
        siteId: site2.id,
        amount: 5500,
        mode: 'UPI',
        status: 'FULL',
        date: payDate1,
        dueDate: payDate1,
        notes: 'Weekly electrical installation payment',
      },
      {
        workerId: worker4.id,
        contractorId: contractor2.id,
        siteId: site2.id,
        amount: 2400,
        mode: 'CASH',
        status: 'UNPAID',
        date: pastDue,
        dueDate: pastDue,
        notes: 'Tiling work settlement overdue by 3 days.',
      },
    ]
  });

  // 10. SAFETY REPORTS (Extreme heat & rain incidents)
  await prisma.safetyReport.createMany({
    data: [
      {
        siteId: site1.id,
        workerId: worker1.id,
        riskType: 'extreme_heat',
        temperature: 41.5,
        weatherDescription: 'Severe Heatwave Advisory (41.5°C)',
        details: 'Ambient heat exceeded 40°C threshold at 2 PM. Direct sun on top-tier scaffolding without shade net.',
        status: 'RESOLVED',
        resolutionNote: 'Contractor installed shade netting and instituted 15-minute mandatory hydration rotation.',
      },
      {
        siteId: site2.id,
        workerId: worker3.id,
        riskType: 'heavy_rain',
        temperature: 26.0,
        weatherDescription: 'Thunderstorm & Torrential Rain (14mm/hr)',
        details: 'Excavation trench flooded, high voltage electrical leads near standing water.',
        status: 'PENDING',
        resolutionNote: null,
      },
    ]
  });

  console.log('✅ Seeding completed successfully!');
  console.log('======================================================');
  console.log('Demo Credentials for Instant Review:');
  console.log('- WORKER 1: Phone: 9800000001 (Ramesh Kumar - Mason)');
  console.log('- WORKER 2: Phone: 9800000002 (Suresh Verma - Plumber)');
  console.log('- CONTRACTOR 1: Phone: 9876543210 (Rajesh Sharma - Apex Infra)');
  console.log('- CONTRACTOR 2: Phone: 9876543211 (Vikram Patel - Greenfield)');
  console.log('- ADMIN: Phone: 9999999999 (Officer Meera Sen)');
  console.log('Universal Demo OTP: 123456');
  console.log('======================================================');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
