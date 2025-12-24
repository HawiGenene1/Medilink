const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  // Pharmacy Reference
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pharmacy",
    required: [true, 'Pharmacy is required'],
    index: true
  },

  // Subscription Plan
  plan: {
    type: String,
    enum: ['Basic', 'Standard', 'Premium', 'Enterprise'],
    required: [true, 'Plan type is required'],
    index: true
  },

  // Billing cycle
  mode: {
    type: String,
    enum: ['monthly', 'annually'],
    default: 'monthly',
    required: true
  },

  // Payment details
  payment: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      enum: ['USD', 'ETB', 'EUR']
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'bank_transfer', 'mobile_money', 'other'],
      default: 'card'
    },
    transactionId: {
      type: String,
      index: true
    },
    lastBillingDate: {
      type: Date
    },
    nextBillingDate: {
      type: Date,
      index: true
    },
    billingCycleAnchor: {
      type: Date
    }
  },

  // Subscription limits
  limits: {
    maxPharmacies: {
      type: Number,
      default: 1,
      min: 1
    },
    maxUsers: {
      type: Number,
      default: 1,
      min: 1
    },
    maxProducts: {
      type: Number,
      default: 100,
      min: 10
    },
    storageLimit: {
      type: Number, // in MB
      default: 1024,
      min: 100
    },
    apiCalls: {
      type: Number,
      default: 1000,
      min: 100
    }
  },

  // Features
  features: {
    analytics: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    customDomain: {
      type: Boolean,
      default: false
    },
    inventoryManagement: {
      type: Boolean,
      default: true
    },
    salesReporting: {
      type: Boolean,
      default: false
    },
    multiBranch: {
      type: Boolean,
      default: false
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    emailSupport: {
      type: Boolean,
      default: true
    },
    phoneSupport: {
      type: Boolean,
      default: false
    }
  },

  // Trial period
  trial: {
    isTrial: {
      type: Boolean,
      default: false
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date,
      index: true
    },
    days: {
      type: Number,
      default: 14,
      min: 1,
      max: 30
    }
  },

  // Subscription dates
  startDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  endDate: {
    type: Date,
    index: true
  },
  canceledAt: {
    type: Date,
    index: true
  },
  
  // Metadata
  metadata: {
    notes: String,
    promoCode: String,
    discount: {
      amount: {
        type: Number,
        default: 0,
        min: 0
      },
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
      },
      description: String
    }
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    set: v => Math.round(v * 100) / 100 // Ensure 2 decimal places
  },
  currency: {
    type: String,
    default: 'ETB',
    uppercase: true,
    enum: ['ETB', 'USD', 'EUR']
  },
  
  // Auto-renewal
  autoRenew: {
    type: Boolean,
    default: true
  },
  
  // Cancellation
  cancellation: {
    requested: {
      type: Boolean,
      default: false
    },
    reason: String,
    feedback: String,
    effectiveDate: Date
  },
  
  // Soft delete
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },



  // Activation
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
    enum: ['active', 'pending', 'canceled', 'expired', 'trial', 'suspended'],
    default: 'pending',
    index: true
  },
  
  // Timestamps
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
  const now = new Date();
  this.updatedAt = now;

  // Set endDate based on mode if not provided
  if (!this.endDate && this.startDate) {
    const endDate = new Date(this.startDate);
    if (this.mode === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    this.endDate = endDate;
  }

  // Set next billing date for active subscriptions
  if (this.status === 'active' && !this.payment.nextBillingDate) {
    this.payment.nextBillingDate = this.endDate;
  }

  next();
});

// Instance method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         this.startDate <= now && 
         (!this.endDate || this.endDate >= now);
};

// Instance method to calculate days remaining
subscriptionSchema.methods.daysRemaining = function() {
  if (!this.endDate) return null;
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  return Math.ceil((this.endDate - new Date()) / oneDay);
};

// Static method to get active subscriptions
subscriptionSchema.statics.findActiveByPharmacy = function(pharmacyId) {
  return this.findOne({
    pharmacy: pharmacyId,
    status: 'active',
    startDate: { $lte: new Date() },
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gte: new Date() } }
    ]
  });
};

// Static method to get expiring subscriptions
subscriptionSchema.statics.findExpiring = function(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  
  return this.find({
    status: 'active',
    endDate: { 
      $gte: new Date(),
      $lte: date
    },
    autoRenew: false
  }).populate('pharmacy', 'name email phone');
};

// Static method to get trial subscriptions ending soon
subscriptionSchema.statics.findExpiringTrials = function(days = 3) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  
  return this.find({
    'trial.isTrial': true,
    'trial.endDate': { 
      $gte: new Date(),
      $lte: date
    },
    status: { $ne: 'canceled' }
  }).populate('pharmacy', 'name email phone');
};

// Virtual for formatted price
subscriptionSchema.virtual('formattedPrice').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency || 'USD'
  }).format(this.price);
});

// Virtual for subscription duration in days
subscriptionSchema.virtual('durationInDays').get(function() {
  if (!this.startDate || !this.endDate) return null;
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Enable text search on plan and status
subscriptionSchema.index({
  plan: 'text',
  status: 'text',
  'payment.transactionId': 'text'
});

// Query helper for active subscriptions
subscriptionSchema.query.active = function() {
  const now = new Date();
  return this.where({ 
    status: 'active',
    startDate: { $lte: now },
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gte: now } }
    ]
  });
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
