const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
        // Not required - cash orders might not have Payment record immediately
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        name: String,
        quantity: Number,
        price: Number,
        total: Number
    }],
    subtotal: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['paid', 'void'],
        default: 'paid'
    },
    pharmacyName: {
        type: String,
        default: 'Medilink Pharmacy'
    },
    pharmacyAddress: {
        type: String,
        default: 'Addis Ababa, Ethiopia'
    },
    pdfUrl: {
        type: String // Path to the generated PDF receipt
    }
}, { timestamps: true });

// Auto-generate invoice number
invoiceSchema.pre('validate', async function (next) {
    if (!this.invoiceNumber) {
        const count = await mongoose.model('Invoice').countDocuments();
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        this.invoiceNumber = `INV-${date}-${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
