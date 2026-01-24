const mongoose = require('mongoose');

const cashDrawerSchema = new mongoose.Schema({
    shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CashierShift',
        required: true
    },
    cashier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'closed'
    },
    // Cash Operations
    operations: [{
        type: {
            type: String,
            enum: ['open', 'close', 'add_cash', 'remove_cash', 'sale', 'refund'],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        reason: {
            type: String
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        authorizedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        transactionRef: {
            type: String
        },
        notes: {
            type: String
        }
    }],
    // Current Cash State
    currentCash: {
        type: Number,
        default: 0
    },
    // Cash Denominations
    denominations: {
        notes: {
            '1000': { type: Number, default: 0 },
            '500': { type: Number, default: 0 },
            '200': { type: Number, default: 0 },
            '100': { type: Number, default: 0 },
            '50': { type: Number, default: 0 },
            '10': { type: Number, default: 0 },
            '5': { type: Number, default: 0 },
            '1': { type: Number, default: 0 }
        },
        coins: {
            '1': { type: Number, default: 0 },
            '0.50': { type: Number, default: 0 },
            '0.25': { type: Number, default: 0 },
            '0.10': { type: Number, default: 0 },
            '0.05': { type: Number, default: 0 }
        }
    },
    // Audit Information
    lastOpenedAt: {
        type: Date
    },
    lastClosedAt: {
        type: Date
    },
    openCount: {
        type: Number,
        default: 0
    },
    // Alerts
    alerts: [{
        type: {
            type: String,
            enum: ['low_cash', 'high_cash', 'unauthorized_opening', 'variance_high']
        },
        message: String,
        timestamp: Date,
        resolved: {
            type: Boolean,
            default: false
        }
    }]
}, {
    timestamps: true
});

// Method to calculate total cash from denominations
cashDrawerSchema.methods.calculateTotalFromDenominations = function () {
    let total = 0;

    // Calculate from notes
    Object.keys(this.denominations.notes).forEach(denomination => {
        total += parseFloat(denomination) * this.denominations.notes[denomination];
    });

    // Calculate from coins
    Object.keys(this.denominations.coins).forEach(denomination => {
        total += parseFloat(denomination) * this.denominations.coins[denomination];
    });

    return total;
};

// Method to open drawer
cashDrawerSchema.methods.open = function (userId, reason, authorizedBy) {
    this.status = 'open';
    this.lastOpenedAt = new Date();
    this.openCount += 1;
    this.operations.push({
        type: 'open',
        amount: 0,
        reason,
        performedBy: userId,
        authorizedBy,
        timestamp: new Date()
    });
};

// Method to close drawer
cashDrawerSchema.methods.close = function (userId) {
    this.status = 'closed';
    this.lastClosedAt = new Date();
    this.operations.push({
        type: 'close',
        amount: this.currentCash,
        performedBy: userId,
        timestamp: new Date()
    });
};

// Indexes
cashDrawerSchema.index({ shift: 1 });
cashDrawerSchema.index({ cashier: 1 });
cashDrawerSchema.index({ status: 1 });

const CashDrawer = mongoose.model('CashDrawer', cashDrawerSchema);

module.exports = CashDrawer;
