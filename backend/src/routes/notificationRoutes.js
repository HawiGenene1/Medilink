const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getNotifications,
    getPharmacyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../controllers/notificationController');

// All routes require authentication
router.use(protect);

// Generic user notification routes
router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.put('/read-all', markAllAsRead); // For compatibility with PUT routes
router.patch('/:id/read', markAsRead);
router.put('/:id/read', markAsRead); // For compatibility with PUT routes

// Pharmacy-specific routes (with stronger authorization if needed)
router.get(
    '/pharmacy',
    authorize('pharmacy_owner', 'staff', 'pharmacy_staff', 'pharmacist', 'technician', 'assistant', 'cashier'),
    getPharmacyNotifications
);

router.delete('/:id', deleteNotification);

module.exports = router;
