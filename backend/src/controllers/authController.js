// const User = require('../models/User');
// const { generateToken } = require('../config/jwt');
// const { validationResult } = require('express-validator');

// /**
//  * @route   POST /api/auth/register
//  * @desc    Register a new user
//  * @access  Public
//  */
// const register = async (req, res) => {
//   try {
//     // Validate input
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: errors.array()
//       });
//     }

//     const { firstName, lastName, email, password, phone, role, address, pharmacyId } = req.body;

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: 'User with this email already exists'
//       });
//     }

//     // Validate role-specific requirements
//     if (['pharmacy_staff', 'pharmacy_admin', 'cashier'].includes(role) && !pharmacyId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Pharmacy ID is required for pharmacy staff roles'
//       });
//     }

//     // Create new user
//     const userData = {
//       firstName,
//       lastName,
//       email,
//       password,
//       phone,
//       role: role || 'customer',
//       address
//     };

//     // Add pharmacyId for staff roles
//     if (pharmacyId) {
//       userData.pharmacyId = pharmacyId;
//     }

//     const user = new User(userData);
//     await user.save();

//     // Generate JWT token
//     const token = generateToken({
//       userId: user._id,
//       email: user.email,
//       role: user.role
//     });

//     // Return user data without password
//     res.status(201).json({
//       success: true,
//       message: 'User registered successfully',
//       data: {
//         token,
//         user: {
//           id: user._id,
//           firstName: user.firstName,
//           lastName: user.lastName,
//           email: user.email,
//           phone: user.phone,
//           role: user.role,
//           pharmacyId: user.pharmacyId,
//           address: user.address
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Register error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error during registration',
//       error: error.message
//     });
//   }
// };

// /**
//  * @route   POST /api/auth/login
//  * @desc    Login user and return JWT token
//  * @access  Public
//  */
// const login = async (req, res) => {
//   try {
//     // Validate input
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: errors.array()
//       });
//     }

//     const { email, password } = req.body;

//     // Find user by email (include password for comparison)
//     const user = await User.findOne({ email }).select('+password');
    
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password'
//       });
//     }

//     // Check if account is active
//     if (!user.isActive) {
//       return res.status(401).json({
//         success: false,
//         message: 'Account has been deactivated. Please contact support.'
//       });
//     }

//     // Verify password
//     const isPasswordValid = await user.comparePassword(password);
    
//     if (!isPasswordValid) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password'
//       });
//     }

//     // Update last login
//     user.lastLogin = new Date();
//     await user.save();

//     // Generate JWT token
//     const token = generateToken({
//       userId: user._id,
//       email: user.email,
//       role: user.role
//     });

//     // Return user data without password
//     res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       data: {
//         token,
//         user: {
//           id: user._id,
//           firstName: user.firstName,
//           lastName: user.lastName,
//           email: user.email,
//           phone: user.phone,
//           role: user.role,
//           pharmacyId: user.pharmacyId,
//           address: user.address,
//           lastLogin: user.lastLogin
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error during login',
//       error: error.message
//     });
//   }
// };

// /**
//  * @route   GET /api/auth/me
//  * @desc    Get current user profile
//  * @access  Private
//  */
// const getCurrentUser = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.userId);
    
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         user: {
//           id: user._id,
//           firstName: user.firstName,
//           lastName: user.lastName,
//           email: user.email,
//           phone: user.phone,
//           role: user.role,
//           pharmacyId: user.pharmacyId,
//           address: user.address,
//           isEmailVerified: user.isEmailVerified,
//           lastLogin: user.lastLogin
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Get current user error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// module.exports = {
//   register,
//   login,
//   getCurrentUser
// };

const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username + explicitly include password
    const user = await User.findOne({ username }).select("+password").populate("role");

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid username" });
    }

    // Validate password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role?.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Remove password before return
    const userData = user.toObject();
    delete userData.password;

    res.json({
      success: true,
      token,
      user: userData
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
