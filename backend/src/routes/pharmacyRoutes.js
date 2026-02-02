const express = require('express');
<<<<<<< HEAD
const multer = require('multer');
const path = require('path');
const { registerPharmacy, checkPharmacyStatus } = require('../controllers/pharmacyController');
=======
const { body } = require('express-validator');
const { registerPharmacy, checkPharmacyStatus, getPharmacySubscription, requestSubscriptionRenewal, getPharmacyById, getPharmacies } = require('../controllers/pharmacyController');
const { protect } = require('../middleware/authMiddleware');
>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1
const router = express.Router();

// Configure Multer for document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `pharmacy-doc-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @route   POST /api/pharmacy/register
// @desc    Register a new pharmacy (temporary until approved)
// @access  Public
router.post('/register', upload.fields([
  { name: 'licenseDocument', maxCount: 1 },
  { name: 'tinDocument', maxCount: 1 }
]), registerPharmacy);

// @route   GET /api/pharmacy/status/:id
// @desc    Check registration status of a pharmacy
// @access  Public
router.get('/status/:id', checkPharmacyStatus);

<<<<<<< HEAD
=======
// @route   GET /api/pharmacy/:id
// @desc    Get public pharmacy details by ID
// @access  Public
router.get('/:id', getPharmacyById);

// @route   GET /api/pharmacy
// @desc    Get list of verifies pharmacies
// @access  Public
router.get('/', getPharmacies);

// ============ SUBSCRIPTION ROUTES (Protected) ============

// @route   GET /api/pharmacy/subscription
// @desc    Get pharmacy subscription details
// @access  Private (Pharmacy Admin)
router.get('/subscription', protect, getPharmacySubscription);

// @route   POST /api/pharmacy/subscription/request-renewal
// @desc    Request subscription renewal
// @access  Private (Pharmacy Admin)
router.post('/subscription/request-renewal', protect, [
  body('mode').optional().isIn(['monthly', 'annually'])
], requestSubscriptionRenewal);

>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1
module.exports = router;
