const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const chapaService = require('../services/chapaService');
const { generateInvoice } = require('./invoiceController');

// @desc    Handle Chapa payment callback
// @route   GET /api/payments/chapa/callback
// @access  Public (called by Chapa)
const handleChapaCallback = asyncHandler(async (req, res) => {
    try {
        // Callback Response: { trx_ref, ref_id, status }
        const { trx_ref, ref_id, status } = req.query;

        console.log('Chapa callback received:', { trx_ref, ref_id, status });

        if (!trx_ref) {
            return res.status(400).json({
                success: false,
                message: 'Missing transaction reference'
            });
        }

        // Find payment by transaction reference
        const payment = await Payment.findOne({ transactionId: trx_ref })
            .populate('order');

        if (!payment) {
            console.error('Payment not found for trx_ref:', trx_ref);
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Verify payment with Chapa to ensure callback is legitimate
        const verification = await chapaService.verifyPayment(trx_ref);

        if (!verification.success) {
            console.error('Chapa verification failed:', verification.error);
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }

        // Update payment based on callback status
        if (status === 'success' && verification.status === 'success') {
            payment.paymentStatus = 'completed';
            payment.paidAt = new Date();
            payment.paymentGatewayResponse = {
                responseCode: '00',
                responseMessage: 'Payment successful',
                gatewayTransactionId: ref_id,
                rawResponse: verification.data
            };
            payment.addHistory('completed', 'Payment completed via Chapa callback', null);

            // Update order
            if (payment.order) {
                payment.order.paymentStatus = 'paid';
                payment.order.status = 'preparing';
                payment.order.paymentDetails = {
                    transactionId: trx_ref,
                    paidAt: new Date()
                };
                await payment.order.save();

                // Automatic Invoice Generation
                try {
                    console.log(`Generating invoice for order: ${payment.order._id}`);
                    await generateInvoice(payment.order._id);
                    console.log(`✅ Invoice generated automatically for order: ${payment.order.orderNumber}`);
                } catch (invError) {
                    console.error('❌ Automatic invoice generation failed:', invError.message);
                    // Do not fail the callback response, just log it
                }
            }

        } else if (status === 'failed') {
            payment.paymentStatus = 'failed';
            payment.failureReason = 'Payment failed from Chapa callback';
            payment.addHistory('failed', 'Payment failed', null);

            // Update order
            if (payment.order) {
                payment.order.paymentStatus = 'failed';
                await payment.order.save();
            }
        }

        await payment.save();

        // Send success response to Chapa
        res.status(200).json({
            success: true,
            message: 'Callback processed successfully'
        });

    } catch (error) {
        console.error('Chapa callback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process callback',
            error: error.message
        });
    }
});

// @desc    Handle Chapa webhook (POST)
// @route   POST /api/payments/chapa/webhook
// @access  Public (called by Chapa)
const handleChapaWebhook = asyncHandler(async (req, res) => {
    try {
        const webhookData = req.body;
        console.log('Chapa webhook received:', webhookData);

        const { trx_ref, status, reference } = webhookData;

        if (!trx_ref) {
            return res.status(400).json({
                success: false,
                message: 'Missing transaction reference'
            });
        }

        // Find payment
        const payment = await Payment.findOne({ transactionId: trx_ref })
            .populate('order');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Process webhook
        if (status === 'success') {
            payment.paymentStatus = 'completed';
            payment.paidAt = new Date();
            payment.paymentGatewayResponse = {
                gatewayTransactionId: reference,
                rawResponse: webhookData
            };

            if (payment.order) {
                payment.order.paymentStatus = 'paid';
                payment.order.status = 'preparing';
                await payment.order.save();

                // Automatic Invoice Generation
                try {
                    console.log(`Generating invoice for order via webhook: ${payment.order._id}`);
                    await generateInvoice(payment.order._id);
                } catch (invError) {
                    console.error('❌ Automatic webhook invoice generation failed:', invError.message);
                }
            }
        }

        await payment.save();

        res.status(200).json({
            success: true,
            message: 'Webhook processed'
        });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({
            success: false,
            message: 'Webhook processing failed'
        });
    }
});

module.exports = {
    handleChapaCallback,
    handleChapaWebhook
};
