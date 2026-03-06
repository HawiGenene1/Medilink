const express = require('express');
const router = express.Router();
const {
    getPharmacyOrders,
    updateOrderStatus,
    verifyPrescription,
    requestPhysicalPrescription
} = require('../controllers/orderProcessingController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { checkSubscription } = require('../middleware/subscriptionMiddleware');

// All order processing routes require authentication and staff/owner role
router.use(authenticate);
router.use(authorize('staff', 'pharmacy_owner', 'admin', 'pharmacist', 'technician', 'assistant', 'cashier'));
router.use(checkSubscription);

// Routes
router.get('/', getPharmacyOrders);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/verify-prescription', verifyPrescription);
router.put('/:id/request-physical-prescription', requestPhysicalPrescription);

module.exports = router;
