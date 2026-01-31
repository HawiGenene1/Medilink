const User = require('../models/User');
const PendingPharmacy = require('../models/PendingPharmacy');
const DeliveryProfile = require('../models/DeliveryProfile');
const { generateToken } = require('../config/jwt');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { generatePassword } = require('../utils/passwordGenerator');
const { sendWelcomeEmail } = require('../services/emailService');
const logger = require('../utils/logger');
const crypto = require('crypto');

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

    const { firstName, lastName, email, phone, role, vehicleInfo, additionalData } = req.body;
    const userRole = role || 'customer';

    // Restrict public registration roles (allow customer, delivery, and pharmacy_admin)
    const allowedPublicRoles = ['customer', 'pharmacy_admin', 'delivery'];
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
      status: userRole === 'customer' ? 'active' : 'pending', // Delivery/Pharmacy MUST be pending
      isEmailVerified: userRole === 'customer',
      password,
      verificationToken,
      verificationTokenExpires,
      vehicleInfo: userRole === 'delivery' ? (vehicleInfo || (additionalData && additionalData.vehicleInfo)) : undefined
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
    } else if (userRole === 'delivery') {
      const deliveryProfile = new DeliveryProfile({
        userId: user._id,
        personalDetails: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone
        },
        vehicleDetails: {
          type: vehicleInfo?.type || (additionalData && additionalData.vehicleInfo?.type),
          licensePlate: vehicleInfo?.licensePlate || (additionalData && additionalData.vehicleInfo?.licensePlate)
        }
      });
      await deliveryProfile.save();
    }

    // Non-blocking welcome email delivery with verification token
    sendWelcomeEmail(email, `${firstName} ${lastName}`, password, verificationToken)
      .then(() => logger.info(`Welcome email sent to ${email}`))
      .catch((emailError) => logger.error('Failed to send welcome email:', emailError));

    const resultData = {
      user: user.toJSON()
    };

    // Generate token for customer only (others must verify email/login manually)
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
      ...resultData
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
 * @desc    Authenticate user & get token (or prompt for 2FA)
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status !== 'active' && !(user.status === 'pending' && (user.role === 'delivery' || user.role === 'pharmacy_admin'))) {
      return res.status(403).json({ success: false, message: 'Account status restricted' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check for 2FA
    if (user.isTwoFactorEnabled) {
      const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
      user.twoFactorCode = code;
      user.twoFactorCodeExpires = Date.now() + 10 * 60 * 1000; // 10 mins
      await user.save();

      // Send Code to Recovery Email/Phone
      const emailTarget = user.recoveryEmail || user.email;
      const phoneTarget = user.recoveryPhone || user.phone;

      console.log(`[2FA_CODE] Security code for ${emailTarget} / ${phoneTarget}: ${code}`);

      // We can use a dedicated service later, for now return a flag
      return res.json({
        success: true,
        requires2FA: true,
        email: emailTarget,
        phone: phoneTarget,
        tempId: user._id // Used to identify the session in verify
      });
    }

    const token = generateToken({ userId: user._id.toString(), role: user.role });
    const safeUser = user.toJSON();

    return res.json({
      success: true,
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

/**
 * @route   POST /api/auth/verify-2fa
 * @desc    Verify 2FA code and provide token
 * @access  Public
 */
const verify2FA = async (req, res) => {
  try {
    const { userId, code } = req.body;
    const user = await User.findById(userId).select('+twoFactorCode +twoFactorCodeExpires');

    if (!user || user.twoFactorCode !== code || user.twoFactorCodeExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }

    // Clear code
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpires = undefined;
    await user.save();

    const token = generateToken({ userId: user._id.toString(), role: user.role });

    return res.json({
      success: true,
      token,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification failed' });
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

    const userJSON = user.toJSON();

    // Prevent caching to ensure fresh data on every request
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    return res.json({
      success: true,
      user: userJSON
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

    // Check if the token belongs to an already verified user (idempotency)
    const verifiedUser = await User.findOne({ verificationToken: token });
    if (verifiedUser && verifiedUser.isEmailVerified) {
      return res.json({
        success: true,
        message: 'Account is already verified. You can log in.',
      });
    }

    if (!user) {
      console.warn(`Verification failed for token: ${token}`);
      const expiredUser = await User.findOne({ verificationToken: token });

      // Check if user is already verified but token was not cleared (unlikely but safe)
      if (expiredUser && expiredUser.isEmailVerified) {
        return res.json({
          success: true,
          message: 'Account is already verified. You can log in.',
        });
      }

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

    // Only auto-activate customers. Delivery/Pharmacy must complete onboarding/approval.
    if (user.role === 'customer') {
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
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  verifyEmail,
  verify2FA
};
