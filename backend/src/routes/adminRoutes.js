const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  disableUser,
  enableUser,
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  bulkExportData
} = require('../controllers/adminController'); // Fixed path to adminController
const { logAdminAction } = require('../middleware/auditMiddleware');

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
router.get('/users/:id', getUserById); // Mapped getUserDetail -> getUserById
router.patch('/users/:id/role', logAdminAction('UPDATE_USER_ROLE', 'User'), updateUserRole);
// router.patch('/users/:id/status', logAdminAction('UPDATE_USER_STATUS', 'User'), updateUserStatus); // TODO: Implement updateUserStatus or map to disable/enable

// Pharmacy Management
// router.get('/pharmacies', getAllPharmacies); // TODO: Implement getAllPharmacies
router.get('/pharmacies/pending', getPendingRegistrations); // Mapped getPendingRequests -> getPendingRegistrations
router.post('/pharmacies/approve/:id', logAdminAction('APPROVE_PHARMACY', 'Pharmacy'), approveRegistration); // Mapped approvePharmacy -> approveRegistration
router.post('/pharmacies/reject/:id', logAdminAction('REJECT_PHARMACY', 'Pharmacy'), rejectRegistration); // Mapped rejectPharmacy -> rejectRegistration

// Medicine Repository Management (TODO: Implement Medicine Controller)
// router.get('/medicines', getAllMedicines);
// router.post('/medicines', logAdminAction('CREATE_MEDICINE', 'Medicine'), createMedicine);
// router.put('/medicines/:id', logAdminAction('UPDATE_MEDICINE', 'Medicine'), updateMedicine);
// router.delete('/medicines/:id', logAdminAction('DELETE_MEDICINE', 'Medicine'), deleteMedicine);

// Order Oversight (TODO: Implement Order Controller)
// router.get('/orders', getAllOrders);
// router.get('/orders/:id', getOrderDetail);
// router.patch('/orders/:id/status', logAdminAction('UPDATE_ORDER_STATUS', 'Order'), updateOrderStatus);

// Monitoring
// router.get('/monitoring/health', getSystemHealth); // TODO: Implement Monitoring

// Audit Logs
// router.get('/audit', getAuditLogs); // TODO: Implement Audit
// router.get('/audit/:id', getLogDetail);

// Communication
// router.get('/communication/tickets', getAllSupportTickets); // TODO: Implement Communication
// router.post('/communication/announcements', logAdminAction('CREATE_ANNOUNCEMENT', 'Notification'), createAnnouncement);

// Data Management
// router.post('/data/backup', logAdminAction('TRIGGER_BACKUP', 'System'), triggerBackup);
router.post('/data/export', logAdminAction('TRIGGER_EXPORT', 'System'), bulkExportData); // Mapped triggerExport -> bulkExportData

// Analytics
// const {
//   getDashboardStats,
//   getGrowthMetrics,
//   getPharmacyPerformance
// } = require('../controllers/admin/analyticsController'); // TODO: Implement Analytics

// router.get('/analytics/dashboard', getDashboardStats);
// router.get('/analytics/growth', getGrowthMetrics);
// router.get('/analytics/pharmacies', getPharmacyPerformance);

module.exports = router;

