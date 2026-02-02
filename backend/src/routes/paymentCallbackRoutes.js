const express = require('express');
const router = express.Router();
const paymentCallbackController = require('../controllers/paymentCallbackController');

// @desc    Chapa payment callback (GET)
// @route   GET /api/payments/chapa/callback
// @access  Public (called by Chapa)
// Query params: trx_ref, ref_id, status
router.get('/chapa/callback', paymentCallbackController.handleChapaCallback);

// @desc    Chapa webhook (POST)
// @route   POST /api/payments/chapa/webhook
// @access  Public (called by Chapa)
router.post('/chapa/webhook', paymentCallbackController.handleChapaWebhook);

module.exports = router;
