const { body, param } = require('express-validator');

// Validation for creating admin user
const validateCreateAdminUser = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .custom(async (value) => {
      const User = require('../../models/User');
      const existingUser = await User.findOne({ email: value });
      if (existingUser) {
        throw new Error('Email already exists');
      }
      return true;
    }),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .isIn(['admin', 'pharmacy_admin', 'cashier', 'customer'])
    .withMessage('Invalid role. Must be one of: admin, pharmacy_admin, cashier, customer'),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('any', { strictMode: false })
    .withMessage('Please provide a valid phone number')
];

// Validation for updating user role
const validateUpdateUserRole = [
  body('role')
    .isIn(['admin', 'pharmacy_admin', 'cashier', 'customer'])
    .withMessage('Invalid role. Must be one of: admin, pharmacy_admin, cashier, customer'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters')
];

// Validation for disabling/enabling user
const validateDisableEnableUser = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
];

// Validation for bulk user creation
const validateBulkCreateUsers = [
  body('users')
    .isArray({ min: 1, max: 100 })
    .withMessage('Users must be an array with 1-100 items'),
  
  body('users.*.firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('users.*.lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('users.*.email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('users.*.password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('users.*.role')
    .isIn(['admin', 'pharmacy_admin', 'cashier', 'customer'])
    .withMessage('Invalid role'),
  
  body('users.*.phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
];

// Validation for bulk user updates
const validateBulkUpdateUsers = [
  body('updates')
    .isArray({ min: 1, max: 100 })
    .withMessage('Updates must be an array with 1-100 items'),
  
  body('updates.*.id')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('updates.*.firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('updates.*.lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('updates.*.email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('updates.*.role')
    .optional()
    .isIn(['admin', 'pharmacy_admin', 'cashier', 'customer'])
    .withMessage('Invalid role')
];

// Validation for bulk pharmacy operations
const validateBulkPharmacyOperations = [
  body('pharmacyIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('Pharmacy IDs must be an array with 1-100 items'),
  
  body('pharmacyIds.*')
    .isMongoId()
    .withMessage('Invalid pharmacy ID'),
  
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
];

// Validation for data export
const validateDataExport = [
  body('type')
    .isIn(['users', 'pharmacies', 'orders', 'medicines', 'audit_logs'])
    .withMessage('Invalid export type'),
  
  body('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Invalid format. Must be json or csv'),
  
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filters must be an object')
];

module.exports = {
  validateCreateAdminUser,
  validateUpdateUserRole,
  validateDisableEnableUser,
  validateBulkCreateUsers,
  validateBulkUpdateUsers,
  validateBulkPharmacyOperations,
  validateDataExport
};
