const mongoose = require('mongoose');
const validator = require('validator');

const pharmacyStaffSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: [true, 'Pharmacy reference is required']
  },
  role: {
    type: String,
    enum: ['pharmacist', 'cashier'],
    default: 'cashier',
    required: [true, 'Role is required']
  },
  permissions: {
    inventory: {
      view: { type: Boolean, default: true },
      add: { type: Boolean, default: true },
      edit: { type: Boolean, default: true },
      delete: { type: Boolean, default: false }
    },
    orders: {
      view: { type: Boolean, default: true },
      process: { type: Boolean, default: true },
      cancel: { type: Boolean, default: false }
    },
    customers: {
      view: { type: Boolean, default: true },
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  loginHistory: [{
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
pharmacyStaffSchema.index({ user: 1, pharmacy: 1 }, { unique: true });

// Virtual for staff's full name
pharmacyStaffSchema.virtual('name').get(function () {
  return this.user?.name || 'Unknown';
});

// Check if staff has specific permission
pharmacyStaffSchema.methods.hasPermission = function (area, action) {
  if (!this.permissions[area]) return false;
  return this.permissions[area][action] === true;
};

// Check if staff is active and can access the system
pharmacyStaffSchema.methods.canAccess = function () {
  if (!this.isActive) return false;

  // Check if pharmacy subscription is active
  if (this.pharmacy?.subscription?.status !== 'active') {
    return false;
  }

  return true;
};

const PharmacyStaff = mongoose.model('PharmacyStaff', pharmacyStaffSchema);

module.exports = PharmacyStaff;
