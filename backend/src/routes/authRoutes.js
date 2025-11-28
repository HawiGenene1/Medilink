const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getCurrentUser } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const {
  requestPasswordReset,
  resetPassword,
} = require("../controllers/passwordController");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// Custom validation middleware to handle conditional password requirement
const validateRegistration = [
  body('firstName', 'First name is required').not().isEmpty().trim(),
  body('lastName', 'Last name is required').not().isEmpty().trim(),
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('phone', 'Phone number is required').not().isEmpty().trim(),
  body('role', 'Invalid role').optional().isIn(['customer', 'pharmacy_staff', 'pharmacy_admin', 'cashier', 'delivery', 'admin']),
  // Password is required only for non-customer roles
  (req, res, next) => {
    const { role = 'customer' } = req.body;
    
    if (role !== 'customer' && !req.body.password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required for this user role',
      });
    }
    
    // For customer, password is auto-generated
    // For other roles, validate password if provided
    if (req.body.password) {
      body('password', 'Password must be at least 6 characters')
        .isLength({ min: 6 })
        .run(req);
    }
    
    next();
  }
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegistration, register);

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists()
  ],
  login
);

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticate, getCurrentUser);

// @desc    Request password reset
// @route   POST /api/auth/request-reset
// @access  Public
router.post("/request-reset", requestPasswordReset);

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
router.post("/reset-password/:token", resetPassword);

module.exports = router;
