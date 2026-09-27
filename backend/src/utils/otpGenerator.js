/**
 * Simulated OTP generator for prototype auth.
 * Default predictable code is 123456 or 4-6 random digits, logged to server console.
 */
function generateOTP() {
  // In development/prototype, we use a friendly default or 6-digit numeric string
  const otp = "123456";
  return otp;
}

module.exports = { generateOTP };
