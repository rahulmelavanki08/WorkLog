const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(requireRole('ADMIN'));

router.get('/dashboard', adminController.getDashboard);
router.get('/disputes', adminController.getDisputesAndSafetyReports);
router.post('/disputes/resolve', adminController.resolveDispute);
router.get('/links', adminController.getLinks);
router.post('/links/revoke', adminController.revokeLink);

module.exports = router;
