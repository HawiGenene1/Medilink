const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { generatePassword } = require('../utils/passwordGenerator');
const { sendWelcomeEmail } = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { firstName, lastName, email, phone, role = 'customer' } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Generate a secure password for customers, or use provided one for other roles
    let password;
    if (role === 'customer') {
      password = generatePassword(12);
    } else {
      // For non-customer roles, password is required in the request
      if (!req.body.password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required for this user role',
        });
      }
      password = req.body.password;
    }

    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      phone,
      role,
      // Password will be hashed in the pre-save hook
      password
    });

    // Hash password and save user
    await user.save();
    
    // If this is a customer, send welcome email with generated password
    if (role === 'customer') {
      try {
        await sendWelcomeEmail(email, `${firstName} ${lastName}`, password);
        logger.info(`Welcome email sent to ${email}`);
      } catch (emailError) {
        // Log the error but don't fail the registration
        logger.error('Failed to send welcome email:', emailError);
      }
    }

    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken({ id: user._id, role: user.role });

    const { password: _pwd, ...safeUser } = user.toObject();

    return res.json({
      success: true,
      token,
      user: {
        id: safeUser._id,
        firstName: safeUser.firstName,
        lastName: safeUser.lastName,
        email: safeUser.email,
        role: safeUser.role,
        phone: safeUser.phone,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
};
