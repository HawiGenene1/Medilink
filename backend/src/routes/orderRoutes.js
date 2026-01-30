const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getOrderTracking
} = require('../controllers/orderController');

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

module.exports = router;
