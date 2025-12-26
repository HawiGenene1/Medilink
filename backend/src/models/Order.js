const mongoose = require('mongoose');

// Sub-schemas
const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['status_update', 'prescription_verification', 'delivery_update', 'payment_reminder', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: String,
  read: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  required: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['not_required', 'pending_verification', 'verified', 'rejected', 'expired'],
    default: 'not_required'
  },
  images: [{
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    rejectionReason: String
  }],
  notes: String,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  rejectionReason: String,
  expiresAt: Date
}, { _id: false });

const deliveryTrackingSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'],
    default: 'pending'
  },
  trackingNumber: String,
  carrier: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  deliveryProof: {
    image: String,
    signature: String,
    notes: String,
    deliveredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  locationUpdates: [{
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    status: String,
    notes: String
  }],
  failureReason: String,
  returnReason: String,
  returnNotes: String
}, { _id: false, timestamps: true });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required']
  },
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: [true, 'Pharmacy is required']
  },
  items: [{
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true
    },
    name: String,
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    subtotal: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: [
      'pending',           // Order placed, waiting for confirmation
      'confirmed',         // Order confirmed by pharmacy
      'processing',        // Order is being processed
      'awaiting_prescription', // Waiting for prescription upload/verification
      'ready_for_pickup',  // Order is ready for customer pickup
      'out_for_delivery',  // Order is with delivery person
      'delivered',         // Order has been delivered
      'completed',         // Order is completed (after delivery and payment)
      'cancelled',         // Order was cancelled
      'refunded',          // Order was refunded
      'on_hold'           // Order is on hold (e.g., payment issue, out of stock)
    ],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile_money', 'bank_transfer'],
    default: 'cash'
  },
  paymentDetails: {
    transactionId: String,
    paidAt: Date
  },
  deliveryAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'Ethiopia'
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  deliveryPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deliveryInstructions: {
    type: String,
    trim: true
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  prescriptionImage: {
    type: String
  },
  notes: {
    type: String,
    trim: true
  },
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    reason: String,
    note: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Enhanced notification system
  notifications: [notificationSchema],
  
  // Enhanced prescription handling
  prescription: prescriptionSchema,
  
  // Enhanced delivery tracking
  delivery: deliveryTrackingSchema,
  
  // Additional metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(5, '0')}`;
  }
  
  // Set default delivery status if not set
  if (!this.delivery) {
    this.delivery = { status: 'pending' };
  }
  
  // Set default prescription status if not set
  if (this.prescriptionRequired && !this.prescription) {
    this.prescription = {
      required: true,
      status: 'pending_verification'
    };
  }
  
  next();
});

// Calculate final amount before saving
orderSchema.pre('save', function(next) {
  this.finalAmount = this.totalAmount + this.deliveryFee + this.tax - this.discount;
  next();
});

// Add status to history when status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this._updatedBy, // This should be set in the controller
      reason: this._statusChangeReason, // This should be set in the controller
      note: this._statusChangeNote // This should be set in the controller
    });
    
    // Clear the temporary fields
    this._statusChangeReason = undefined;
    this._statusChangeNote = undefined;
  }
  next();
});

/**
 * Update order status with history tracking
 * @param {String} newStatus - The new status to set
 * @param {Object} options - Options for the status update
 * @param {String} options.userId - ID of the user making the change
 * @param {String} options.reason - Reason for the status change
 * @param {String} options.note - Additional notes about the status change
 * @returns {Promise<Order>} The updated order
 */
orderSchema.methods.updateStatus = async function(newStatus, { userId, reason, note } = {}) {
  if (this.status === newStatus) return this;
  
  // Set temporary fields that will be used in the pre-save hook
  this._updatedBy = userId;
  this._statusChangeReason = reason;
  this._statusChangeNote = note;
  
  // Update the status
  this.status = newStatus;
  
  // Update timestamps based on status
  const now = new Date();
  switch (newStatus) {
    case 'processing':
      this.processingAt = now;
      break;
    case 'ready_for_pickup':
      this.readyAt = now;
      break;
    case 'out_for_delivery':
      this.outForDeliveryAt = now;
      break;
    case 'delivered':
      this.deliveredAt = now;
      this.delivery.deliveredAt = now;
      this.delivery.status = 'delivered';
      break;
    case 'cancelled':
      this.cancelledAt = now;
      this.cancellationReason = reason || 'No reason provided';
      break;
  }
  
  return this.save();
};

/**
 * Verify a prescription
 * @param {String} userId - ID of the user verifying the prescription
 * @param {Boolean} isApproved - Whether the prescription is approved
 * @param {String} notes - Notes about the verification
 * @returns {Promise<Order>} The updated order
 */
orderSchema.methods.verifyPrescription = async function(userId, isApproved, notes = '') {
  if (!this.prescription || !this.prescription.required) {
    throw new Error('This order does not require prescription verification');
  }
  
  this.prescription.verifiedBy = userId;
  this.prescription.verifiedAt = new Date();
  this.prescription.status = isApproved ? 'verified' : 'rejected';
  this.prescription.notes = notes;
  
  // Update the order status based on verification
  if (isApproved) {
    this.status = this.status === 'awaiting_prescription' ? 'processing' : this.status;
  } else {
    this.status = 'on_hold';
  }
  
  return this.save();
};

/**
 * Update delivery status with location tracking
 * @param {String} status - New delivery status
 * @param {Object} options - Options for the delivery update
 * @param {Number[]} options.coordinates - [longitude, latitude] of the delivery location
 * @param {String} options.notes - Notes about the delivery update
 * @param {String} options.driverId - ID of the driver making the update
 * @returns {Promise<Order>} The updated order
 */
orderSchema.methods.updateDeliveryStatus = async function(status, { coordinates, notes, driverId } = {}) {
  if (!this.delivery) {
    this.delivery = {};
  }
  
  const update = {
    status,
    $push: {}
  };
  
  // Add location update if coordinates are provided
  if (coordinates && coordinates.length === 2) {
    update.$push['delivery.locationUpdates'] = {
      location: {
        type: 'Point',
        coordinates: [coordinates[0], coordinates[1]]
      },
      status,
      notes,
      timestamp: new Date()
    };
  }
  
  // Update driver if provided
  if (driverId) {
    update.driver = driverId;
  }
  
  // Update timestamps based on status
  const now = new Date();
  switch (status) {
    case 'picked_up':
      update.pickedUpAt = now;
      break;
    case 'out_for_delivery':
      update.outForDeliveryAt = now;
      break;
    case 'delivered':
      update.deliveredAt = now;
      this.status = 'delivered';
      this.deliveredAt = now;
      break;
    case 'failed':
      update.failedAt = now;
      break;
  }
  
  return this.updateOne(update);
};

// Index for customer orders
orderSchema.index({ customer: 1, createdAt: -1 });

// Index for pharmacy orders
orderSchema.index({ pharmacy: 1, createdAt: -1 });

// Index for delivery person
orderSchema.index({ deliveryPerson: 1, status: 1 });

// Index for delivery tracking
orderSchema.index({ 'delivery.trackingNumber': 1 }, { sparse: true });
orderSchema.index({ 'delivery.status': 1 });
orderSchema.index({ 'delivery.driver': 1 });
orderSchema.index({ 'delivery.locationUpdates.timestamp': 1 });

// Index for prescription status
orderSchema.index({ 'prescription.status': 1 });
orderSchema.index({ 'prescription.verifiedBy': 1 });

// Text index for search
orderSchema.index({
  'orderNumber': 'text',
  'customer.name': 'text',
  'delivery.trackingNumber': 'text',
  'items.name': 'text'
}, {
  weights: {
    'orderNumber': 10,
    'customer.name': 5,
    'delivery.trackingNumber': 8,
    'items.name': 3
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
