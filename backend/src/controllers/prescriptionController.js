const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Prescription = require('../models/Prescription');
const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const { validationResult } = require('express-validator');

// Configure multer for prescription uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const rootDir = path.join(__dirname, '../../');
    const uploadDir = path.join(rootDir, 'uploads/prescriptions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'prescription-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// @desc    Upload prescription image
// @route   POST /api/prescriptions/upload
// @access   Private (customer)
const uploadPrescription = [
  upload.single('prescription'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No prescription file uploaded'
        });
      }

      const { notes, pharmacyId, urgency = 'normal' } = req.body;
      const customerId = req.user.id || req.user.userId || req.user._id;

      if (!customerId) {
        console.error('[PrescriptionController] No customer ID found in req.user');
        return res.status(401).json({
          success: false,
          message: 'User authentication data incomplete'
        });
      }

      // Create prescription record
      const prescription = new Prescription({
        customer: customerId,
        pharmacy: pharmacyId || null,
        imageUrl: `/uploads/prescriptions/${req.file.filename}`,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        notes: notes || '',
        urgency,
        status: 'pending_review',
        uploadedAt: new Date()
      });

      await prescription.save();

      res.status(201).json({
        success: true,
        message: 'Prescription uploaded successfully',
        data: {
          prescriptionId: prescription._id,
          imageUrl: prescription.imageUrl,
          status: prescription.status,
          uploadedAt: prescription.uploadedAt
        }
      });

    } catch (error) {
      console.error('Error uploading prescription:', error);

      // Clean up uploaded file if there was an error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: 'Error uploading prescription',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// @desc    Get user's prescriptions
// @route   GET /api/prescriptions
// @access   Private (customer)
const getPrescriptions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = { customer: req.user.id };
    if (status) {
      query.status = status;
    }

    const prescriptions = await Prescription.find(query)
      .populate('pharmacy', 'name address phone')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const totalCount = await Prescription.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        prescriptions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalPrescriptions: totalCount,
          hasNext: parseInt(page) < Math.ceil(totalCount / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error getting prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prescriptions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get prescription details
// @route   GET /api/prescriptions/:id
// @access   Private (customer)
const getPrescriptionDetails = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone')
      .populate('pharmacy', 'name address phone email')
      .populate('reviewedBy', 'firstName lastName')
      .populate('medicines.medicine', 'name brand price');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check if user owns this prescription or is pharmacy staff/admin
    if (prescription.customer._id.toString() !== req.user.id &&
      !['pharmacy_staff', 'pharmacy_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this prescription'
      });
    }

    res.status(200).json({
      success: true,
      data: prescription
    });

  } catch (error) {
    console.error('Error getting prescription details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prescription details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update prescription status (pharmacy staff/admin only)
// @route   PATCH /api/prescriptions/:id/status
// @access   Private (pharmacy_staff, pharmacy_admin, admin)
const updatePrescriptionStatus = async (req, res) => {
  try {
    const { status, notes, medicines } = req.body;
    const prescriptionId = req.params.id;

    const prescription = await Prescription.findById(prescriptionId);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Validate status transition
    const validTransitions = {
      'pending_review': ['approved', 'rejected'],
      'approved': ['processed', 'rejected'],
      'rejected': ['pending_review'],
      'processed': ['completed'],
      'completed': []
    };

    if (!validTransitions[prescription.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${prescription.status} to ${status}`
      });
    }

    // Update prescription
    prescription.status = status;
    prescription.reviewedBy = req.user._id;
    prescription.reviewedAt = new Date();

    if (notes) {
      prescription.reviewNotes = prescription.reviewNotes || [];
      prescription.reviewNotes.push({
        note: notes,
        addedBy: req.user._id,
        addedAt: new Date()
      });
    }

    if (medicines && Array.isArray(medicines)) {
      prescription.medicines = medicines;
    }

    await prescription.save();

    // If approved, create order for customer
    if (status === 'approved' && medicines && medicines.length > 0) {
      await createOrderFromPrescription(prescription, req.user);
    }

    res.status(200).json({
      success: true,
      message: 'Prescription status updated successfully',
      data: prescription
    });

  } catch (error) {
    console.error('Error updating prescription status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating prescription status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete prescription (customer only, only if pending)
// @route   DELETE /api/prescriptions/:id
// @access   Private (customer)
const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check if user owns this prescription
    if (prescription.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this prescription'
      });
    }

    // Can only delete if pending review
    if (prescription.status !== 'pending_review') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete prescription that is already being processed'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', prescription.imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Prescription.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Prescription deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting prescription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to create order from approved prescription
async function createOrderFromPrescription(prescription, reviewer) {
  try {
    if (!prescription.medicines || prescription.medicines.length === 0) {
      throw new Error('No medicines specified in prescription');
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const medItem of prescription.medicines) {
      const medicine = await Medicine.findById(medItem.medicine);
      if (!medicine) {
        throw new Error(`Medicine not found: ${medItem.medicine}`);
      }

      const subtotal = medicine.price * medItem.quantity;
      totalAmount += subtotal;

      orderItems.push({
        medicine: medicine._id,
        name: medicine.name,
        price: medicine.price,
        quantity: medItem.quantity,
        subtotal
      });
    }

    // Create order
    const order = new Order({
      customer: prescription.customer,
      pharmacy: prescription.pharmacy,
      items: orderItems,
      totalAmount,
      finalAmount: totalAmount,
      status: 'confirmed',
      paymentStatus: 'pending',
      paymentMethod: 'cash',
      prescriptionRequired: true,
      prescriptionImage: prescription.imageUrl,
      notes: `Order created from prescription #${prescription._id}`,
      statusHistory: [{
        status: 'confirmed',
        timestamp: new Date(),
        note: `Order automatically created from approved prescription by ${reviewer.firstName} ${reviewer.lastName}`
      }]
    });

    await order.save();

    // Update prescription with order reference
    prescription.order = order._id;
    prescription.status = 'processed';
    await prescription.save();

    return order;

  } catch (error) {
    console.error('Error creating order from prescription:', error);
    throw error;
  }
}

module.exports = {
  uploadPrescription,
  getPrescriptions,
  getPrescriptionDetails,
  updatePrescriptionStatus,
  deletePrescription
};
