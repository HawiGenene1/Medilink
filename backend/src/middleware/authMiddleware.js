// const { verifyToken } = require('../config/jwt');
// const User = require('../models/User');

// /**
//  * Middleware to verify JWT token and attach user to request
//  */
// const authenticate = async (req, res, next) => {
//   try {
//     // Get token from header
//     const authHeader = req.headers.authorization;
    
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({
//         success: false,
//         message: 'Access denied. No token provided.'
//       });
//     }

//     const token = authHeader.substring(7); // Remove 'Bearer ' prefix

//     try {
//       // Verify token
//       const decoded = verifyToken(token);
      
//       // Find user by ID from token
//       const user = await User.findById(decoded.userId);
      
//       if (!user) {
//         return res.status(401).json({
//           success: false,
//           message: 'User not found'
//         });
//       }

//       if (!user.isActive) {
//         return res.status(401).json({
//           success: false,
//           message: 'Account has been deactivated'
//         });
//       }

//       // Attach user to request object
//       req.user = {
//         userId: user._id,
//         email: user.email,
//         role: user.role,
//         pharmacyId: user.pharmacyId
//       };

//       next();
//     } catch (error) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid or expired token'
//       });
//     }
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// module.exports = { authenticate };
const jwt = require("jsonwebtoken");

exports.authRequired = (roles = []) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ success: false, message: "Token required" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ success: false, message: "Not allowed" });
      }

      next();
    } catch (e) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
  };
};
