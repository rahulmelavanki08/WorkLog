const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/request-otp', authController.requestOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/register/worker', authController.registerWorker);
router.post('/register/contractor', authController.registerContractor);
router.post('/demo-login', authController.demoLogin);
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
