const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { generateOTP } = require('../utils/otpGenerator');
const { storageService } = require('../services/storageService');

const prisma = new PrismaClient();

// In-memory simulated OTP store for demo prototype
const otpStore = new Map();

/**
 * Request OTP for phone number
 */
async function requestOtp(req, res) {
  try {
    const { phone } = req.body;
    if (!phone || phone.trim().length < 6) {
      return res.status(400).json({ error: 'Valid phone number is required (min 6 digits)' });
    }

    const cleanedPhone = phone.trim().replace(/\s+/g, '');
    const otp = generateOTP();
    otpStore.set(cleanedPhone, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    console.log(`\n========================================`);
    console.log(`[WorkLog OTP] Sent to ${cleanedPhone} => OTP: ${otp}`);
    console.log(`========================================\n`);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: cleanedPhone },
      include: { workerProfile: true }
    });

    res.json({
      success: true,
      message: 'OTP sent successfully (Simulated prototype)',
      phone: cleanedPhone,
      otp, // Included in response for seamless prototype demo testing!
      isRegistered: !!existingUser,
      existingRole: existingUser ? existingUser.role : null,
      existingName: existingUser ? existingUser.name : null,
    });
  } catch (error) {
    console.error('[AuthController.requestOtp] Error:', error);
    res.status(500).json({ error: 'Failed to generate OTP' });
  }
}

/**
 * Verify OTP and authenticate / generate session JWT
 */
async function verifyOtp(req, res) {
  try {
    const { phone, otp, requestedRole } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    const cleanedPhone = phone.trim().replace(/\s+/g, '');
    const stored = otpStore.get(cleanedPhone);

    // Accept stored OTP or the universal demo OTP '123456'
    if (otp !== '123456' && (!stored || stored.otp !== otp || stored.expiresAt < Date.now())) {
      return res.status(400).json({ error: 'Invalid or expired OTP. Please use 123456 or request a new OTP.' });
    }

    // Lookup user
    let user = await prisma.user.findUnique({
      where: { phone: cleanedPhone },
      include: { workerProfile: true }
    });

    if (!user) {
      // User is not yet registered, return prompt to complete registration
      return res.json({
        success: true,
        isNewUser: true,
        phone: cleanedPhone,
        message: 'OTP verified. Please complete your registration details.'
      });
    }

    // Role verification / update if needed
    if (requestedRole && requestedRole.toUpperCase() !== user.role) {
      // Return note if role differs or keep user's existing registered role
    }

    // Sign JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      isNewUser: false,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        trustScore: user.trustScore,
        profilePhoto: user.profilePhoto,
        workerProfile: user.workerProfile,
      }
    });
  } catch (error) {
    console.error('[AuthController.verifyOtp] Error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
}

/**
 * Complete Worker Registration
 */
async function registerWorker(req, res) {
  try {
    const { phone, name, trades, otherTrade, yearsExperience, searchRadius, profilePhoto, lat, lng } = req.body;
    
    if (!phone || !name || !trades || !Array.isArray(trades) || trades.length === 0) {
      return res.status(400).json({ error: 'Phone, name, and at least one selected trade are required.' });
    }

    const cleanedPhone = phone.trim().replace(/\s+/g, '');

    // Check if phone already registered
    const existing = await prisma.user.findUnique({ where: { phone: cleanedPhone } });
    if (existing) {
      return res.status(400).json({ error: 'A user with this phone number is already registered. Please login.' });
    }

    let photoUrl = null;
    if (profilePhoto) {
      try {
        photoUrl = await storageService.savePhoto(profilePhoto, 'worker_avatar');
      } catch (err) {
        console.warn('Could not save profile photo, continuing without photo:', err.message);
      }
    }

    // Create User and WorkerProfile in transaction
    const user = await prisma.user.create({
      data: {
        phone: cleanedPhone,
        name: name.trim(),
        role: 'WORKER',
        profilePhoto: photoUrl,
        trustScore: 100,
        workerProfile: {
          create: {
            trades,
            otherTrade: otherTrade || null,
            yearsExperience: Number(yearsExperience) || 1,
            searchRadius: Number(searchRadius) || 10.0,
            lat: lat ? Number(lat) : 12.9716, // Default Bangalore coordinates for demo
            lng: lng ? Number(lng) : 77.5946,
          }
        }
      },
      include: {
        workerProfile: true
      }
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Worker registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        trustScore: user.trustScore,
        profilePhoto: user.profilePhoto,
        workerProfile: user.workerProfile,
      }
    });
  } catch (error) {
    console.error('[AuthController.registerWorker] Error:', error);
    res.status(500).json({ error: 'Registration failed. ' + error.message });
  }
}

/**
 * Complete Contractor Registration
 */
async function registerContractor(req, res) {
  try {
    const { phone, name, companyName, profilePhoto } = req.body;
    
    if (!phone || !name) {
      return res.status(400).json({ error: 'Phone and name / company name are required.' });
    }

    const cleanedPhone = phone.trim().replace(/\s+/g, '');

    const existing = await prisma.user.findUnique({ where: { phone: cleanedPhone } });
    if (existing) {
      return res.status(400).json({ error: 'A user with this phone number is already registered. Please login.' });
    }

    let photoUrl = null;
    if (profilePhoto) {
      try {
        photoUrl = await storageService.savePhoto(profilePhoto, 'contractor_logo');
      } catch (err) {
        console.warn('Could not save photo:', err.message);
      }
    }

    const user = await prisma.user.create({
      data: {
        phone: cleanedPhone,
        name: name.trim(),
        role: 'CONTRACTOR',
        profilePhoto: photoUrl,
        trustScore: 100,
      }
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Contractor registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        trustScore: user.trustScore,
        profilePhoto: user.profilePhoto,
      }
    });
  } catch (error) {
    console.error('[AuthController.registerContractor] Error:', error);
    res.status(500).json({ error: 'Registration failed. ' + error.message });
  }
}

/**
 * Get current authenticated user profile & trust score
 */
async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        workerProfile: true,
        sites: true,
        trustScoreHistory: {
          orderBy: { date: 'desc' },
          take: 10,
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        trustScore: user.trustScore,
        profilePhoto: user.profilePhoto,
        workerProfile: user.workerProfile,
        sites: user.sites,
        trustScoreHistory: user.trustScoreHistory,
      }
    });
  } catch (error) {
    console.error('[AuthController.getMe] Error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

/**
 * Instant Demo Login for reviewers (Worker, Contractor, Admin)
 */
async function demoLogin(req, res) {
  try {
    const { role } = req.body; // 'WORKER' | 'CONTRACTOR' | 'ADMIN'
    const targetRole = (role || 'WORKER').toUpperCase();

    // Find the first user with this role
    let user = await prisma.user.findFirst({
      where: { role: targetRole },
      include: { workerProfile: true, sites: true }
    });

    if (!user) {
      return res.status(404).json({ error: `No demo account found for role ${targetRole}. Please run the seed script.` });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: `Logged in as Demo ${user.role} (${user.name})`,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        trustScore: user.trustScore,
        profilePhoto: user.profilePhoto,
        workerProfile: user.workerProfile,
        sites: user.sites,
      }
    });
  } catch (error) {
    console.error('[AuthController.demoLogin] Error:', error);
    res.status(500).json({ error: 'Demo login failed' });
  }
}

module.exports = {
  requestOtp,
  verifyOtp,
  registerWorker,
  registerContractor,
  getMe,
  demoLogin,
};
