const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { authenticate, authorize } = require('../middleware/authMiddleware'); // Import auth middleware
const medicineController = require('../controllers/medicineController');

const { checkSubscription } = require('../middleware/subscriptionMiddleware');

// Public routes
router.get('/', medicineController.getMedicines);

// Inventory alerts - Protected
router.get(
    '/alerts',
    authenticate,
    authorize('pharmacy_staff', 'pharmacy_admin', 'admin'),
    medicineController.getInventoryAlerts
);

router.get('/:id', medicineController.getMedicineById);

// Protected routes (Pharmacy Staff & Admin)
router.post(
    '/',
    authenticate,
    authorize('pharmacy_staff', 'pharmacy_admin', 'admin'),
    checkSubscription,
    medicineController.addMedicine
);

router.put(
    '/:id',
    authenticate,
    authorize('pharmacy_staff', 'pharmacy_admin', 'admin'),
    checkSubscription,
    medicineController.updateMedicine
);

router.delete(
    '/:id',
    authenticate,
    authorize('pharmacy_staff', 'pharmacy_admin', 'admin'),
    checkSubscription,
    medicineController.deleteMedicine
);

router.patch(
    '/:id/stock',
    authenticate,
    authorize('pharmacy_staff', 'pharmacy_admin'), // Stock updates likely specific to staff/admin of that pharmacy
    checkSubscription,
    medicineController.updateStock
);

module.exports = router;