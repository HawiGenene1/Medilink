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
  manufacturer: String,
  supplier: String,
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
inventorySchema.virtual('stockStatus').get(function() {
  if (this.quantity <= 0) {
    return 'out_of_stock';
  } else if (this.quantity <= this.reorderLevel) {
    return 'low_stock';
  } else {
    return 'in_stock';
  }
});

// Virtual for days to expiry
inventorySchema.virtual('daysToExpiry').get(function() {
  if (!this.expiryDate) return null;
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  return Math.round((expiry - today) / oneDay);
});

// Pre-save hook to update lastRestocked when quantity increases
inventorySchema.pre('save', function(next) {
  if (this.isModified('quantity') && this.quantity > this.getOriginal('quantity')) {
    this.lastRestocked = new Date();
  }
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);