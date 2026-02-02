const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const {
    getPharmacyNotifications,
=======
const { protect } = require('../middleware/authMiddleware');
const {
    getNotifications,
>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../controllers/notificationController');

<<<<<<< HEAD
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
=======
router.use(protect);

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);
>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1

module.exports = router;
