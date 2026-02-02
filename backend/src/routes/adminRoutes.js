const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  disableUser,
  enableUser,
  createAdminUser,
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  bulkExportData,
  createDeliveryPerson,
  getDashboardStats,
  getDetailedAnalytics,
  getAllPharmacies,
  getPharmacyById,
  getAllSubscriptions,
  activateSubscription,
  deactivateSubscription,
  renewSubscription,
  getAllAuditLogs,
  getSystemSettings,
  updateSystemSettings,
  getAdminNotifications,
  markAdminNotificationRead,
  clearAllAdminNotifications,
  forcePasswordReset,
  revokeSessions,
  deleteSubscription
} = require('../controllers/adminController');
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
router.post('/users/create-admin', logAdminAction('CREATE_ADMIN_USER', 'User'), createAdminUser);
router.get('/users/:id', getUserById);
router.patch('/users/:id/role', logAdminAction('UPDATE_USER_ROLE', 'User'), updateUserRole);
router.patch('/users/:id/disable', logAdminAction('DISABLE_USER', 'User'), disableUser);
router.patch('/users/:id/enable', logAdminAction('ENABLE_USER', 'User'), enableUser);
router.patch('/users/:id/reset-password', logAdminAction('RESET_PASSWORD', 'User'), forcePasswordReset);
router.patch('/users/:id/revoke-sessions', logAdminAction('REVOKE_SESSIONS', 'User'), revokeSessions);

// Pharmacy Management
router.get('/pharmacies', getAllPharmacies);
router.get('/pharmacies/:id', getPharmacyById);
// Registration Management
router.get('/registrations/pending', getPendingRegistrations);
router.post('/registrations/approve/:id', logAdminAction('APPROVE', 'USER'), approveRegistration);
router.post('/registrations/reject/:id', logAdminAction('REJECT', 'USER'), rejectRegistration);
router.post('/delivery-person', logAdminAction('CREATE_DELIVERY_PERSON', 'User'), createDeliveryPerson);

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
router.get('/audit', getAllAuditLogs);
// router.get('/monitoring/health', getSystemHealth); // TODO: Implement Monitoring

// Audit Logs
// router.get('/audit', getAuditLogs); // TODO: Implement Audit
// router.get('/audit/:id', getLogDetail);

// Communication
router.get('/notifications', getAdminNotifications);
router.patch('/notifications/:id/read', markAdminNotificationRead);
router.delete('/notifications', clearAllAdminNotifications);
// router.get('/communication/tickets', getAllSupportTickets); // TODO: Implement Communication
// router.post('/communication/announcements', logAdminAction('CREATE_ANNOUNCEMENT', 'Notification'), createAnnouncement);

// Data Management
// router.post('/data/backup', logAdminAction('TRIGGER_BACKUP', 'System'), triggerBackup);
router.post('/data/export', logAdminAction('TRIGGER_EXPORT', 'System'), bulkExportData); // Mapped triggerExport -> bulkExportData

// Analytics
router.get('/analytics/dashboard', getDashboardStats);
router.get('/analytics/detailed', getDetailedAnalytics);

// Subscription Management
router.get('/subscriptions', getAllSubscriptions);
router.post('/subscriptions/:id/activate', logAdminAction('ACTIVATE_SUBSCRIPTION', 'Pharmacy'), activateSubscription);
router.post('/subscriptions/:id/deactivate', logAdminAction('DEACTIVATE_SUBSCRIPTION', 'Pharmacy'), deactivateSubscription);
router.post('/subscriptions/:id/renew', logAdminAction('RENEW_SUBSCRIPTION', 'Pharmacy'), renewSubscription);
router.delete('/subscriptions/:id', logAdminAction('DELETE_SUBSCRIPTION', 'Subscription'), deleteSubscription);

// System Settings
router.get('/settings', getSystemSettings);
router.patch('/settings', logAdminAction('UPDATE_SETTINGS', 'System'), updateSystemSettings);
// router.get('/analytics/growth', getGrowthMetrics);
// router.get('/analytics/pharmacies', getPharmacyPerformance);

module.exports = router;

