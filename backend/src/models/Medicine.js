const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true
  },
  genericName: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  unit: {
    type: String,
    enum: ['tablet', 'capsule', 'bottle', 'box', 'tube', 'vial', 'ampoule', 'sachet', 'strip'],
    default: 'tablet'
  },
  dosage: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  manufactureDate: {
    type: Date
  },
  batchNumber: {
    type: String,
    trim: true
  },
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: [true, 'Pharmacy ID is required']
  },
  images: [{
    type: String
  }],
  sideEffects: [{
    type: String
  }],
  usageInstructions: {
    type: String,
    trim: true
  },
  warnings: [{
    type: String
  }],
  storage: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
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
  soldCount: {
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

// Index for searching
medicineSchema.index({ name: 'text', brand: 'text', genericName: 'text', description: 'text' });

// Index for pharmacy
medicineSchema.index({ pharmacyId: 1 });

// Index for category
medicineSchema.index({ category: 1 });

// Virtual for checking if medicine is expired
medicineSchema.virtual('isExpired').get(function() {
  return this.expiryDate < new Date();
});

// Virtual for checking if low stock
medicineSchema.virtual('isLowStock').get(function() {
  return this.quantity < 10;
});

const Medicine = mongoose.model('Medicine', medicineSchema);

module.exports = Medicine;

