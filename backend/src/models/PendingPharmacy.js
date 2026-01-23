const mongoose = require('mongoose');

const pendingPharmacySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  // Basic pharmacy information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'Nigeria' }
  },

  // Pharmacy specific details
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  pharmacyType: {
    type: String,
    enum: ['retail', 'hospital', 'clinical', 'compounding', 'specialty'],
    default: 'retail'
  },

  // Registration details
  registrationDocuments: [{
    documentType: {
      type: String,
      enum: ['license', 'certificate', 'id', 'proof_of_address', 'other']
    },
    documentUrl: String,
    documentName: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Contact person details
  contactPerson: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    position: { type: String, required: true }
  },

  // Status and workflow
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'requires_more_info'],
    default: 'pending'
  },

  // Review process
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: String,
  rejectionReason: String,

  // Additional information
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },

  services: [{
    type: String,
    description: String
  }],

  // Timestamps
  submittedAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
pendingPharmacySchema.index({ email: 1 });
pendingPharmacySchema.index({ licenseNumber: 1 });
pendingPharmacySchema.index({ status: 1 });
pendingPharmacySchema.index({ submittedAt: -1 });

// Virtual for days pending
pendingPharmacySchema.virtual('daysPending').get(function () {
  return Math.floor((Date.now() - this.submittedAt) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
pendingPharmacySchema.pre('save', function (next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('PendingPharmacy', pendingPharmacySchema);
