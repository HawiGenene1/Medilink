const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Prescription = require('../models/Prescription');
const User = require('../models/User');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'prescriptions');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    const timestamp = Date.now();
    cb(null, `${base}_${timestamp}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// POST /api/prescriptions
// Expects multipart/form-data with fields: doctorName, issueDate, expiryDate, notes (optional), and file field: image
const uploadPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Prescription image is required'
      });
    }

    const {
      doctorName,
      issueDate,
      expiryDate,
      notes
    } = req.body;

    if (!doctorName || !issueDate || !expiryDate) {
        // Clean up the uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'doctorName, issueDate and expiryDate are required'
      });
    }

    // TODO: attach authenticated user when auth middleware is wired
    const userId = req.user?.id || req.user?._id || null;

    const relativeImagePath = path.join('uploads', 'prescriptions', req.file.filename).replace(/\\/g, '/');

    const prescription = await Prescription.create({
      user: userId,
      doctorName,
      issueDate,
      expiryDate,
      imageUrl: `/${relativeImagePath}`,
      notes: notes || undefined
    });

    // Populate user details
    await prescription.populate('user', 'firstName lastName email');

    return res.status(201).json({
      success: true,
      message: 'Prescription uploaded successfully',
      data: prescription
    });
  } catch (error) {
    console.error('uploadPrescription error:', error);
    // Clean up file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: 'Error uploading prescription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Get pending prescriptions
const getPendingPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ status: 'pending' })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    return res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (error) {
    console.error('Error fetching pending prescriptions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching pending prescriptions'
    });
  }
};

// Get customer's prescriptions
const getCustomerPrescriptions = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    const prescriptions = await Prescription.find({ user: userId })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    return res.json({
      success: true,
      count: prescriptions.length,
      prescriptions: prescriptions
    });
  } catch (error) {
    console.error('Error fetching customer prescriptions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching prescriptions'
    });
  }
};
// Update prescription status
const updatePrescriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "approved" or "rejected"'
      });
    }

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    prescription.status = status;
    prescription.reviewedBy = req.user.id;
    prescription.reviewedAt = new Date();
    if (reviewNotes) prescription.reviewNotes = reviewNotes;

    await prescription.save();
    
    // Populate user and reviewer details
    await prescription.populate('user', 'firstName lastName email');
    await prescription.populate('reviewedBy', 'firstName lastName');

    return res.json({
      success: true,
      message: `Prescription ${status} successfully`,
      data: prescription
    });
  } catch (error) {
    console.error('Error updating prescription status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating prescription status'
    });
  }
};


module.exports = {
  upload,
  uploadPrescription,
  getPendingPrescriptions,
  getCustomerPrescriptions,
  updatePrescriptionStatus
};
