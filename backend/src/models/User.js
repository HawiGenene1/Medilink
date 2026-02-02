const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default in queries
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['customer', 'cashier', 'delivery', 'admin', 'staff', 'pharmacy_owner', 'PHARMACY_OWNER', 'pharmacist', 'technician', 'assistant', 'pharmacy_staff', 'pharmacy_admin'],
    default: 'customer'
  },
  username: {
    type: String,
    required: false,
    sparse: true
  },

  // For staff members - link to their pharmacy
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: function () {
      return ['cashier', 'staff'].includes(this.role);
    }
  },
  // Addresses
  addresses: [{
    label: { type: String, default: 'Home' }, // e.g., Home, Work
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'Ethiopia' },
    isDefault: { type: Boolean, default: false }
  }],
  // Legacy address field (kept for backward compatibility during migration)
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },

  avatar: {
    type: String,
    default: ''
  },

  // Security & 2FA
  passwordChangedAt: Date,
  isTwoFactorEnabled: { type: Boolean, default: false },
  recoveryEmail: String,
  recoveryPhone: String,
  twoFactorCode: String,
  twoFactorCodeExpires: Date,
  // For delivery personnel
  vehicleInfo: {
    type: {
      type: String,
      enum: ['motorcycle', 'car', 'bicycle', 'scooter']
    },
    licensePlate: String
  },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'rejected'],
    default: 'pending'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  lastLogin: {
    type: Date
  },
  resetToken: { type: String, default: null },
  resetTokenExpire: { type: Date, default: null },

  // Admin management fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  disabledAt: Date,
  disabledReason: String,
  disabledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  enabledAt: Date,
  enabledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  roleUpdatedAt: Date,
  roleUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  roleUpdateReason: String,
  permissions: [{
    type: String
  }]
}, {
  timestamps: true
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ pharmacyId: 1 });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});
// Method to compare passwords
userSchema.methods.comparePassword = function (candidatePassword) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
      if (err) return reject(err);
      resolve(isMatch);
    });
  });
};

// Method to get user without sensitive data
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

userSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
