const mongoose = require("mongoose");

const tempPharmacySchema = new mongoose.Schema({
  // Pharmacy Information
  pharmacyName: {
    type: String,
    required: [true, 'Pharmacy name is required'],
    trim: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true
  },
  establishedDate: {
    type: Date,
    required: [true, 'Established date is required']
  },
  
  // Contact Information
  ownerName: {
    type: String,
    required: [true, 'Owner name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9\-+()\s]+$/, 'Please provide a valid phone number']
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
    postalCode: {
      type: String,
      required: [true, 'Postal code is required']
    },
    country: {
      type: String,
      default: 'Ethiopia'
    }
  },
  
  // Business Information
  tinNumber: {
    type: String,
    required: [true, 'TIN number is required']
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  
  // Documents
  licenseDocument: {
    type: String, // URL to the document
    required: [true, 'License document is required']
  },
  tinDocument: {
    type: String, // URL to the document
    required: [true, 'TIN document is required']
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

// Indexes
tempPharmacySchema.index({ email: 1 }, { unique: true });
tempPharmacySchema.index({ 'licenseNumber': 1 }, { unique: true });
tempPharmacySchema.index({ status: 1 });

// Pre-save hook to update updatedAt
tempPharmacySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("TempPharmacy", tempPharmacySchema);
