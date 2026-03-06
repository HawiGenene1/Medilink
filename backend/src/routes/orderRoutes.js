const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  createOrder,
  getMyOrders,
  getOrderDetails,
  cancelOrder,
  getOrderTracking,
  updateOrderAddress
} = require('../controllers/orderController');

// Public route for creating orders
router.post('/', authenticate, createOrder);

// Protected route for customers to get their orders
router.get('/', authenticate, getMyOrders);

// Protected route for getting specific order
router.get('/:id', authenticate, getOrderDetails);

// Protected route for canceling order
router.patch('/:id/cancel', authenticate, cancelOrder);

// Live tracking route
router.get('/:id/tracking', authenticate, getOrderTracking);

// Update delivery address
router.patch('/:id/address', authenticate, updateOrderAddress);

module.exports = router;
