const express = require('express');
const multer = require('multer');
const path = require('path');
const { registerPharmacy, checkPharmacyStatus } = require('../controllers/pharmacyController');
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

module.exports = router;
