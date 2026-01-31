const jwt = require("jsonwebtoken");
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

        const user = await User.findOne({ email: decoded.email });
        if (user) {
          req.user = {
            userId: user._id,
            email: user.email,
            role: user.role,
            pharmacyId: user.pharmacyId
          };
          return next();
        }
      } catch (e) {
        console.error('Mock token parsing failed:', e);
      }
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check for Pharmacy Owner
      if (decoded.role === 'PHARMACY_OWNER') {
        const owner = await PharmacyOwner.findById(decoded.ownerId || decoded.id);
        if (!owner) {
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
          role: 'PHARMACY_OWNER',
          pharmacyId: owner.pharmacyId,
          isOwner: true
        };
        return next();
      }

      // Find user by ID from token
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Token is invalid.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated.'
        });
      }

      // Attach user to request object
      req.user = {
        userId: user._id,
        email: user.email,
        role: user.role,
        pharmacyId: user.pharmacyId
      };

      // If user is staff, attach detailed permissions
      if (['staff', 'cashier', 'pharmacist'].includes(user.role)) {
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
      console.error('Token verification failed:', error);
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

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

// Alias for backward compatibility
const authRequired = authorize;

// Basic auth (no role restrictions) for routes like /api/auth/me
const authenticate = protect;

module.exports = {
  protect,
  authorize,
  authRequired,
  authenticate
};
