const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
    refundNumber: {
        type: String,
        required: true,
        unique: true
    },
    originalTransaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    refundItems: [{
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        subtotal: {
            type: Number,
            required: true
        },
        reason: {
            type: String,
            required: true
        },
        batchNumber: String,
        expiryDate: Date,
        condition: {
            type: String,
            enum: ['unopened', 'opened', 'damaged', 'expired'],
            default: 'unopened'
        }
    }],
    refundAmount: {
        type: Number,
        required: true,
        min: 0
    },
    refundMethod: {
        type: String,
        enum: ['cash', 'card', 'chapa', 'telebirr', 'cbe_birr', 'store_credit', 'bank_transfer'],
        required: true
    },
    refundReason: {
        type: String,
        required: true,
        enum: [
            'damaged_product',
            'wrong_item',
            'expired_product',
            'customer_request',
            'duplicate_purchase',
            'quality_issue',
            'prescription_cancelled',
            'other'
        ]
    },
    refundReasonDetails: {
        type: String
    },
    // Processing Information
    initiatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
        default: 'pending'
    },
    // Workflow Tracking
    workflowSteps: [{
        step: String,
        status: String,
        timestamp: Date,
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String
    }],
    // Approval Details
    approvalRequired: {
        type: Boolean,
        default: false
    },
    approvalNotes: {
        type: String
    },
    rejectionReason: {
        type: String
    },
    // Inventory Impact
    returnedToStock: {
        type: Boolean,
        default: false
    },
    stockUpdateDetails: [{
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine'
        },
        quantity: Number,
        status: {
            type: String,
            enum: ['restocked', 'quarantined', 'disposed']
        },
        updatedAt: Date
    }],
    // Financial Details
    taxAmount: {
        type: Number,
        default: 0
    },
    originalPaymentMethod: {
        type: String
    },
    refundTransactionRef: {
        type: String
    },
    // Shift Association
    shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CashierShift'
    },
    // Timestamps
    initiatedAt: {
        type: Date,
        default: Date.now
    },
    approvedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    // Customer Communication
    customerNotified: {
        type: Boolean,
        default: false
    },
    notificationSentAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Generate refund number before validation
refundSchema.pre('validate', async function () {
    if (!this.refundNumber) {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const count = await this.constructor.countDocuments({
            createdAt: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        });

        const dateStr = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0');
        this.refundNumber = `REF-${dateStr}-${String(count + 1).padStart(5, '0')}`;
    }
});

// Calculate refund amount before validation
refundSchema.pre('validate', function () {
    if (this.refundItems && this.refundItems.length > 0) {
        this.refundAmount = this.refundItems.reduce((total, item) => {
            item.subtotal = (item.quantity || 0) * (item.price || 0);
            return total + item.subtotal;
        }, 0);
    }
});

// Add workflow step method
refundSchema.methods.addWorkflowStep = function (step, status, user, notes) {
    this.workflowSteps.push({
        step,
        status,
        timestamp: new Date(),
        user,
        notes
    });
};

// Indexes
refundSchema.index({ refundNumber: 1 });
refundSchema.index({ originalTransaction: 1 });
refundSchema.index({ status: 1 });
refundSchema.index({ initiatedBy: 1 });
refundSchema.index({ createdAt: -1 });

const Refund = mongoose.model('Refund', refundSchema);

module.exports = Refund;
