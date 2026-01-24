const mongoose = require('mongoose');

const cashierShiftSchema = new mongoose.Schema({
    cashier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shiftNumber: {
        type: String,
        required: true,
        unique: true
    },
    startTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    openingCash: {
        type: Number,
        required: true,
        min: 0
    },
    closingCash: {
        type: Number,
        min: 0
    },
    expectedCash: {
        type: Number,
        min: 0
    },
    cashVariance: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'on_break', 'ended'],
        default: 'active'
    },
    breakStartTime: {
        type: Date
    },
    breakEndTime: {
        type: Date
    },
    totalBreakDuration: {
        type: Number, // in minutes
        default: 0
    },
    // Financial Summary
    totalSales: {
        type: Number,
        default: 0
    },
    totalRefunds: {
        type: Number,
        default: 0
    },
    netAmount: {
        type: Number,
        default: 0
    },
    transactionCount: {
        type: Number,
        default: 0
    },
    // Payment Method Breakdown
    paymentMethodBreakdown: {
        cash: { type: Number, default: 0 },
        chapa: { type: Number, default: 0 },
        telebirr: { type: Number, default: 0 },
        cbe_birr: { type: Number, default: 0 },
        card: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
    },
    // Transaction Breakdown
    voidedTransactions: {
        type: Number,
        default: 0
    },
    voidedAmount: {
        type: Number,
        default: 0
    },
    discountsGiven: {
        type: Number,
        default: 0
    },
    // Cash Drawer Events
    cashDrawerOpenings: [{
        time: Date,
        reason: String,
        openedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    // Notes and Approvals
    notes: {
        type: String
    },
    closedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    managerApproval: {
        approved: { type: Boolean, default: false },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        approvedAt: Date,
        notes: String
    }
}, {
    timestamps: true
});

// Generate shift number before saving
cashierShiftSchema.pre('save', async function (next) {
    if (!this.shiftNumber) {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        const count = await mongoose.model('CashierShift').countDocuments({
            createdAt: {
                $gte: new Date(date.setHours(0, 0, 0, 0)),
                $lt: new Date(date.setHours(23, 59, 59, 999))
            }
        });
        this.shiftNumber = `SH-${dateStr}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

// Calculate net amount before saving
cashierShiftSchema.pre('save', function (next) {
    this.netAmount = this.totalSales - this.totalRefunds;
    if (this.closingCash && this.openingCash) {
        this.expectedCash = this.openingCash + this.netAmount;
        this.cashVariance = this.closingCash - this.expectedCash;
    }
    next();
});

// Indexes
cashierShiftSchema.index({ cashier: 1, createdAt: -1 });
cashierShiftSchema.index({ status: 1 });
cashierShiftSchema.index({ shiftNumber: 1 });

const CashierShift = mongoose.model('CashierShift', cashierShiftSchema);

module.exports = CashierShift;
