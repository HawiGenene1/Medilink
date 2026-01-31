const express = require('express');
const router = express.Router();
const {
    getInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
} = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { checkSubscription } = require('../middleware/subscriptionMiddleware');

// All inventory routes require authentication
router.use(authenticate);

// Restrict to Staff, Owner, or Admin
router.use(authorize('staff', 'PHARMACY_OWNER', 'admin', 'pharmacist', 'cashier'));

// Inventory Routes
router.route('/')
    .get(getInventory)
    .post(checkSubscription, addInventoryItem);

router.route('/:id')
    .put(checkSubscription, updateInventoryItem)
    .delete(checkSubscription, deleteInventoryItem);

module.exports = router;
