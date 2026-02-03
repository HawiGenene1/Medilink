const User = require('../models/User');
const Role = require('../models/Role');
const { generateToken } = require('../config/jwt');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { generatePassword } = require('../utils/passwordGenerator');
const { sendWelcomeEmail } = require('../services/emailService');
const logger = require('../utils/logger');
const crypto = require('crypto');

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

    const { firstName, lastName, email, phone, role, vehicleInfo } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Role safety: only allow customer and delivery to be requested via public registration
    const targetRole = (role === 'delivery' || role === 'customer') ? role : 'customer';

    // Status: Customers are active immediately (their password is proof of email access),
    // others (delivery) are pending manual approval.
    const initialStatus = (targetRole === 'customer') ? 'active' : 'pending';

    // Generate a secure password
    const password = generatePassword(12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      phone,
      role: targetRole,
      status: initialStatus,
      password,
      verificationToken,
      verificationTokenExpires,
      vehicleInfo: targetRole === 'delivery' ? vehicleInfo : undefined
    });

    // Hash password and save user
    await user.save();

    // Non-blocking welcome email delivery with verification token
    sendWelcomeEmail(email, `${firstName} ${lastName}`, password, verificationToken, targetRole)
      .then(() => logger.info(`Welcome email sent to ${email} as ${targetRole}`))
      .catch((emailError) => logger.error('Failed to send welcome email:', emailError));

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for your generated password and activation link.',
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
    console.log('LOGIN DEBUG: Attempting login for:', email);

    // Find user
    const user = await User.findOne({ email }).select('+password');
    console.log('LOGIN DEBUG: User found:', user ? user._id : 'NO USER');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check status
    console.log('LOGIN DEBUG: Checking status. Role:', user.role, 'Status:', user.status, 'isActive:', user.isActive);

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled. Please contact support.',
      });
    }

    if (user.status !== 'active' && !(user.status === 'pending' && (user.role === 'delivery' || user.role === 'pharmacy_admin'))) {
      let statusMessage = 'Your account is pending approval.';
      if (user.status === 'suspended') statusMessage = 'Your account has been suspended.';
      if (user.status === 'rejected') statusMessage = 'Your account application was rejected.';

      console.log('LOGIN DEBUG: Account not active:', statusMessage);
      return res.status(403).json({
        success: false,
        message: statusMessage,
      });
    }

    // Verify Password
    console.log('LOGIN DEBUG: Verifying password...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('LOGIN DEBUG: Password match result:', isMatch);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate Token
    console.log('LOGIN DEBUG: Generating token...');
    const token = generateToken({ userId: user._id, role: user.role });
    console.log('LOGIN DEBUG: Token generated.');

    const { password: _pwd, ...safeUser } = user.toObject();

    console.log('LOGIN DEBUG: Sending response.');
    return res.json({
      success: true,
      token,
      user: {
        id: safeUser._id,
        _id: safeUser._id,
        firstName: safeUser.firstName,
        lastName: safeUser.lastName,
        email: safeUser.email,
        role: safeUser.role,
        phone: safeUser.phone,
        status: safeUser.status,
        avatar: safeUser.avatar,
        mustChangePassword: safeUser.mustChangePassword
      },
    });
  } catch (error) {
    console.error('Login error CRASH:', error); // Log full object
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
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role, // Fixed: role is a string
        phone: user.phone,
        status: user.status,
        avatar: user.avatar
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

/**
 * @route   POST /api/auth/register-pharmacy
 * @desc    Register a new pharmacy owner
 * @access  Public
 */
const registerPharmacy = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { firstName, lastName, email, phone } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Generate a secure password
    const password = generatePassword(12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create new user (Pharmacy Admin, Pending status)
    user = new User({
      firstName,
      lastName,
      email,
      phone,
      role: 'pharmacy_admin',
      status: 'pending',
      password,
      verificationToken,
      verificationTokenExpires
    });

    // Hash password and save user
    await user.save();

    // Non-blocking welcome email delivery with verification token
    sendWelcomeEmail(email, `${firstName} ${lastName}`, password, verificationToken, 'pharmacy_admin')
      .then(() => logger.info(`Pharmacy welcome email sent to ${email}`))
      .catch((emailError) => logger.error('Failed to send pharmacy welcome email:', emailError));

    return res.status(201).json({
      success: true,
      message: 'Pharmacy registration submitted successfully. Your account is pending approval.',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status
        },
      },
    });
  } catch (error) {
    console.error('Pharmacy registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during pharmacy registration',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email & activate account
 * @access  Public
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const now = new Date();
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: now }
    });

    if (!user) {
      console.warn(`Verification failed for token: ${token}`);
      const expiredUser = await User.findOne({ verificationToken: token });
      if (expiredUser) {
        return res.status(400).json({
          success: false,
          message: 'Verification link has expired. Please register again.',
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token.',
      });
    }

    user.isEmailVerified = true;
    user.status = 'active';
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return res.json({
      success: true,
      message: 'Account activated successfully! You can now log in.',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during email verification',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  verifyEmail,
};
