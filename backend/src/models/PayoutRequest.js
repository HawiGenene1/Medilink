const mongoose = require('mongoose');

const payoutRequestSchema = new mongoose.Schema({
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'rejected'],
        default: 'pending'
    },
    method: {
        type: String,
        enum: ['bank_transfer', 'mobile_money', 'wallet'],
        default: 'bank_transfer'
    },
    paymentDetails: {
        bankName: String,
        accountNumber: String,
        accountHolderName: String,
        mobileNumber: String
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    processedAt: Date,
    rejectionReason: String,
    transactionReference: String
}, {
    timestamps: true
});

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);
