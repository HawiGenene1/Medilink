// backend/src/routes/prescriptionRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  upload,
  uploadPrescription,
  getPendingPrescriptions,
  updatePrescriptionStatus,
  getCustomerPrescriptions
} = require('../controllers/prescriptionController');

// Public route for uploading prescriptions
router.post(
  '/',
  upload.single('image'),
  [
    body('doctorName').trim().notEmpty().withMessage('Doctor name is required'),
    body('issueDate').isISO8601().withMessage('Valid issue date is required'),
    body('expiryDate').isISO8601().withMessage('Valid expiry date is required'),
    body('notes').optional().trim()
  ],
  uploadPrescription
);

// Protected route for customers to get their prescriptions
router.get(
  '/',
  (req, res, next) => {
    // Development bypass - skip authentication in development
    if (process.env.NODE_ENV === 'development') {
      // Mock user for development
      req.user = {
        userId: 'dev-user-123',
        email: 'dev@example.com',
        role: 'customer'
      };
      return next();
    }
    // In production, use actual authentication
    return authenticate(req, res, next);
  },
  (req, res, next) => {
    // Development bypass - skip role authorization in development
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    // In production, use actual authorization
    return authorize(['customer', 'admin'])(req, res, next);
  },
  getCustomerPrescriptions
);

// Protected routes for pharmacy staff
router.get(
  '/pending',
  authenticate,
  authorize(['admin']),
  getPendingPrescriptions
);

router.patch(
  '/:id/status',
  authenticate,
  authorize(['admin']),
  [
    body('status')
      .isIn(['approved', 'rejected'])
      .withMessage('Status must be either "approved" or "rejected"'),
    body('reviewNotes').optional().trim()
  ],
  updatePrescriptionStatus
);

module.exports = router;