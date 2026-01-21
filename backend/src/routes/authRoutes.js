const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { login, getCurrentUser } = require('../controllers/authController');
const { protectAdmin } = require('../middleware/authMiddleware');

// @desc    Authenticate ADMIN & get token
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

// @desc    Get current admin
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protectAdmin, getCurrentUser);

module.exports = router;
