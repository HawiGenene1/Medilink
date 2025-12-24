const ErrorResponse = require('../utils/errorResponse');
const PharmacyStaff = require('../models/PharmacyStaff');

/**
 * Middleware to verify if the authenticated user is a pharmacy staff member
 * and has the required permissions
 */
const authorizePharmacyStaff = (requiredPermission = null) => {
  return async (req, res, next) => {
    try {
      // Get staff member from database
      const staff = await PharmacyStaff.findOne({
        user: req.user.userId,
        pharmacy: req.user.pharmacyId,
        isActive: true
      }).populate('pharmacy');

      if (!staff) {
        return next(
          new ErrorResponse('Not authorized to access this route', 403)
        );
      }

      // Check if pharmacy subscription is active
      if (staff.pharmacy.subscription.status !== 'active') {
        return next(
          new ErrorResponse('Pharmacy subscription is not active', 403)
        );
      }

      // Check specific permission if required
      if (requiredPermission) {
        const [area, action] = requiredPermission.split('.');
        if (!staff.hasPermission(area, action)) {
          return next(
            new ErrorResponse('Not authorized to perform this action', 403)
          );
        }
      }

      // Attach staff to request object
      req.staff = staff;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = authorizePharmacyStaff;
