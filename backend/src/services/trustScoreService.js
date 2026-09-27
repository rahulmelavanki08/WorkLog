const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Adjust a user's trust score and record an immutable entry in TrustScoreHistory.
 * Score is clamped between 0 and 100.
 * 
 * @param {string} userId - User ID to adjust
 * @param {number} changeAmount - Integer change (positive or negative)
 * @param {string} reason - Human-readable reason for the adjustment
 * @param {object} [tx] - Optional Prisma transaction client
 * @returns {Promise<{ newScore: number, history: object }>}
 */
async function adjustTrustScore(userId, changeAmount, reason, tx = prisma) {
  try {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, trustScore: true, role: true, name: true }
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const currentScore = user.trustScore ?? 100;
    let newScore = currentScore + changeAmount;
    // Clamp between 0 and 100
    if (newScore > 100) newScore = 100;
    if (newScore < 0) newScore = 0;

    const [updatedUser, history] = await Promise.all([
      tx.user.update({
        where: { id: userId },
        data: { trustScore: newScore }
      }),
      tx.trustScoreHistory.create({
        data: {
          userId,
          change: changeAmount,
          reason,
          resultingScore: newScore,
        }
      })
    ]);

    console.log(`[TrustScore] User: ${user.name} (${user.role}), Change: ${changeAmount > 0 ? '+' : ''}${changeAmount}, New Score: ${newScore} (${reason})`);
    return { newScore, history };
  } catch (error) {
    console.error(`[TrustScore] Error adjusting trust score for ${userId}:`, error);
    throw error;
  }
}

/**
 * Helper triggers for Contractor score events
 */
async function onContractorUnresolvedMismatch(contractorId, flagReason) {
  return adjustTrustScore(contractorId, -10, `Flagged mismatch unresolved for over 48 hours (${flagReason || 'Unspecified'})`);
}

async function onContractorLatePayment(contractorId, amount, daysLate) {
  return adjustTrustScore(contractorId, -15, `Payment of ₹${amount} logged as Partial/Unpaid past 7-day due date (${daysLate} days late)`);
}

async function onContractorOnTimePayment(contractorId, amount) {
  return adjustTrustScore(contractorId, 5, `Completed on-time full payment of ₹${amount}`);
}

/**
 * Helper triggers for Worker score events
 */
async function onWorkerConfirmedShift(workerId, dateStr) {
  return adjustTrustScore(workerId, 3, `Confirmed attendance for shift on ${dateStr || 'today'}`);
}

async function onWorkerMismatchUpheldByAdmin(workerId, reason) {
  return adjustTrustScore(workerId, -5, `Attendance mismatch upheld after Admin investigation: ${reason || 'Unspecified'}`);
}

module.exports = {
  adjustTrustScore,
  onContractorUnresolvedMismatch,
  onContractorLatePayment,
  onContractorOnTimePayment,
  onWorkerConfirmedShift,
  onWorkerMismatchUpheldByAdmin,
};
