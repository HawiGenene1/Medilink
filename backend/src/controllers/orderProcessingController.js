const Order = require('../models/Order');
const Payment = require('../models/Payment');
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

    // Sync with Payment model
    try {
        if (order.payment) {
            const paymentUpdate = {};
            let paymentNote = '';

            if (status === 'delivered' && order.paymentMethod === 'CASH_ON_DELIVERY') {
                paymentUpdate.paymentStatus = 'PAID';
                paymentUpdate.paidAt = new Date();
                paymentNote = 'Payment collected upon delivery (COD)';

                // Also update the order's internal payment status field for redundancy
                order.paymentStatus = 'PAID';
                order.paymentDetails = {
                    ...order.paymentDetails,
                    paidAt: paymentUpdate.paidAt
                };
                await order.save();
            } else if (status === 'cancelled') {
                paymentUpdate.paymentStatus = 'FAILED';
                paymentNote = 'Payment cancelled due to order cancellation';

                order.paymentStatus = 'FAILED';
                await order.save();
            }

            if (Object.keys(paymentUpdate).length > 0) {
                await Payment.findByIdAndUpdate(order.payment, {
                    ...paymentUpdate,
                    $push: {
                        history: {
                            status: paymentUpdate.paymentStatus,
                            note: paymentNote
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error('Failed to sync payment status:', error);
        // We don't fail the whole request if payment sync fails, but we log it
    }

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
