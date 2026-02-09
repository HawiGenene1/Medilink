const express = require('express');
const { body } = require('express-validator');
const {
  registerPharmacy,
  checkPharmacyStatus,
  getPharmacySubscription,
  requestSubscriptionRenewal,
  getPharmacyById,
  getPharmacies
} = require('../controllers/pharmacyController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();
const multer = require('multer');

const upload = require('../middleware/uploadMiddleware');

// @route   GET /api/pharmacy
// @desc    Get all active and approved pharmacies
// @access  Public
router.get('/', getPharmacies);

// @route   POST /api/pharmacy/register
// @desc    Register a new pharmacy (temporary until approved)
// @access  Public
router.post('/register',
  upload.fields([
    { name: 'licenseDocument', maxCount: 1 },
    { name: 'tinDocument', maxCount: 1 }
  ]),
  [
    body('pharmacyName', 'Pharmacy name is required').not().isEmpty().trim(),
    body('licenseNumber', 'License number is required').not().isEmpty().trim(),
    body('establishedDate', 'Valid established date is required').isISO8601(),
    body('ownerName', 'Owner name is required').not().isEmpty().trim(),
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('phone', 'Please include a valid phone number').not().isEmpty().trim(),
    body('address.street', 'Street address is required').not().isEmpty().trim(),
    body('address.city', 'City is required').not().isEmpty().trim(),
    body('address.state', 'State is required').not().isEmpty().trim(),
    body('address.postalCode', 'Postal code is required').not().isEmpty().trim(),
    body('tinNumber', 'TIN number is required').not().isEmpty().trim(),
    // Document validation moved to controller checking req.files
  ],
  (req, res, next) => {
    console.log('[Pharmacy Register Route] Files present:', req.files ? Object.keys(req.files) : 'None');
    console.log('[Pharmacy Register Route] Body keys:', Object.keys(req.body));
    next();
  },
  (err, req, res, next) => {
    // Handle multer errors
    if (err instanceof multer.MulterError) {
      console.error('[Multer Error]', err);
      return res.status(400).json({
        success: false,
        message: `File upload error: ${err.message}`,
        error: err.code
      });
    } else if (err) {
      console.error('[Upload Error]', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }
    next();
  },
  registerPharmacy);

// @route   GET /api/pharmacy/status/:id
// @desc    Check registration status of a pharmacy
// @access  Public
router.get('/status/:id', checkPharmacyStatus);

// @route   GET /api/pharmacy/:id
// @desc    Get public pharmacy details by ID
// @access  Public
router.get('/:id', getPharmacyById);

// ============ SUBSCRIPTION ROUTES (Protected) ============

// @route   GET /api/pharmacy/subscription
// @desc    Get pharmacy subscription details
// @access  Private (Pharmacy Admin)
router.get('/subscription', protect, authorize('pharmacy_admin'), getPharmacySubscription);

// @route   POST /api/pharmacy/subscription/request-renewal
// @desc    Request subscription renewal
// @access  Private (Pharmacy Admin)
router.post('/subscription/request-renewal', protect, authorize('pharmacy_admin'), [
  body('mode').optional().isIn(['monthly', 'annually'])
], requestSubscriptionRenewal);

module.exports = router;
