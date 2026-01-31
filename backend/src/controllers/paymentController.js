const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

// @desc    Get customer payment history
// @route   GET /api/payments/customer
// @access  Private (Customer)
const getCustomerPayments = asyncHandler(async (req, res) => {
    const { status, limit = 50, page = 1 } = req.query;

    // Build filter
    const filter = { customer: req.user._id };
    if (status) {
        filter.paymentStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(filter)
        .populate('order', 'orderNumber finalAmount status')
        .populate('pharmacy', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
        success: true,
        count: payments.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        data: payments
    });
});

// @desc    Get payment details by order
// @route   GET /api/payments/order/:orderId
// @access  Private (Customer)
const getPaymentByOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const payment = await Payment.findOne({ order: orderId })
        .populate('order', 'orderNumber finalAmount items')
        .populate('pharmacy', 'name')
        .populate('customer', 'firstName lastName email');

    if (!payment) {
        res.status(404);
        throw new Error('Payment record not found for this order');
    }

    // Ensure customer can only view their own payments
    if (payment.customer._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to view this payment');
    }

    res.status(200).json({
        success: true,
        data: payment
    });
});

// @desc    Get payment receipt details
// @route   GET /api/payments/receipt/:txRef
// @access  Private (Customer)
const getPaymentReceipt = asyncHandler(async (req, res) => {
    const { txRef } = req.params;

    const payment = await Payment.findOne({ transactionId: txRef })
        .populate({
            path: 'order',
            select: 'orderNumber items finalAmount createdAt deliveryAddress',
            populate: {
                path: 'items.medicine',
                select: 'name'
            }
        })
        .populate('pharmacy', 'name address phone')
        .populate('customer', 'firstName lastName email phone');

    if (!payment) {
        res.status(404);
        throw new Error('Payment receipt not found');
    }

    // Ensure customer can only view their own receipts
    if (payment.customer._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to view this receipt');
    }

    // Format receipt data
    const receipt = {
        transactionId: payment.transactionId,
        orderNumber: payment.order.orderNumber,
        date: payment.paidAt || payment.createdAt,
        status: payment.paymentStatus,
        customer: {
            name: `${payment.customer.firstName} ${payment.customer.lastName}`,
            email: payment.customer.email,
            phone: payment.customer.phone
        },
        pharmacy: {
            name: payment.pharmacy.name,
            address: payment.pharmacy.address,
            phone: payment.pharmacy.phone
        },
        items: payment.order.items.map(item => ({
            name: item.medicine?.name || item.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal
        })),
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        metadata: payment.metadata
    };

    res.status(200).json({
        success: true,
        data: receipt
    });
});

// @desc    Get all payments (Admin/Cashier)
// @route   GET /api/payments/all
// @access  Private (Admin, Cashier)
const getAllPayments = asyncHandler(async (req, res) => {
    const { status, pharmacy, startDate, endDate, limit = 50, page = 1 } = req.query;

    // Build filter
    const filter = {};

    if (status) {
        filter.paymentStatus = status;
    }

    if (pharmacy) {
        filter.pharmacy = pharmacy;
    }

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
            filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            filter.createdAt.$lte = new Date(endDate);
        }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(filter)
        .populate('order', 'orderNumber finalAmount status')
        .populate('pharmacy', 'name')
        .populate('customer', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
        success: true,
        count: payments.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        data: payments
    });
});

module.exports = {
    getCustomerPayments,
    getPaymentByOrder,
    getPaymentReceipt,
    getAllPayments
};
