const Medicine = require('../models/Medicine');
const PharmacyStaff = require('../models/PharmacyStaff');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all medicines for a pharmacy
// @route   GET /api/v1/pharmacy/medicines
// @access  Private/Pharmacy Staff
exports.getMedicines = asyncHandler(async (req, res, next) => {
  // Check if staff has permission
  if (!req.staff.hasPermission('inventory', 'view')) {
    return next(new ErrorResponse('Not authorized to view medicines', 403));
  }

  const medicines = await Medicine.find({ pharmacyId: req.staff.pharmacy });
  
  res.status(200).json({
    success: true,
    count: medicines.length,
    data: medicines
  });
});

// @desc    Get single medicine
// @route   GET /api/v1/pharmacy/medicines/:id
// @access  Private/Pharmacy Staff
exports.getMedicine = asyncHandler(async (req, res, next) => {
  const medicine = await Medicine.findOne({
    _id: req.params.id,
    pharmacyId: req.staff.pharmacy
  });

  if (!medicine) {
    return next(
      new ErrorResponse(`Medicine not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: medicine
  });
});

// @desc    Create new medicine
// @route   POST /api/v1/pharmacy/medicines
// @access  Private/Pharmacy Staff
exports.createMedicine = asyncHandler(async (req, res, next) => {
  // Check if staff has permission
  if (!req.staff.hasPermission('inventory', 'add')) {
    return next(new ErrorResponse('Not authorized to add medicines', 403));
  }

  // Add pharmacy ID to request body
  req.body.pharmacyId = req.staff.pharmacy;
  
  const medicine = await Medicine.create(req.body);

  res.status(201).json({
    success: true,
    data: medicine
  });
});

// @desc    Update medicine
// @route   PUT /api/v1/pharmacy/medicines/:id
// @access  Private/Pharmacy Staff
exports.updateMedicine = asyncHandler(async (req, res, next) => {
  // Check if staff has permission
  if (!req.staff.hasPermission('inventory', 'edit')) {
    return next(new ErrorResponse('Not authorized to update medicines', 403));
  }

  let medicine = await Medicine.findOne({
    _id: req.params.id,
    pharmacyId: req.staff.pharmacy
  });

  if (!medicine) {
    return next(
      new ErrorResponse(`Medicine not found with id of ${req.params.id}`, 404)
    );
  }

  // Prevent changing pharmacyId
  if (req.body.pharmacyId) {
    delete req.body.pharmacyId;
  }

  medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: medicine
  });
});

// @desc    Delete medicine
// @route   DELETE /api/v1/pharmacy/medicines/:id
// @access  Private/Pharmacy Staff
exports.deleteMedicine = asyncHandler(async (req, res, next) => {
  // Check if staff has permission
  if (!req.staff.hasPermission('inventory', 'delete')) {
    return next(new ErrorResponse('Not authorized to delete medicines', 403));
  }

  const medicine = await Medicine.findOne({
    _id: req.params.id,
    pharmacyId: req.staff.pharmacy
  });

  if (!medicine) {
    return next(
      new ErrorResponse(`Medicine not found with id of ${req.params.id}`, 404)
    );
  }

  await medicine.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Update medicine stock
// @route   PUT /api/v1/pharmacy/medicines/:id/stock
// @access  Private/Pharmacy Staff
exports.updateStock = asyncHandler(async (req, res, next) => {
  const { quantity, action } = req.body;
  
  if (!['add', 'subtract', 'set'].includes(action) || !quantity || quantity < 0) {
    return next(new ErrorResponse('Invalid action or quantity', 400));
  }

  const medicine = await Medicine.findOne({
    _id: req.params.id,
    pharmacyId: req.staff.pharmacy
  });

  if (!medicine) {
    return next(
      new ErrorResponse(`Medicine not found with id of ${req.params.id}`, 404)
    );
  }

  // Update stock based on action
  if (action === 'add') {
    medicine.stock += quantity;
  } else if (action === 'subtract') {
    if (medicine.stock < quantity) {
      return next(new ErrorResponse('Insufficient stock', 400));
    }
    medicine.stock -= quantity;
  } else {
    medicine.stock = quantity;
  }

  await medicine.save();

  res.status(200).json({
    success: true,
    data: medicine
  });
});

// @desc    Get low stock medicines
// @route   GET /api/v1/pharmacy/medicines/low-stock
// @access  Private/Pharmacy Staff
exports.getLowStockMedicines = asyncHandler(async (req, res, next) => {
  const threshold = req.query.threshold || 10;
  
  const medicines = await Medicine.find({
    pharmacyId: req.staff.pharmacy,
    stock: { $lte: parseInt(threshold) }
  }).sort('stock');

  res.status(200).json({
    success: true,
    count: medicines.length,
    data: medicines
  });
});

// @desc    Get expired or expiring soon medicines
// @route   GET /api/v1/pharmacy/medicines/expiring
// @access  Private/Pharmacy Staff
exports.getExpiringMedicines = asyncHandler(async (req, res, next) => {
  const days = parseInt(req.query.days) || 30;
  const date = new Date();
  date.setDate(date.getDate() + days);
  
  const medicines = await Medicine.find({
    pharmacyId: req.staff.pharmacy,
    expiryDate: { $lte: date },
    expiryDate: { $gte: new Date() } // Not expired yet
  }).sort('expiryDate');

  res.status(200).json({
    success: true,
    count: medicines.length,
    data: medicines
  });
});
