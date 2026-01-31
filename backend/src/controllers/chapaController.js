const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const ChapaService = require('../services/chapaService');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

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

    // Guard: Prevent re-paying for an already paid order
    if (order.paymentStatus === 'paid') {
        const existingPayment = await Payment.findOne({ order: orderId, paymentStatus: 'completed' });
        return res.status(200).json({
            success: true,
            alreadyPaid: true,
            message: 'This order has already been paid successfully.',
            txRef: existingPayment?.transactionId
        });
    }

    // Guard: Check for an existing pending payment and reuse its checkout URL if possible
    const pendingPayment = await Payment.findOne({ order: orderId, paymentStatus: 'pending' }).sort({ createdAt: -1 });
    if (pendingPayment && pendingPayment.metadata?.get('checkoutUrl')) {
        return res.status(200).json({
            success: true,
            checkoutUrl: pendingPayment.metadata.get('checkoutUrl'),
            txRef: pendingPayment.transactionId,
            message: 'Resuming existing payment session.'
        });
    }

    // Generate unique transaction reference
    const txRef = `TX-${uuidv4()}`;

    // Prepare user data
    if (!order.customer) {
        console.error('Order customer not found/populated for order:', orderId);
        res.status(400);
        throw new Error('Order customer information is missing');
    }

    const firstName = order.customer.firstName || 'User';
    const lastName = order.customer.lastName || 'User';
    const email = order.customer.email || 'customer@example.com';
    const phone = phoneNumber || order.customer.phone || '0911223344';

    // Determine actual payment method string for DB
    const dbPaymentMethod = ['telebirr', 'mpesa', 'cbebirr', 'amole', 'awashbirr'].includes(paymentMethod)
        ? 'mobile_money'
        : (paymentMethod || 'card');

    console.log(`Initializing Payment for Order: ${orderId}, Method: ${paymentMethod}, Target DB Method: ${dbPaymentMethod}`);

    // DEMO MODE: Simulate successful payment
    const isDemoMode = String(process.env.PAYMENT_DEMO_MODE).toLowerCase().trim() === 'true';
    if (isDemoMode) {
        const demoTxRef = `TX-DEMO-${uuidv4()}`;
        console.log(`[DEMO MODE] Simulating success for order ${orderId}`);

        try {
            await Payment.create({
                order: orderId,
                transactionId: demoTxRef,
                amount: order.finalAmount,
                paymentMethod: dbPaymentMethod,
                paymentStatus: 'completed',
                paidAt: Date.now(),
                customer: order.customer._id,
                pharmacy: order.pharmacy?._id || order.pharmacy, // Handle both object and ID
                metadata: { selectedProvider: paymentMethod, demo: true }
            });

            order.paymentStatus = 'paid';
            order.status = 'confirmed';
            await order.save();

            return res.status(200).json({
                success: true,
                checkoutUrl: null,
                publicKey: 'DEMO',
                txRef: demoTxRef,
                data: { demo: true }
            });
        } catch (demoError) {
            console.error('[DEMO MODE] Failed to create payment/update order:', demoError);
            res.status(500);
            throw new Error(`Demo payment simulation failed: ${demoError.message}`);
        }
    }

    try {
        console.log(`Calling Chapa API for order ${orderId}...`);
        // Call Chapa Service
        const chapaResponse = await ChapaService.initializePayment({
            amount: order.finalAmount,
            currency: 'ETB',
            email: email,
            firstName: firstName,
            lastName: lastName,
            phoneNumber: phone,
            paymentMethod: paymentMethod,
            txRef: txRef,
            returnUrl: returnUrl,
            customization: {
                title: `Order ${order.orderNumber}`,
                description: 'Medilink Pharmacy Order'
            }
        });

        console.log('Chapa API Response:', JSON.stringify(chapaResponse));

        if (chapaResponse.success) {
            // Create Pending Payment Record
            await Payment.create({
                order: orderId,
                transactionId: txRef,
                amount: order.finalAmount,
                paymentMethod: dbPaymentMethod,
                paymentStatus: 'pending',
                customer: order.customer._id,
                pharmacy: order.pharmacy?._id || order.pharmacy,
                metadata: {
                    selectedProvider: paymentMethod,
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
            console.error('Chapa initialization failed business logic:', chapaResponse.message);
            res.status(400);
            throw new Error(chapaResponse.message || 'Chapa initialization failed');
        }

    } catch (error) {
        console.error('Chapa Controller Catch Block:', error);
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

    // DEMO MODE: Bypass verification for demo transactions
    if (txRef.startsWith('TX-DEMO-')) {
        payment.paymentStatus = 'completed';
        payment.paidAt = Date.now();
        await payment.save();

        const order = await Order.findById(payment.order);
        if (order) {
            order.paymentStatus = 'paid';
            order.status = 'confirmed';
            await order.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Payment verified successfully (Demo Mode)',
            data: {
                status: 'success',
                amount: payment.amount,
                currency: 'ETB',
                tx_ref: txRef,
                first_name: 'Demo',
                last_name: 'User'
            }
        });
    }

    try {
        const verification = await ChapaService.verifyPayment(txRef);

        if (verification.status === 'success') {
            // Update Payment Status
            payment.paymentStatus = 'completed';
            payment.paidAt = Date.now();
            await payment.save();

            // Update Order Status
            const order = await Order.findById(payment.order);
            if (order) {
                order.paymentStatus = 'paid';
                order.status = 'confirmed'; // Auto-confirm paid orders
                order.paymentDetails = {
                    ...order.paymentDetails,
                    transactionId: payment.transactionId,
                    chapaReference: verification.data.reference,
                    paidAt: new Date()
                };
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
            payment.paymentStatus = 'cancelled'; // or 'failed' depending on preference
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
