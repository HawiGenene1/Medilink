const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const PharmacyStaff = require("../models/PharmacyStaff");
const PharmacyOwner = require("../models/PharmacyOwner");

/**
 * Middleware to verify JWT token and attach user to request
 */
const protect = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Development bypass for mock tokens
    if (process.env.NODE_ENV === 'development' && token.startsWith('header.')) {
      try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = Buffer.from(payloadBase64, 'base64').toString();
        const decoded = JSON.parse(payloadJson);

        const STABLE_MOCK_PHARMACY_ID = '65a7d5c9f1a2b3c4d5e6f701';
        const user = await User.findOne({ email: decoded.email });

        // Force all pharmacy-related roles to the same stable pharmacy ID in dev mode
        const role = decoded.role?.toLowerCase();
        const isPharmacyRole = ['pharmacy_owner', 'staff', 'cashier', 'pharmacist', 'technician', 'assistant', 'pharmacy_staff', 'pharmacy_admin'].includes(role);
        const forcedPharmacyId = isPharmacyRole ? new mongoose.Types.ObjectId(STABLE_MOCK_PHARMACY_ID) : (user?.pharmacyId || null);

        req.user = {
          _id: user?._id || new mongoose.Types.ObjectId(),
          userId: user?._id || new mongoose.Types.ObjectId(),
          email: decoded.email,
          role: decoded.role,
          pharmacyId: forcedPharmacyId,
          isMock: true
        };

        if (role === 'pharmacy_owner' || role === 'pharmacy_admin') {
          req.owner = {
            _id: req.user._id,
            pharmacyId: req.user.pharmacyId,
            email: req.user.email,
            permissions: ['dashboard', 'inventory', 'orders', 'staff']
          };
        }

        // If staff in mock mode, also try to fetch real details for permissions sync
        if (['staff', 'cashier', 'pharmacist', 'technician', 'assistant', 'pharmacy_staff'].includes(role) && user) {
          const staffDetails = await PharmacyStaff.findOne({ user: user._id });
          if (staffDetails) {
            req.user.permissions = staffDetails.permissions;
            req.user.pharmacyId = staffDetails.pharmacy;
            req.user.operationalPermissions = {
              manageInventory: staffDetails.permissions?.inventory?.view || false,
              prepareOrders: staffDetails.permissions?.orders?.process || false
            };
          }
        }

        console.log(`[Dev Auth] Mock Session: ${decoded.email} [${req.user.role}]`);
        return next();
      } catch (e) {
        console.error('Mock token parsing failed:', e);
      }
    }

    try {
      // Verify token
      console.log(`[Auth] Verifying token...`);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
<<<<<<< HEAD

      // Check for Pharmacy Owner (handles both casing and legacy 'pharmacy_admin')
      const decodedRole = decoded.role?.toLowerCase();
      if (decodedRole === 'pharmacy_owner' || decodedRole === 'pharmacy_admin') {
        const owner = await PharmacyOwner.findById(decoded.ownerId || decoded.id);
        if (!owner) {
          // Try to find in User model if not in PharmacyOwner (if migrated)
          const legacyOwner = await User.findById(decoded.userId || decoded.id);
          if (legacyOwner && (legacyOwner.role === 'pharmacy_owner' || legacyOwner.role === 'pharmacy_admin')) {
            req.user = {
              _id: legacyOwner._id,
              id: legacyOwner._id,
              email: legacyOwner.email,
              role: 'pharmacy_owner',
              pharmacyId: legacyOwner.pharmacyId,
              isOwner: true
            };
            req.owner = { _id: legacyOwner._id, pharmacyId: legacyOwner.pharmacyId, email: legacyOwner.email };
            return next();
          }
          return res.status(401).json({ success: false, message: 'Owner not found' });
        }
        if (!owner.isActive) {
          return res.status(403).json({ success: false, message: 'Account deactivated' });
        }
        req.owner = owner;
        // Also set req.user for compatibility with some shared utilities
        req.user = {
          id: owner._id,
          userId: owner._id,
          email: owner.email,
          role: 'pharmacy_owner',
          pharmacyId: owner.pharmacyId,
          isOwner: true
        };
        return next();
      }
=======
      console.log(`[Auth] Token verified for userId: ${decoded.userId}`);
>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1

      // Find user by ID from token
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        console.warn(`[Auth] User not found for ID: ${decoded.userId}`);
        return res.status(401).json({
          success: false,
          message: 'User not found. Token is invalid.'
        });
      }

      console.log(`[Auth] Authenticated user: ${user.email} (${user.role})`);

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated.'
        });
      }

      // Attach user to request object
      req.user = {
<<<<<<< HEAD
        _id: user._id,
        userId: user._id,
        email: user.email,
        role: user.role,
        pharmacyId: user.pharmacyId,
        isOwner: user.role.toLowerCase() === 'pharmacy_owner'
=======
        id: user._id.toString(),
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        pharmacyId: user.pharmacyId ? user.pharmacyId.toString() : null
>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1
      };

      // If user is staff, attach detailed permissions
      const userRole = user.role?.toLowerCase();
      if (['staff', 'pharmacy_staff', 'cashier', 'pharmacist', 'technician', 'assistant'].includes(userRole)) {
        const staffDetails = await PharmacyStaff.findOne({ user: user._id });
        if (staffDetails) {
          req.user.permissions = staffDetails.permissions;
          req.user.pharmacyId = staffDetails.pharmacy;
          // Also attach operationalPermissions map for compatibility if needed
          req.user.operationalPermissions = {
            manageInventory: staffDetails.permissions?.inventory?.view || false, // Basic check
            prepareOrders: staffDetails.permissions?.orders?.process || false
          };
        }
      }

      next();
    } catch (error) {
      console.error('[Auth] Token verification failed:', error.message);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token format' });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {Array} roles - Array of allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role.toLowerCase())) {
      console.warn(`[Auth] Role Access Denied. User Role: ${req.user.role}, Required: ${roles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: `Permission denied. Required role: [${roles.join(', ')}], Your role: [${req.user.role}]`
      });
    }

    next();
  };
};

// Alias for backward compatibility
const authRequired = authorize;

// Basic auth (no role restrictions) for routes like /api/auth/me
const authenticate = protect;

// Composite middleware for admin access
const protectAdmin = [protect, authorize('admin')];

module.exports = {
  protect,
  authorize,
  authRequired,
  authenticate,
  protectAdmin
};
