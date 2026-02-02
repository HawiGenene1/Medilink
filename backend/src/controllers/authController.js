const User = require('../models/User');
const PendingPharmacy = require('../models/PendingPharmacy');
const PendingDeliveryPerson = require('../models/PendingDeliveryPerson');
const { generateToken } = require('../config/jwt');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { generatePassword } = require('../utils/passwordGenerator');
const { sendWelcomeEmail } = require('../services/emailService');
const logger = require('../utils/logger');
const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');

// Function to generate a unique username
const generateUsername = async (firstName, lastName) => {
  if (!firstName || !lastName) {
    throw new Error('First name and last name are required');
  }

  // Create base username (e.g., 'john.doe')
  const baseUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/[^a-z0-9.]/g, '');
  let username = baseUsername;
  let counter = 1;
  let userExists = true;

  // Check if username exists and append number if it does
  while (userExists) {
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      userExists = false;
    } else {
      username = `${baseUsername}${counter}`;
      counter++;
    }
  }

  return username;
};

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

    const userRole = role || 'customer';

    // Restrict public registration roles
    const allowedPublicRoles = ['customer', 'pharmacy_admin'];
    if (!allowedPublicRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized role for public registration.'
      });
    }

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

    // Generate a unique username
    const username = await generateUsername(firstName, lastName);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      username,
      phone,
      role: userRole,
      status: userRole === 'customer' ? 'active' : 'pending',
      isEmailVerified: userRole === 'customer' ? true : false,
      password,
      verificationToken,
      verificationTokenExpires
    });

    // Hash password and save user
    await user.save();

    // Create Pending Records for specific roles
    if (userRole === 'pharmacy_admin' && additionalData) {
      const pendingPharmacy = new PendingPharmacy({
        userId: user._id,
        name: additionalData.pharmacyName,
        email: user.email,
        phone: user.phone,
        licenseNumber: additionalData.licenseNumber,
        address: additionalData.address,
        contactPerson: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone,
          position: 'Owner'
        },
        status: 'pending'
      });
      await pendingPharmacy.save();
    } else if (userRole === 'delivery' && additionalData) {
      const pendingDelivery = new PendingDeliveryPerson({
        userId: user._id,
        personalInfo: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          address: additionalData.address
        },
        vehicleInfo: additionalData.vehicleInfo,
        status: 'pending'
      });
      await pendingDelivery.save();
    }

    // Non-blocking welcome email delivery
    sendWelcomeEmail(email, `${firstName} ${lastName}`, password, verificationToken)
      .then(() => logger.info(`Welcome email sent to ${email}`))
      .catch((emailError) => logger.error('Failed to send welcome email:', emailError));

    const resultData = {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    };

    if (userRole === 'customer') {
      const token = generateToken({
        userId: user._id,
        email: user.email,
        role: user.role,
      });
      resultData.token = token;
    }

    return res.status(201).json({
      success: true,
      message: userRole === 'customer'
        ? 'User registered successfully. Please check your email for your generated password.'
        : 'Registration submitted successfully. Your account is pending admin approval.',
      data: resultData
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
      // Log failed login attempt (user not found)
      await AuditLog.create({
        user: null, // No user ID if not found
        userEmail: email,
        userRole: 'unknown',
        action: 'LOGIN',
        status: 'FAILURE',
        entityType: 'USER',
        description: `Failed login attempt: User not found for email ${email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(err => console.error('Failed to create audit log:', err));

      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check account status
    if (user.status !== 'active') {
      let statusMessage = 'Your account is pending approval.';
      if (user.status === 'suspended') statusMessage = 'Your account has been suspended.';
      if (user.status === 'rejected') statusMessage = 'Your account application was rejected.';

      return res.status(403).json({
        success: false,
        message: statusMessage,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Log failed login attempt (wrong password)
      await AuditLog.create({
        user: user._id,
        userEmail: user.email,
        userRole: user.role,
        action: 'LOGIN',
        status: 'FAILURE',
        entityType: 'USER',
        entityId: user._id,
        description: `Failed login attempt: Incorrect password for ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(err => console.error('Failed to create audit log:', err));

      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Log successful login
    await AuditLog.create({
      user: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'LOGIN',
      status: 'SUCCESS',
      entityType: 'USER',
      entityId: user._id,
      description: `User ${user.email} logged in successfully`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }).catch(err => console.error('Failed to create audit log:', err));

    const token = generateToken({ userId: user._id, role: user.role });

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
        status: safeUser.status
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
        status: user.status
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
