const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { authenticate, authorize } = require('../middleware/authMiddleware'); // Import auth middleware
const medicineController = require('../controllers/medicineController');

const { checkOperationalPermission } = require('../middleware/pharmacyOwnerAuthMiddleware');
const { checkSubscription } = require('../middleware/subscriptionMiddleware');

// Public routes
router.get('/', medicineController.getMedicines);

// Inventory alerts - Protected
router.get(
    '/alerts',
    authenticate,
    authorize('admin', 'PHARMACY_OWNER', 'staff'),
    medicineController.getInventoryAlerts
);

router.get('/:id', medicineController.getMedicineById);

// Protected routes (Pharmacy Staff & Admin & Owner)
router.post(
    '/',
    authenticate,
    authorize('admin', 'PHARMACY_OWNER', 'staff'),
    checkSubscription,
    checkOperationalPermission('manageInventory'),
    medicineController.addMedicine
);

router.put(
    '/:id',
    authenticate,
    authorize('admin', 'PHARMACY_OWNER', 'staff'),
    checkSubscription,
    checkOperationalPermission('manageInventory'),
    medicineController.updateMedicine
);

router.delete(
    '/:id',
    authenticate,
    authorize('admin', 'PHARMACY_OWNER', 'staff'),
    checkSubscription,
    checkOperationalPermission('manageInventory'),
    medicineController.deleteMedicine
);

router.patch(
    '/:id/stock',
    authenticate,
    authorize('admin', 'PHARMACY_OWNER', 'staff'), // Stock updates
    checkSubscription,
    checkOperationalPermission('manageInventory'),
    medicineController.updateStock
);

module.exports = router;