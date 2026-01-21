const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserDetail,
  updateUserStatus
} = require('../controllers/admin/userController');
const {
  getAllPharmacies,
  getPendingRequests,
  approvePharmacy,
  rejectPharmacy
} = require('../controllers/admin/pharmacyController');
const {
  getAllMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine
} = require('../controllers/admin/medicineController');
const {
  getAllOrders,
  getOrderDetail,
  updateOrderStatus
} = require('../controllers/admin/orderController');
const { getSystemHealth } = require('../controllers/admin/monitoringController');
const { getAuditLogs, getLogDetail } = require('../controllers/admin/auditController');
const { logAdminAction } = require('../middleware/auditMiddleware');
const {
  getAllSupportTickets,
  createAnnouncement
} = require('../controllers/admin/communicationController');
const {
  triggerBackup,
  triggerExport
} = require('../controllers/admin/dataController');

// @desc    Admin Health Check
router.get('/check', (req, res) => {
  res.json({
    success: true,
    message: 'Admin access verified',
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// User Management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetail);
router.patch('/users/:id/status', logAdminAction('UPDATE_USER_STATUS', 'User'), updateUserStatus);

// Pharmacy Management
router.get('/pharmacies', getAllPharmacies);
router.get('/pharmacies/pending', getPendingRequests);
router.post('/pharmacies/approve/:id', logAdminAction('APPROVE_PHARMACY', 'Pharmacy'), approvePharmacy);
router.post('/pharmacies/reject/:id', logAdminAction('REJECT_PHARMACY', 'Pharmacy'), rejectPharmacy);

// Medicine Repository Management
router.get('/medicines', getAllMedicines);
router.post('/medicines', logAdminAction('CREATE_MEDICINE', 'Medicine'), createMedicine);
router.put('/medicines/:id', logAdminAction('UPDATE_MEDICINE', 'Medicine'), updateMedicine);
router.delete('/medicines/:id', logAdminAction('DELETE_MEDICINE', 'Medicine'), deleteMedicine);

// Order Oversight
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderDetail);
router.patch('/orders/:id/status', logAdminAction('UPDATE_ORDER_STATUS', 'Order'), updateOrderStatus);

// Monitoring
router.get('/monitoring/health', getSystemHealth);

// Audit Logs
router.get('/audit', getAuditLogs);
router.get('/audit/:id', getLogDetail);

// Communication
router.get('/communication/tickets', getAllSupportTickets);
router.post('/communication/announcements', logAdminAction('CREATE_ANNOUNCEMENT', 'Notification'), createAnnouncement);

// Data Management
router.post('/data/backup', logAdminAction('TRIGGER_BACKUP', 'System'), triggerBackup);
router.post('/data/export', logAdminAction('TRIGGER_EXPORT', 'System'), triggerExport);

// Analytics
const {
  getDashboardStats,
  getGrowthMetrics,
  getPharmacyPerformance
} = require('../controllers/admin/analyticsController');

router.get('/analytics/dashboard', getDashboardStats);
router.get('/analytics/growth', getGrowthMetrics);
router.get('/analytics/pharmacies', getPharmacyPerformance);

module.exports = router;

