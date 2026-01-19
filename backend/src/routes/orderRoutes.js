const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  createOrder,
  getMyOrders,
  getOrderDetails,
  cancelOrder,
  getOrderTracking
} = require('../controllers/orderController');

// Development bypass middleware
const devAuth = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      userId: 'dev-user-123',
      email: 'dev@example.com',
      role: 'customer'
    };
    return next();
  }
  return authenticate(req, res, next);
};

// Public route for creating orders
router.post('/', devAuth, createOrder);

// Protected route for customers to get their orders
router.get('/', devAuth, getMyOrders);

// Protected route for getting specific order
router.get('/:id', devAuth, getOrderDetails);

// Protected route for canceling order
router.patch('/:id/cancel', devAuth, cancelOrder);

// Live tracking route
router.get('/:id/tracking', devAuth, getOrderTracking);

module.exports = router;
