// models/Promotion.js
const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minPurchaseAmount: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  maxUses: {
    type: Number,
    default: null
  },
  currentUses: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  medicines: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine'
  }]
}, { timestamps: true });

// Index for active promotions
promotionSchema.index({ 
  code: 1, 
  isActive: 1, 
  validFrom: 1, 
  validUntil: 1 
});

// Check if promotion is valid
promotionSchema.methods.isValid = function() {
  const now = new Date();
  return this.isActive && 
         this.validFrom <= now && 
         this.validUntil >= now && 
         (this.maxUses === null || this.currentUses < this.maxUses);
};

module.exports = mongoose.model('Promotion', promotionSchema);