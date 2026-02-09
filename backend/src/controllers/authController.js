const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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

    // Find user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check status

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled. Please contact support.',
      });
    }

    if (user.status !== 'active') {
      let statusMessage = 'Your account is pending approval.';
      if (user.status === 'suspended') statusMessage = 'Your account has been suspended.';
      if (user.status === 'rejected') statusMessage = 'Your account application was rejected.';

      return res.status(403).json({
        success: false,
        message: statusMessage,
      });
    }

    // Pharmacy Status Check for pharmacy-related roles
    const pharmacyRoles = [
      'pharmacy_owner',
      'PHARMACY_OWNER',
      'pharmacy_admin',
      'staff',
      'pharmacist',
      'technician',
      'assistant',
      'pharmacy_staff',
      'cashier'
    ];

    if (pharmacyRoles.includes(user.role)) {
      let pharmacy = null;

      // If user has a pharmacyId, use it. Otherwise find pharmacy owned by this user
      if (user.pharmacyId) {
        pharmacy = await Pharmacy.findById(user.pharmacyId);
      } else if (user.role === 'pharmacy_owner' || user.role === 'PHARMACY_OWNER') {
        pharmacy = await Pharmacy.findOne({ owner: user._id });
      }

      if (pharmacy) {
        if (pharmacy.status !== 'approved') {
          return res.status(403).json({
            success: false,
            message: 'Your pharmacy is pending approval. You can login once the pharmacy registration is approved.',
          });
        }
        if (pharmacy.isActive === false) {
          return res.status(403).json({
            success: false,
            message: 'Your pharmacy is currently inactive. Please contact support.',
          });
        }
      } else if (user.role !== 'pharmacy_admin') {
        // If it's a pharmacy roles but no pharmacy is found, block access
        // Note: pharmacy_admin might be a platform-wide role that doesn't belong to a specific pharmacy
        // but the prompt mentions pharmacy owners, so we check carefully.
        // Let's check if pharmacy_admin is platform-level.
        // Based on model comments: "pharmacy_admin: Platform-level governance, compliance, and business control."
        // So pharmacy_admin might not have a specific pharmacyId.
      }
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate Token
    const token = generateToken({ userId: user._id, role: user.role });

    const { password: _pwd, ...safeUser } = user.toObject();

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
        status: safeUser.status,
        avatar: safeUser.avatar,
        mustChangePassword: safeUser.mustChangePassword,
        operationalPermissions: safeUser.operationalPermissions
      },
    });
  } catch (error) {
    console.error('Login error CRASH:', error); // Log full object
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
        status: user.status,
        avatar: user.avatar,
        operationalPermissions: user.operationalPermissions && user.operationalPermissions.toObject ? user.operationalPermissions.toObject() : user.operationalPermissions
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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

    // Only set status to active if the role doesn't require manual approval
    const manualApprovalRoles = ['delivery', 'pharmacy_admin'];
    if (!manualApprovalRoles.includes(user.role)) {
      user.status = 'active';
    }

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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  verifyEmail,
};
