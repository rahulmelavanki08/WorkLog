const express = require('express');
const router = express.Router();
const contractorController = require('../controllers/contractorController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(requireRole('CONTRACTOR', 'ADMIN'));

router.get('/dashboard', contractorController.getDashboard);
router.post('/site/new', contractorController.createSite);
router.get('/sites', contractorController.getSites);
router.post('/job/post', contractorController.postJob);
router.get('/jobs/manage', contractorController.getManageJobs);
router.patch('/job/:jobId/status', contractorController.updateJobStatus);
router.post('/applicant/accept', contractorController.acceptApplicant);
router.get('/attendance/pending', contractorController.getPendingAttendance);
router.post('/attendance/confirm', contractorController.confirmAttendance);
router.post('/attendance/flag', contractorController.flagAttendance);
router.post('/payment/log', contractorController.logPayment);
router.get('/payments', contractorController.getPaymentHistory);
router.get('/trust-score', contractorController.getTrustScore);
router.get('/safety-reports', contractorController.getSafetyReports);
router.post('/safety-reports/resolve', contractorController.resolveSafetyReport);

module.exports = router;

