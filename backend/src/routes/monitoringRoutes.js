const express = require('express');
const router = express.Router();
const {
  getSystemOverview,
  getSystemHealth,
  getUserAnalytics,
  getPharmacyAnalytics,
  getOrderAnalytics,
  getRecentAuditLogs
} = require('../controllers/monitoringController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);
router.use(authorize('admin', 'system_admin', 'pharmacy_admin'));

// System overview and health
router.get('/overview', getSystemOverview);
router.get('/health', getSystemHealth);

// Analytics endpoints
router.get('/analytics/users', getUserAnalytics);
router.get('/analytics/pharmacies', getPharmacyAnalytics);
router.get('/analytics/orders', getOrderAnalytics);

// Audit logs
router.get('/audit-logs', getRecentAuditLogs);

module.exports = router;
