const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get orders for a specific pharmacy
 * @route   GET /api/orders/pharmacy
 * @access  Private (Pharmacy Staff/Owner)
 */
exports.getPharmacyOrders = asyncHandler(async (req, res, next) => {
    const pharmacyId = req.user.pharmacyId;

    if (!pharmacyId) {
        return next(new ErrorResponse('Not authorized to access pharmacy orders', 403));
    }

    const { status, page = 1, limit = 10 } = req.query;
    const query = { pharmacy: pharmacyId };

    if (status) {
        query.status = status;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
        .populate('customer', 'firstName lastName email phone')
        .populate('items.medicine', 'name genericName brand strength packSize price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
        success: true,
        count: orders.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        data: orders
    });
});

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private (Pharmacy Staff/Owner)
 */
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
    const { status, note, reason } = req.body;
    const { id } = req.params;
    const pharmacyId = req.user.pharmacyId;

    let order = await Order.findById(id);

    if (!order) {
        return next(new ErrorResponse(`Order not found with id of ${id}`, 404));
    }

    // Validate ownership
    if (order.pharmacy.toString() !== pharmacyId.toString() && req.user.role !== 'admin') {
        return next(new ErrorResponse('Not authorized to update this order', 403));
    }

    // Use the model's method to update status with history
    await order.updateStatus(status, {
        userId: req.user._id,
        reason: reason || 'Operational update',
        note: note || `Status updated to ${status} by staff`
    });

    // Special logic for stock management if status becomes 'confirmed' or 'processing'
    // (This might already be handled elsewhere, but adding a hook here if needed)

    res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
        data: order
    });
});

/**
 * @desc    Verify prescription for an order
 * @route   PUT /api/orders/:id/verify-prescription
 * @access  Private (Pharmacy Staff/Pharmacist)
 */
exports.verifyPrescription = asyncHandler(async (req, res, next) => {
    const { isApproved, notes } = req.body;
    const { id } = req.params;
    const pharmacyId = req.user.pharmacyId;

    let order = await Order.findById(id);

    if (!order) {
        return next(new ErrorResponse(`Order not found with id of ${id}`, 404));
    }

    // Validate ownership
    if (order.pharmacy.toString() !== pharmacyId.toString() && req.user.role !== 'admin') {
        return next(new ErrorResponse('Not authorized to verify prescriptions for this order', 403));
    }

    // Use model method
    await order.verifyPrescription(req.user._id, isApproved, notes);

    res.status(200).json({
        success: true,
        message: `Prescription verification ${isApproved ? 'approved' : 'rejected'}`,
        data: order
    });
});
