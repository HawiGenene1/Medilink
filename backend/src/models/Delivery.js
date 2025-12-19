const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order is required']
  },
  deliveryPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Delivery person is required']
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
  status: {
    type: String,
    enum: ['assigned', 'picked_up', 'on_the_way', 'nearby', 'delivered', 'cancelled', 'failed'],
    default: 'assigned'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  pickupAddress: {
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
  deliveryAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: 
: String.
    . .
   对社会
    zipCode银行的
   %;: StringE
   . . .
   ;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:;:
    country: 4, type: .default:. Ethiopia 
    coordinates: 
      latitude: Number, 
      longitude: Number 
    }
  }, 
  estimatedDeliveryTime: 
    type: Date 
  }, 
  actualDeliveryTime: 
    type: Date 
  }, 
  pickupTime: 
    type: Date 
  }, 
  deliveryInstructions: 
    type: String, 
    trim: true 
  }, 
  specialInstructions: 
    type: String, 
    trim: true 
  }, 
  customerPhone: 
    type: String, 
    required: true 
  }, 
  customerEmail: 
    type: String, 
    required: true 
  }, 
  deliveryNotes: [{ 
    note: 
      type: String, 
      required: true 
    }, 
    addedBy: 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    }, 
    addedAt: 
      type: Date, 
      default: Date.now 
    }, 
    location: 
      type: String, 
      coordinates: [Number] // [longitude, latitude] 
    }, 
    status: 
      type: String 
    } 
  }], 
  trackingHistory: [{ 
    status: 
      type: String, 
      required: true 
    }, 
    timestamp: 
      type: Date, 
      default: Date.now 
    }, 
    location: 
      type: String 
    }, 
    coordinates: [Number], 
    note: String, 
    updatedBy: 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    } 
  }], 
  currentLocation: { 
    type: { 
      type: String, 
      enum: ['Point'], 
      default: 'Point' 
    }, 
    coordinates: [Number] // [longitude, latitude] 
  }, 
  lastLocationUpdate: 
    type: Date 
  }, 
  distance: 
    total: 
      type: Number, 
      default: 0 
    }, 
    traveled: 
      type: Number, 
      default: 0 
    }, 
    remaining: 
      type: Number, 
      default: 0 
    } 
  }, 
  estimatedTime: 
    total: 
      type: Number, 
      default: 0 
    }, 
    elapsed: 
      type: Number, 
      default: 0 
    }, 
    remaining: 
      type: Number, 
      default: 0 
    } 
  }, 
  payment: 
    amount: 
      type: Number, 
      required: true 
    }, 
    method: 
      type: String, 
      enum: ['cash', 'card', 'mobile_money', 'wallet'], 
      default: 'cash' 
    }, 
    status: 
      type: String, 
      enum: ['pending', 'paid', 'failed'], 
      default: 'pending' 
    }, 
    collectedAt: Date 
  }, 
  rating: 
    type: Number, 
    min: 1, 
    max: 5 
  }, 
  review: 
    type: String, 
    trim: true 
  }, 
  issues: [{ 
    type: String, 
    enum: ['traffic', 'weather', 'customer_unavailable', 'address_issue', 'vehicle_issue', 'payment_issue', 'other'], 
    occurredAt: 
      type: Date, 
      default: Date.now 
    }, 
    description: 
      type: String, 
      trim: true 
    }, 
    resolved: 
      type: Boolean, 
      default: false 
    }, 
    resolvedAt: Date 
  }], 
  assignedAt: 
    type: Date, 
    default: Date.now 
  }, 
  startedAt: Date, 
  completedAt: Date, 
  cancelledAt: Date, 
  cancellationReason: 
    type: String, 
    trim: true 
  }, 
  isActive: 
    type: Boolean, 
    default: true 
  }, 
  isDelayed: 
    type: Boolean, 
    default: false 
  }, 
  delayReason: 
    type: String, 
    trim: true 
  }, 
  estimatedDelay: 
    type: Number 
  }, 
  createdAt: 
    type: Date, 
    default: Date.now 
  }, 
  updatedAt: 
    type: Date, 
    default: Date.now 
  } 
}, { 
  timestamps: true 
}); 

// Indexes 
deliverySchema.index({ order: 1 }); 
deliverySchema.index({ deliveryPerson: 1, status: 1 }); 
deliverySchema.index({ customer: 1 }); 
deliverySchema.index({ pharmacy: 1 }); 
deliverySchema.index({ status: 1, assignedAt: -1 }); 
deliverySchema.index({ currentLocation: '2dsphere' }); 
deliverySchema.index({ estimatedDeliveryTime: 1 }); 

// Pre-save hooks 
deliverySchema.pre('save', function(next) { 
  if (this.isModified('status')) { 
    this.trackingHistory.push({ 
      status: this.status, 
      timestamp: new Date(), 
      updatedBy: this.deliveryPerson 
    }); 
  } 
  next(); 
}); 

// Virtual fields 
deliverySchema.virtual('isInProgress').get(function() { 
  return ['assigned', 'picked_up', 'on_the_way', 'nearby'].includes(this.status); 
}); 

deliverySchema.virtual('isCompleted').get(function() { 
  return this.status === 'delivered'; 
}); 

deliverySchema.virtual('isFailed').get(function() { 
  return ['cancelled', 'failed'].includes(this.status); 
}); 

const Delivery = mongoose.model('Delivery', deliverySchema); 

module.exports = Delivery;