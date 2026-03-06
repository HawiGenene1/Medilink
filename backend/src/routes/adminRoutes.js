const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  disableUser,
  enableUser,
  getPendingRegistrations,
  getRegistrationDetails,
  approveRegistration,
  rejectRegistration,
  bulkExportData,
  createDeliveryPerson,
  getDashboardStats,
  createAdminUser,
  getAllPharmacies,
  getPharmacyById,
  updateUser,
  adminResetPassword,
  getAllOrders,
  toggleMaintenanceMode,
  getSystemSettings,
  getBackupHistory
} = require('../controllers/adminController');
const {
  getSystemHealth,
  getUserAnalytics,
  getOrderAnalytics,
  getRecentAuditLogs
} = require('../controllers/monitoringController');
const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement
} = require('../controllers/communicationController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { logAdminAction } = require('../middleware/auditMiddleware');

// Protect all routes
router.use(protect);
router.use(authorize('admin', 'system_admin'));

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

// Dashboard Stats
router.get('/dashboard/stats', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', logAdminAction('UPDATE_USER_PROFILE', 'User'), updateUser);
router.patch('/users/:id/role', logAdminAction('UPDATE_USER_ROLE', 'User'), updateUserRole);
router.patch('/users/:id/enable', logAdminAction('ENABLE_USER', 'User'), enableUser);
router.patch('/users/:id/disable', logAdminAction('DISABLE_USER', 'User'), disableUser);
router.patch('/users/:id/reset-password', logAdminAction('RESET_PASSWORD', 'User'), adminResetPassword);
router.get('/orders', getAllOrders);

// Pharmacy Admin Management
router.post('/create-admin', logAdminAction('CREATE_ADMIN_USER', 'User'), createAdminUser);

// Pharmacy Management
router.get('/pharmacies', getAllPharmacies);
router.get('/pharmacies/:id', getPharmacyById);

// Registration Management
router.get('/registrations/pending', getPendingRegistrations);
router.get('/registrations/pending/:id', getRegistrationDetails);
router.post('/registrations/:id/approve', logAdminAction('APPROVE_REGISTRATION', 'Pharmacy'), approveRegistration);
router.post('/registrations/:id/reject', logAdminAction('REJECT_REGISTRATION', 'Pharmacy'), rejectRegistration);

router.post('/delivery-person', logAdminAction('CREATE_DELIVERY_PERSON', 'User'), createDeliveryPerson);

// Monitoring & Analytics
router.get('/monitoring/health', getSystemHealth);
router.get('/analytics/users', getUserAnalytics);
router.get('/analytics/orders', getOrderAnalytics);
router.get('/audit-logs', getRecentAuditLogs);

// Data Management
router.get('/data/backups', getBackupHistory);
router.post('/data/backup/trigger', logAdminAction('TRIGGER_BACKUP', 'System'), (req, res) => res.json({ success: true, message: 'Backup triggered successfully' }));
router.post('/data/restore', logAdminAction('RESTORE_DATA', 'System'), (req, res) => res.json({ success: true, message: 'Data restoration in progress' }));
router.post('/data/export', logAdminAction('TRIGGER_EXPORT', 'System'), bulkExportData);

// Communication
router.get('/announcements', getAnnouncements);
router.post('/announcements', logAdminAction('CREATE_ANNOUNCEMENT', 'Notification'), createAnnouncement);
router.delete('/announcements/:id', logAdminAction('DELETE_ANNOUNCEMENT', 'Notification'), deleteAnnouncement);

// System Settings & Maintenance
router.get('/system/settings', getSystemSettings);
router.post('/system/maintenance', logAdminAction('TOGGLE_MAINTENANCE', 'System'), toggleMaintenanceMode);

module.exports = router;
