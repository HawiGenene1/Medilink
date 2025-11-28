const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  // Pharmacy Reference
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pharmacy",
    required: [true, 'Pharmacy is required']
  },

  // Subscription Plan
  mode: {
    type: String,
    enum: ['monthly', 'annually'],
    default: 'annually',
    required: true
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'ETB'
  },

  // Dates
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  renewalDate: {
    type: Date
  },

  // Payment Information
  payment: {
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['bank_transfer', 'card', 'cash', 'cheque'],
      default: null
    },
    transactionId: String,
    paidDate: Date,
    receiptUrl: String,
    notes: String
  },

  // Activation Status
  isActive: {
    type: Boolean,
    default: false
  },
  activationDate: Date,
  deactivationDate: Date,
  deactivationReason: String,

  // Renewal
  autoRenewal: {
    type: Boolean,
    default: true
  },
  renewalCount: {
    type: Number,
    default: 0
  },
  lastRenewalDate: Date,

  // Status Tracking
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'suspended'],
    default: 'active'
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days remaining
subscriptionSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const diff = this.endDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for is expired
subscriptionSchema.virtual('isExpired').get(function() {
  return new Date() > this.endDate;
});

// Indexes
subscriptionSchema.index({ pharmacy: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ 'payment.status': 1 });
subscriptionSchema.index({ endDate: 1 });

// Pre-save hook
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
