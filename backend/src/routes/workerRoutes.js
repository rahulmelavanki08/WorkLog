const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(requireRole('WORKER', 'ADMIN'));

router.get('/dashboard', workerController.getDashboard);
router.get('/find-work', workerController.findWork);
router.post('/apply', workerController.applyJob);
router.get('/my-applications', workerController.getMyApplications);
router.post('/join-site', workerController.joinSiteDirect);
router.post('/checkin', workerController.performCheckIn);
router.post('/checkout', workerController.performCheckOut);
router.post('/safety-report', workerController.reportSafetyCondition);
router.get('/ledger', workerController.getWageLedger);
router.post('/dispute/generate', workerController.generateDisputeReport);
router.get('/dispute/:disputeId/pdf', workerController.downloadDisputePdf);

module.exports = router;
