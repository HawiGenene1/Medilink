// models/Inventory.js
const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: true
  },
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reorderLevel: {
    type: Number,
    required: true,
    min: 0,
    default: 10
  },
  lastRestocked: Date,
  costPrice: {
    type: Number,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  batchNumber: String,
  expiryDate: Date,
  manufactureDate: Date,
  expiryAlertThreshold: {
    type: Number,
    default: 30 // days
  },
  unitType: {
    type: String,
    enum: ['Strip', 'Box', 'Bottle', 'Piece', 'Vial', 'Ampoule'],
    default: 'Piece'
  },
  tax: {
    type: Number,
    default: 0
  },
  supplier: {
    name: String,
    contact: String,
    invoiceNumber: String,
    dateReceived: Date
  },
  manufacturer: String,
  location: String,
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure unique combination of pharmacy and medicine
inventorySchema.index({ pharmacy: 1, medicine: 1 }, { unique: true });

// Index for low stock alerts
inventorySchema.index({
  pharmacy: 1,
  quantity: 1,
  reorderLevel: 1
});

// Virtual for stock status
inventorySchema.virtual('stockStatus').get(function () {
  if (this.quantity <= 0) {
    return 'out_of_stock';
  } else if (this.quantity <= this.reorderLevel) {
    return 'low_stock';
  } else {
    return 'in_stock';
  }
});

// Virtual for days to expiry
inventorySchema.virtual('daysToExpiry').get(function () {
  if (!this.expiryDate) return null;
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  return Math.round((expiry - today) / oneDay);
});

// Virtual for checking if medicine is expired
inventorySchema.virtual('isExpired').get(function () {
  if (!this.expiryDate) return false;
  return new Date(this.expiryDate) < new Date();
});

// Virtual for checking if medicine is near expiry
inventorySchema.virtual('isNearExpiry').get(function () {
  if (!this.expiryDate) return false;
  const daysToExpiry = this.daysToExpiry;
  if (daysToExpiry === null) return false;
  return daysToExpiry > 0 && daysToExpiry <= (this.expiryAlertThreshold || 30);
});

// Virtual for checking if stock is low
inventorySchema.virtual('isLowStock').get(function () {
  return this.quantity < this.reorderLevel;
});

// Removed broken pre-save hook as lastRestocked is handled in controller
module.exports = mongoose.model('Inventory', inventorySchema);