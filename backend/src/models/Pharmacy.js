const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  }
}, { _id: false });

const pharmacySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Pharmacy name is required'],
    trim: true
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required']
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true,
    trim: true
  },
  licenseExpiryDate: {
    type: Date,
    required: false
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },

  // Address Information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required']
    },
    country: {
      type: String,
      required: true,
      default: 'Ethiopia'
    }
  },

  // Location for geospatial queries
  location: {
    type: pointSchema,
    required: false
  },
  // References
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: false
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'on_hold'],
    default: 'pending'
  },
  description: {
    type: String,
    trim: true
  },
  openingHours: {
    monday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    friday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, isClosed: { type: Boolean, default: true } }
  },
  images: [{
    type: String
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allowOwnerInventoryManagement: {
    type: Boolean,
    default: false
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
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

// Index for location-based queries
pharmacySchema.index({ location: '2dsphere' });

// Index for search
pharmacySchema.index({ name: 'text', description: 'text' });

const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);

module.exports = Pharmacy;
