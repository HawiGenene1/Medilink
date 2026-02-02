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
    authorize('pharmacy_owner', 'staff', 'pharmacy_staff', 'pharmacist', 'technician', 'assistant', 'cashier'),
    getPharmacyNotifications
);

router.put(
    '/:id/read',
    authorize('pharmacy_owner', 'staff', 'pharmacy_staff', 'pharmacist', 'technician', 'assistant', 'cashier'),
    markAsRead
);

router.put(
    '/read-all',
    authorize('pharmacy_owner', 'staff', 'pharmacy_staff', 'pharmacist', 'technician', 'assistant', 'cashier'),
    markAllAsRead
);

router.delete(
    '/:id',
    authorize('pharmacy_owner', 'staff', 'pharmacy_staff', 'pharmacist', 'technician', 'assistant', 'cashier'),
    deleteNotification
);

module.exports = router;
