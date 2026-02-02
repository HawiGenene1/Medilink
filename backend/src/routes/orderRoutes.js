const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getOrderTracking,
  getPharmacyOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { checkSubscription } = require('../middleware/subscriptionMiddleware');
const { checkOperationalPermission } = require('../middleware/pharmacyOwnerAuthMiddleware');

<<<<<<< HEAD
// Public route for creating orders (Customers)
router.post('/', authenticate, createOrder);

// Protected route for customers to get their orders
router.get('/', authenticate, getMyOrders);

// Pharmacy orders route
router.get(
  '/pharmacy/:pharmacyId',
  authenticate,
  authorize('admin', 'pharmacy_owner', 'staff', 'pharmacist', 'technician', 'assistant', 'cashier'),
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
  authorize('admin', 'pharmacy_owner', 'staff', 'pharmacist', 'technician', 'assistant', 'cashier'),
  checkSubscription,
  checkOperationalPermission('prepareOrders'),
  updateOrderStatus
);

// Live tracking route
router.get('/:id/tracking', authenticate, getOrderTracking);
=======
// Basic authentication middleware
const authenticateUser = authenticate;

// Public route for creating orders
router.post('/', authenticateUser, createOrder);

// Protected route for customers to get their orders
router.get('/', authenticateUser, getMyOrders);

// Protected route for getting specific order
router.get('/:id', authenticateUser, getOrderById);

// Protected route for canceling order
router.patch('/:id/cancel', authenticateUser, cancelOrder);

// Live tracking route
router.get('/:id/tracking', authenticateUser, getOrderTracking);
>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1

module.exports = router;
