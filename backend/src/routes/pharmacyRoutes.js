const express = require('express');
const { body } = require('express-validator');
const { registerPharmacy, checkPharmacyStatus } = require('../controllers/pharmacyController');
const router = express.Router();

// @route   POST /api/pharmacy/register
// @desc    Register a new pharmacy (temporary until approved)
// @access  Public
router.post('/register', [
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
  body('licenseDocument', 'License document is required').not().isEmpty(),
  body('tinDocument', 'TIN document is required').not().isEmpty()
], registerPharmacy);

// @route   GET /api/pharmacy/status/:id
// @desc    Check registration status of a pharmacy
// @access  Public
router.get('/status/:id', checkPharmacyStatus);
