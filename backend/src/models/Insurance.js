// models/Insurance.js
const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    required: true,
    trim: true
  },
  policyNumber: {
    type: String,
    required: true,
    trim: true
  },
  groupNumber: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['health', 'pharmacy', 'vision', 'dental', 'other'],
    default: 'health'
  },
  cardFrontImage: String,
  cardBackImage: String,
  isPrimary: {
    type: Boolean,
    default: false
  },
  coverageDetails: {
    deductible: Number,
    coPay: Number,
    coInsurance: Number,
    outOfPocketMax: Number,
    annualMax: Number
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String,
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: {
        type: String,
        default: 'Ethiopia'
      }
    }
  },
  notes: {
    type: String,
    trim: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure only one primary insurance per user
insuranceSchema.pre('save', async function(next) {
  if (this.isPrimary) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isPrimary: false } }
    );
  }
  next();
});

module.exports = mongoose.model('Insurance', insuranceSchema);