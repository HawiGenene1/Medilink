const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  createOrder,
  getMyOrders,
  getOrderDetails,
  cancelOrder,
  getOrderTracking,
  getPharmacyOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { checkSubscription } = require('../middleware/subscriptionMiddleware');
const { checkOperationalPermission } = require('../middleware/pharmacyOwnerAuthMiddleware');

// Public route for creating orders (Customers)
router.post('/', authenticate, createOrder);

// Protected route for customers to get their orders
router.get('/', authenticate, getMyOrders);

// Pharmacy orders route
router.get(
  '/pharmacy/:pharmacyId',
  authenticate,
  authorize('admin', 'PHARMACY_OWNER', 'staff'),
  checkSubscription,
  getPharmacyOrders
);

// Protected route for getting specific order
router.get('/:id', authenticate, getOrderDetails);

// Protected route for canceling order
router.patch('/:id/cancel', authenticate, cancelOrder);

// Order status update (Pharmacy Staff)
router.put(
  '/:orderId/status',
  authenticate,
  authorize('admin', 'PHARMACY_OWNER', 'staff'),
  checkSubscription,
  checkOperationalPermission('prepareOrders'),
  updateOrderStatus
);

// Live tracking route
router.get('/:id/tracking', authenticate, getOrderTracking);

module.exports = router;
