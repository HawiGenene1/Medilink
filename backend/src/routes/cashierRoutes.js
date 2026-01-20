const express = require('express');
const router = express.Router();
const cashierController = require('../controllers/cashierController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { restrictCashierActions } = require('../middleware/cashierPermissions');

// All routes are protected and for cashier only
router.use(protect);
router.use(authorize('cashier', 'admin')); // Admins might want to see too

router.get('/stats', cashierController.getDashboardStats);
router.get('/orders', cashierController.getOrders);
router.post('/verify/:orderId', cashierController.verifyPaymentStatus);

// New features
router.post('/generate-invoice/:orderId', cashierController.generateInvoice);
router.post('/refund/:paymentId', cashierController.initiateRefund);
router.get('/financial-report', cashierController.getFinancialReport);
router.post('/export-report', cashierController.exportReportPDF);

module.exports = router;
