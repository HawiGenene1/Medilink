const express = require('express');
const router = express.Router();
const {
    getPharmacyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../controllers/notificationController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Routes accessible by pharmacy owner and staff
router.get(
    '/',
    authorize('PHARMACY_OWNER', 'staff', 'pharmacy_staff', 'pharmacist'),
    getPharmacyNotifications
);

router.put(
    '/:id/read',
    authorize('PHARMACY_OWNER', 'staff', 'pharmacy_staff', 'pharmacist'),
    markAsRead
);

router.put(
    '/read-all',
    authorize('PHARMACY_OWNER', 'staff', 'pharmacy_staff', 'pharmacist'),
    markAllAsRead
);

router.delete(
    '/:id',
    authorize('PHARMACY_OWNER', 'staff', 'pharmacy_staff', 'pharmacist'),
    deleteNotification
);

module.exports = router;
