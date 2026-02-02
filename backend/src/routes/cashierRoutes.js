const express = require('express');
const router = express.Router();
const cashierController = require('../controllers/cashierController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { restrictCashierActions } = require('../middleware/cashierPermissions');

// Import new controllers
const shiftController = require('../controllers/cashierShiftController');
const refundController = require('../controllers/cashierRefundController');
const dashboardController = require('../controllers/cashierDashboardController');

// All routes are protected and for cashier only
router.use(protect);
router.use(authorize('cashier', 'admin')); // Admins might want to see too

// ===== EXISTING ROUTES =====
router.get('/stats', cashierController.getDashboardStats);
router.get('/orders', cashierController.getOrders);
router.post('/verify/:orderId', cashierController.verifyPaymentStatus);

// Invoice and Reports
router.post('/generate-invoice/:orderId', cashierController.generateInvoice);
router.post('/refund/:paymentId', cashierController.initiateRefund);
router.get('/financial-report', cashierController.getFinancialReport);
router.post('/export-report', cashierController.exportReportPDF);

// ===== NEW SHIFT MANAGEMENT ROUTES =====
router.post('/shift/start', shiftController.startShift);
router.post('/shift/break', shiftController.takeBreak);
router.post('/shift/resume', shiftController.resumeShift);
router.post('/shift/end', shiftController.endShift);
router.get('/shift/current', shiftController.getCurrentShift);
router.get('/shift/history', shiftController.getShiftHistory);

// ===== NEW DASHBOARD & STATS ROUTES =====
router.get('/stats/today', dashboardController.getTodayStats);
router.get('/transactions/recent', dashboardController.getRecentTransactions);
router.get('/alerts', dashboardController.getAlerts);
router.get('/performance', dashboardController.getPerformance);

// ===== NEW REFUND MANAGEMENT ROUTES =====
router.post('/refund-v2/check-eligibility', refundController.checkRefundEligibility);
router.post('/refund-v2/initiate', refundController.initiateRefund);
router.post('/refund-v2/:id/approve', authorize('supervisor', 'manager', 'admin'), refundController.approveRefund);
router.post('/refund-v2/:id/complete', refundController.completeRefund);
router.get('/refund-v2/list', refundController.getRefunds);

module.exports = router;
