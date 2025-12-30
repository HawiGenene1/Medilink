// backend/src/routes/prescriptionRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  upload,
  uploadPrescription,
  getPendingPrescriptions,
  updatePrescriptionStatus
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

// Protected routes for pharmacy staff
router.get(
  '/pending',
  authenticate,
  authorize(['pharmacy_staff', 'pharmacy_admin', 'admin']),
  getPendingPrescriptions
);

router.patch(
  '/:id/status',
  authenticate,
  authorize(['pharmacy_staff', 'pharmacy_admin', 'admin']),
  [
    body('status')
      .isIn(['approved', 'rejected'])
      .withMessage('Status must be either "approved" or "rejected"'),
    body('reviewNotes').optional().trim()
  ],
  updatePrescriptionStatus
);

module.exports = router;