const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user or owner by ID from token
      let user;
      const targetId = decoded.userId || decoded.ownerId || decoded.id;

      // Try User collection first
      user = await User.findById(targetId).select('-password');

      // If not found in User, try PharmacyOwner collection
      if (!user) {
        const PharmacyOwner = require("../models/PharmacyOwner");
        const owner = await PharmacyOwner.findById(targetId).select('-password');

        if (owner) {
          user = {
            _id: owner._id,
            email: owner.email,
            role: 'pharmacy_owner',
            pharmacyId: owner.pharmacyId,
            status: owner.isActive ? 'active' : 'suspended',
            isActive: owner.isActive
          };
        }
      }

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
        id: user._id,
        _id: user._id, // Add _id for direct compatibility with models
        userId: user._id,
        email: user.email,
        role: user.role,
        pharmacyId: user.pharmacyId,
        status: user.status
      };

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
 * @param {String|Array} roles - Single role or array of allowed roles
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
        message: `Access denied. This action requires one of the following roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Convenience middleware to restrict access to specific role
 * @param {String} role - Required role
 */
const restrictTo = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${role} role required.`
      });
    }

    next();
  };
};

// Alias for backward compatibility
const authRequired = authorize;

// Basic auth (no role  restrictions) for routes like /api/auth/me
const authenticate = protect;

// Convenience export for common middleware patterns
const auth = protect;

module.exports = {
  protect,
  authorize,
  authRequired,
  authenticate,
  restrictTo,
  auth
};
