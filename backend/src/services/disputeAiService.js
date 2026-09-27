/**
 * Smart Dispute Assistant Service
 * Follows the required AI prompt template to generate neutral, plain-language wage dispute summaries.
 */

function generateDisputeSummary({
  workerName,
  contractorName,
  siteName,
  startDateStr,
  endDateStr,
  attendanceList,
  paymentList,
  dailyRate,
}) {
  const totalDaysLogged = attendanceList.length;
  const confirmedDays = attendanceList.filter(
    (a) => a.confirmationStatus === 'CONFIRMED'
  ).length;
  const pendingDays = attendanceList.filter(
    (a) => a.confirmationStatus === 'PENDING'
  ).length;
  const flaggedDays = attendanceList.filter(
    (a) => a.confirmationStatus === 'FLAGGED'
  ).length;

  const rate = Number(dailyRate) || 0;
  const totalEarned = confirmedDays * rate;

  const totalPaid = paymentList.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  const outstandingBalance = Math.max(0, totalEarned - totalPaid);

  // Exact prompt template representation for inspection
  const promptTemplate = `
You are helping generate a clear, neutral, plain-language wage dispute summary for a worker to share with their contractor or a labor authority. Do not take sides — state only the facts from the data provided.

Worker: ${workerName}
Contractor: ${contractorName}
Site/Job: ${siteName || 'All Sites'}
Date range: ${startDateStr} to ${endDateStr}

Attendance records:
${attendanceList
  .map(
    (a) =>
      `- Date: ${a.dateStr}, Check-in: ${a.checkInStr}, Check-out: ${
        a.checkOutStr || 'N/A'
      }, Status: ${a.confirmationStatus}`
  )
  .join('\n')}

Payment records:
${paymentList
  .map(
    (p) =>
      `- Date: ${p.dateStr}, Amount Paid: ₹${p.amount}, Status: ${p.status} (${p.mode})`
  )
  .join('\n')}

Agreed daily rate: ₹${rate}

Write a short summary (under 150 words) stating:
1. How many days were worked and confirmed vs. how many are still pending/disputed.
2. Total amount earned based on confirmed days.
3. Total amount paid so far.
4. The outstanding balance.
Use neutral, factual language only.
`.trim();

  // Neutral, factual plain-language summary compliant with all 4 points
  const summaryText = `Between ${startDateStr} and ${endDateStr}, worker ${workerName} logged a total of ${totalDaysLogged} shifts for contractor ${contractorName} at ${siteName || 'the designated work site'}. Out of these, ${confirmedDays} days are confirmed, ${pendingDays} days are pending confirmation, and ${flaggedDays} day(s) have been flagged as mismatched. At the agreed daily wage rate of ₹${rate.toLocaleString('en-IN')}, the total gross wages earned for confirmed attendance amount to ₹${totalEarned.toLocaleString('en-IN')}. Recorded payments received to date total ₹${totalPaid.toLocaleString('en-IN')}. Consequently, the verified outstanding balance currently payable to the worker is ₹${outstandingBalance.toLocaleString('en-IN')}.`;

  return {
    promptTemplate,
    summaryText,
    stats: {
      totalDaysLogged,
      confirmedDays,
      pendingDays,
      flaggedDays,
      dailyRate: rate,
      totalEarned,
      totalPaid,
      outstandingBalance,
    }
  };
}

module.exports = { generateDisputeSummary };
