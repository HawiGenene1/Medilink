const asyncHandler = require('express-async-handler');
const ChapaService = require('../services/chapaService');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const crypto = require('crypto');

// @desc    Initialize Chapa Payment
// @route   POST /api/payments/chapa/initialize
// @access  Private
const initializeChapaPayment = asyncHandler(async (req, res) => {
    const { orderId, returnUrl, paymentMethod, phoneNumber } = req.body;

    const order = await Order.findById(orderId).populate('customer');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Generate unique transaction reference
    const txRef = `TX-${crypto.randomUUID()}`;

    // Prepare user data
    const customerName = order.customer.name || `${order.customer.firstName} ${order.customer.lastName}`;
    const [firstName, lastName] = customerName.split(' ');

    // Determine actual payment method string for DB (Must match Payment model enum: 'CASH_ON_DELIVERY', 'CARD', 'MOBILE_MONEY')
    const dbPaymentMethod = ['telebirr', 'mpesa', 'cbebirr', 'amole', 'awashbirr'].includes(paymentMethod)
        ? 'MOBILE_MONEY'
        : (paymentMethod?.toUpperCase() === 'CARD' ? 'CARD' : 'CARD');

    try {
        // Call Chapa Service
        const chapaResponse = await ChapaService.initializePayment({
            amount: order.finalAmount,
            currency: 'ETB',
            email: order.customer.email,
            firstName: firstName || 'User',
            lastName: lastName || 'User',
            phoneNumber: phoneNumber || order.customer.phone,
            paymentMethod: paymentMethod, // Pass specific method (e.g., 'telebirr')
            txRef: txRef,
            returnUrl: returnUrl,
            customization: {
                title: `Payment for Order ${order.orderNumber}`,
                description: 'Medilink Pharmacy Order'
            }
        });

        if (chapaResponse.status === 'success') {
            // Create Pending Payment Record
            await Payment.create({
                order: orderId,
                transactionId: txRef,
                amount: order.finalAmount,
                paymentMethod: dbPaymentMethod,
                paymentStatus: 'PENDING',
                paymentGateway: 'CHAPA',
                customer: order.customer._id,
                pharmacy: order.pharmacy._id,
                metadata: {
                    selectedProvider: paymentMethod, // Store provider (e.g. telebirr)
                    checkoutUrl: chapaResponse.data.checkout_url
                }
            });

            res.status(200).json({
                success: true,
                checkoutUrl: chapaResponse.data.checkout_url,
                publicKey: process.env.CHAPA_PUBLIC_KEY,
                txRef: txRef
            });
        } else {
            res.status(400);
            throw new Error(chapaResponse.message || 'Chapa initialization failed');
        }

    } catch (error) {
        console.error('Chapa Controller Error:', error);
        res.status(500);
        throw new Error(error.message || 'Payment initialization failed');
    }
});

// @desc    Verify Chapa Payment
// @route   GET /api/payments/chapa/verify/:txRef
// @access  Private
const verifyChapaPayment = asyncHandler(async (req, res) => {
    const { txRef } = req.params;

    const payment = await Payment.findOne({ transactionId: txRef });
    if (!payment) {
        res.status(404);
        throw new Error('Payment record not found');
    }

    try {
        const verification = await ChapaService.verifyPayment(txRef);

        if (verification.status === 'success') {
            // Update Payment Status
            payment.paymentStatus = 'PAID';
            payment.paidAt = Date.now();
            await payment.save();

            // Update Order Status
            const order = await Order.findById(payment.order);
            if (order) {
                order.paymentStatus = 'paid';
                order.status = 'confirmed'; // Auto-confirm paid orders
                await order.save();
            }

            res.status(200).json({
                success: true,
                message: 'Payment verified successfully',
                data: verification.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment not verified',
                status: verification.status
            });
        }

    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500);
        throw new Error('Payment verification failed');
    }
});

// @desc    Cancel Chapa Payment
// @route   PUT /api/payments/chapa/cancel/:txRef
// @access  Private
const cancelChapaPayment = asyncHandler(async (req, res) => {
    const { txRef } = req.params;

    const payment = await Payment.findOne({ transactionId: txRef });
    if (!payment) {
        res.status(404);
        throw new Error('Payment record not found');
    }

    try {
        const cancellation = await ChapaService.cancelTransaction(txRef);

        if (cancellation.status === 'success') {
            // Update Payment Status
            payment.paymentStatus = 'FAILED'; // or 'cancelled' if added to enum
            await payment.save();

            // Update Order Status if needed
            // Typically, we might keep the order as 'pending' to allow retry, 
            // or set to 'cancelled' if that's the business logic.
            // For now, let's just log it in the payment history.
            payment.addHistory('cancelled', 'Transaction cancelled by user/admin', req.user._id);
            await payment.save();

            res.status(200).json({
                success: true,
                message: 'Payment cancelled successfully',
                data: cancellation.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment cancellation failed',
                status: cancellation.status
            });
        }

    } catch (error) {
        console.error('Cancellation Error:', error);
        res.status(500);
        throw new Error(error.message || 'Payment cancellation failed');
    }
});

module.exports = {
    initializeChapaPayment,
    verifyChapaPayment,
    cancelChapaPayment
};
