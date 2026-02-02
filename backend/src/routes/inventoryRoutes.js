const express = require('express');
const router = express.Router();
const {
    getInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getInventoryAlerts,
    checkInventoryAlerts
} = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { checkSubscription } = require('../middleware/subscriptionMiddleware');

// All inventory routes require authentication
router.use(authenticate);

// Restrict to Staff, Owner, or Admin
router.use(authorize('staff', 'pharmacy_owner', 'admin', 'pharmacist', 'technician', 'assistant', 'cashier'));

// Inventory Routes
router.route('/')
    .get(getInventory)
    .post(checkSubscription, addInventoryItem);

// Alert Routes (must come before /:id to avoid conflicts)
router.route('/alerts')
    .get(getInventoryAlerts);

router.route('/check-alerts')
    .post(checkInventoryAlerts);

router.route('/:id')
    .put(checkSubscription, updateInventoryItem)
    .delete(checkSubscription, deleteInventoryItem);

module.exports = router;
