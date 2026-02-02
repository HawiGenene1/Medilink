const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Middleware to handle validation results
 */
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Validation failed for pharmacy-owner:', {
            body: req.body,
            errors: errors.array()
        });
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * Owner registration validation
 */
exports.validateOwnerRegister = [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('pharmacyId').trim().isMongoId().withMessage('Invalid Pharmacy ID'),
    handleValidation
];

/**
 * Owner login validation
 */
exports.validateOwnerLogin = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidation
];

/**
 * Staff creation validation
 */
exports.validateStaffCreate = [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['pharmacist', 'cashier', 'staff', 'technician', 'assistant']).withMessage('Invalid role'),
    body('permissions').optional().isObject().withMessage('Permissions must be an object'),
    handleValidation
];

/**
 * Staff update validation
 */
exports.validateStaffUpdate = [
    body('role').optional().isIn(['pharmacist', 'cashier', 'staff', 'technician', 'assistant']).withMessage('Invalid role'),
    body('permissions').optional().isObject().withMessage('Permissions must be an object'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    handleValidation
];

/**
 * Profile update validation
 */
exports.validateProfileUpdate = [
    body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
    body('phone').optional().trim().notEmpty().withMessage('Phone number cannot be empty'),
    body('operationalPermissions').optional().isObject().withMessage('Operational permissions must be an object'),
    handleValidation
];
