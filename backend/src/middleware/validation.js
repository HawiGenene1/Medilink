// backend/src/middleware/validation.js
const { body, validationResult } = require('express-validator');

// Validation for location input
exports.validateLocation = [
  body('location')
    .trim()
    .notEmpty().withMessage('Location is required')
    .isLength({ min: 2, max: 100 }).withMessage('Location must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s,-]+$/).withMessage('Location can only contain letters, spaces, commas, and hyphens'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => err.msg)
      });
    }
    next();
  }
];

// Validation for medicine creation/update
exports.validateMedicine = [
  body('name')
    .trim()
    .notEmpty().withMessage('Medicine name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  
  body('price')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  body('stock')
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Category cannot exceed 50 characters'),
  
  body('manufacturer')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Manufacturer name cannot exceed 100 characters'),
  
  body('imageUrl')
    .optional()
    .isURL().withMessage('Image must be a valid URL'),
  
  body('requiresPrescription')
    .optional()
    .isBoolean().withMessage('Requires prescription must be a boolean value'),
  
  body('dosage')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Dosage cannot exceed 50 characters'),
  
  body('sideEffects')
    .optional()
    .isArray().withMessage('Side effects must be an array'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

// Validation for user registration
exports.validateUser = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

// Validation for search queries
exports.validateSearchQuery = [
  body('query')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search query cannot exceed 100 characters'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Category cannot exceed 50 characters'),
  
  body('minPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Minimum price must be a positive number'),
  
  body('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Maximum price must be a positive number'),
  
  (req, res, next) => {
    // Ensure maxPrice is greater than minPrice if both are provided
    if (req.body.minPrice && req.body.maxPrice && 
        parseFloat(req.body.minPrice) > parseFloat(req.body.maxPrice)) {
      return res.status(400).json({
        success: false,
        errors: [{ 
          field: 'maxPrice', 
          message: 'Maximum price must be greater than minimum price' 
        }]
      });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

// Validation for pagination
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

// Validation for sorting
exports.validateSorting = [
  query('sort')
    .optional()
    .isIn(['name', 'price', 'rating', 'createdAt', '-name', '-price', '-rating', '-createdAt'])
    .withMessage('Invalid sort parameter'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

// Validation for ID parameters
exports.validateId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid ID format'
    });
  }
  next();
};

// Middleware to handle validation errors
exports.handleValidationErrors = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));

    return res.status(400).json({
      success: false,
      errors
    });
  }
  next(err);
};

// Middleware to handle 404 errors
exports.notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found'
  });
};

// Middleware to handle errors
exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};