const PDFDocument = require('pdfkit');

/**
 * Generate a PDF stream or buffer for a wage dispute report
 */
function createDisputePdf({
  workerName,
  workerPhone,
  contractorName,
  siteName,
  startDateStr,
  endDateStr,
  summaryText,
  stats,
  attendanceList,
  paymentList,
}) {
  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
    info: {
      Title: `WorkLog_Dispute_Report_${workerName.replace(/\s+/g, '_')}`,
      Author: 'WorkLog Platform',
      Subject: 'Official Wage Verification & Attendance Evidence Packet',
    }
  });

  // Theme Colors
  const teal = '#0F6E56';
  const coral = '#D85A30';
  const dark = '#1F2937';
  const gray = '#6B7280';
  const lightBg = '#F3F4F6';

  // --- HEADER ---
  doc.rect(40, 40, 515, 65).fill(teal);
  
  doc.fillColor('#FFFFFF')
     .fontSize(22)
     .font('Helvetica-Bold')
     .text('WorkLog', 55, 52);
  
  doc.fontSize(10)
     .font('Helvetica')
     .text('FIND IT, PROVE IT', 55, 78);

  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('OFFICIAL WAGE & ATTENDANCE REPORT', 240, 56, { align: 'right', width: 300 });

  doc.fontSize(8)
     .font('Helvetica')
     .text(`Generated: ${new Date().toLocaleDateString('en-IN')} | Ref: WL-${Date.now().toString(36).toUpperCase()}`, 240, 78, { align: 'right', width: 300 });

  doc.moveDown(3);

  // --- PARTY DETAILS ---
  let yPos = 120;
  doc.rect(40, yPos, 515, 65).fillAndStroke('#F9FAFB', '#E5E7EB');
  
  doc.fillColor(dark).fontSize(10).font('Helvetica-Bold');
  doc.text('WORKER DETAILS', 55, yPos + 12);
  doc.font('Helvetica').fontSize(9).fillColor(gray);
  doc.text(`Name: `, 55, yPos + 28).fillColor(dark).text(workerName, 95, yPos + 28);
  doc.fillColor(gray).text(`Phone: `, 55, yPos + 44).fillColor(dark).text(workerPhone || 'N/A', 95, yPos + 44);

  doc.font('Helvetica-Bold').fontSize(10).fillColor(dark);
  doc.text('CONTRACTOR & SITE', 310, yPos + 12);
  doc.font('Helvetica').fontSize(9).fillColor(gray);
  doc.text(`Contractor: `, 310, yPos + 28).fillColor(dark).text(contractorName, 380, yPos + 28);
  doc.fillColor(gray).text(`Site / Project: `, 310, yPos + 44).fillColor(dark).text(siteName || 'All Sites', 380, yPos + 44);

  // --- SUMMARY SECTION ---
  yPos = 200;
  doc.fillColor(teal).fontSize(12).font('Helvetica-Bold').text('Summary of Wage & Attendance Records', 40, yPos);
  
  yPos += 20;
  doc.rect(40, yPos, 515, 65).fillAndStroke('#F0FDF4', '#86EFAC');
  doc.fillColor(dark).fontSize(9).font('Helvetica').text(summaryText, 50, yPos + 10, {
    width: 495,
    lineGap: 3,
  });

  // --- FINANCIAL STATS CARDS ---
  yPos = 295;
  const cardWidth = 120;
  const cardGap = 11;
  const cards = [
    { label: 'Confirmed Days', val: `${stats.confirmedDays} / ${stats.totalDaysLogged}`, color: teal },
    { label: 'Agreed Daily Rate', val: `₹${stats.dailyRate}`, color: dark },
    { label: 'Total Earned', val: `₹${stats.totalEarned.toLocaleString('en-IN')}`, color: teal },
    { label: 'Outstanding Balance', val: `₹${stats.outstandingBalance.toLocaleString('en-IN')}`, color: coral },
  ];

  cards.forEach((card, idx) => {
    const x = 40 + idx * (cardWidth + cardGap);
    doc.rect(x, yPos, cardWidth, 48).fillAndStroke('#FFFFFF', '#D1D5DB');
    doc.fillColor(gray).fontSize(7.5).font('Helvetica').text(card.label, x + 8, yPos + 8);
    doc.fillColor(card.color).fontSize(12).font('Helvetica-Bold').text(card.val, x + 8, yPos + 24);
  });

  // --- ATTENDANCE EVIDENCE TABLE ---
  yPos = 360;
  doc.fillColor(teal).fontSize(11).font('Helvetica-Bold').text('Verified Attendance Evidence Log', 40, yPos);
  
  yPos += 18;
  // Table Header
  doc.rect(40, yPos, 515, 20).fill(teal);
  doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
  doc.text('Date', 45, yPos + 6);
  doc.text('Check-In Time', 115, yPos + 6);
  doc.text('Check-Out Time', 205, yPos + 6);
  doc.text('GPS Coords / Status', 295, yPos + 6);
  doc.text('Daily Status', 445, yPos + 6);

  yPos += 20;
  doc.font('Helvetica').fontSize(8);

  const displayList = attendanceList.slice(0, 10);
  displayList.forEach((att, index) => {
    const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
    doc.rect(40, yPos, 515, 20).fill(rowBg);
    
    doc.fillColor(dark).text(att.dateStr || 'N/A', 45, yPos + 6);
    doc.text(att.checkInStr || 'N/A', 115, yPos + 6);
    doc.text(att.checkOutStr || '—', 205, yPos + 6);
    doc.text(att.gpsStr || 'GPS Verified', 295, yPos + 6);
    
    // Status text with color
    if (att.confirmationStatus === 'CONFIRMED') {
      doc.fillColor('#15803D').text('CONFIRMED', 445, yPos + 6);
    } else if (att.confirmationStatus === 'FLAGGED') {
      doc.fillColor(coral).text('FLAGGED MISMATCH', 445, yPos + 6);
    } else {
      doc.fillColor('#CA8A04').text('PENDING', 445, yPos + 6);
    }

    yPos += 20;
  });

  // --- PAYMENT LOG TABLE ---
  if (paymentList && paymentList.length > 0) {
    yPos += 15;
    if (yPos > 680) {
      doc.addPage();
      yPos = 40;
    }
    doc.fillColor(teal).fontSize(11).font('Helvetica-Bold').text('Logged Payment Records', 40, yPos);
    yPos += 16;

    doc.rect(40, yPos, 515, 20).fill('#374151');
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
    doc.text('Payment Date', 45, yPos + 6);
    doc.text('Amount (₹)', 160, yPos + 6);
    doc.text('Payment Mode', 270, yPos + 6);
    doc.text('Status', 380, yPos + 6);

    yPos += 20;
    paymentList.forEach((pmt, idx) => {
      const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
      doc.rect(40, yPos, 515, 20).fill(rowBg);
      doc.fillColor(dark).font('Helvetica').fontSize(8);
      doc.text(pmt.dateStr || 'N/A', 45, yPos + 6);
      doc.font('Helvetica-Bold').text(`₹${Number(pmt.amount).toLocaleString('en-IN')}`, 160, yPos + 6);
      doc.font('Helvetica').text(pmt.mode || 'CASH', 270, yPos + 6);
      
      if (pmt.status === 'FULL') {
        doc.fillColor('#15803D').text('FULL (On-Time)', 380, yPos + 6);
      } else {
        doc.fillColor(coral).text(pmt.status, 380, yPos + 6);
      }
      yPos += 20;
    });
  }

  // --- FOOTER & DISCLAIMER ---
  const footerY = 740;
  doc.rect(40, footerY, 515, 1).fill('#D1D5DB');
  doc.fillColor(gray).fontSize(7.5).font('Helvetica').text(
    'This document is generated automatically by WorkLog platform based on tamper-resistant photographic and GPS-stamped check-ins. It constitutes factual electronic evidence of labor performed and outstanding wages.',
    40,
    footerY + 8,
    { width: 515, align: 'center' }
  );

  return doc;
}

module.exports = { createDisputePdf };
