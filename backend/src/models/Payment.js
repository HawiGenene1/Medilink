const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pharmacy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'ETB'
    },
    paymentMethod: {
        type: String,
        enum: ['CASH_ON_DELIVERY', 'CARD'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    paymentGateway: {
        type: String,
        enum: ['NONE', 'CHAPA', 'TELEBIRR'],
        default: 'NONE'
    },
    paymentGatewayResponse: {
        type: mongoose.Schema.Types.Mixed
    },
    paidAt: {
        type: Date
    },
    history: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String
    }]
}, {
    timestamps: true
});

// Index for quick lookups
paymentSchema.index({ order: 1 });
paymentSchema.index({ customer: 1 });
paymentSchema.index({ pharmacy: 1 });
paymentSchema.index({ transactionId: 1 }, { sparse: true });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
