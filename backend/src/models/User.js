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
  // password: {
  //   type: String,
  //   required: [true, 'Password is required'],
  //   minlength: [6, 'Password must be at least 6 characters'],
  //   select: false // Don't return password by default in queries
  // },
  // phone: {
  //   type: String,
  //   required: [true, 'Phone number is required'],
  //   trim: true
  // },
  // role: {
  //   type: String,
  //   enum: ['customer', 'pharmacy_staff', 'pharmacy_admin', 'cashier', 'delivery', 'admin'],
  //   default: 'customer'
  // },

  password: {
  type: String,
  required: true,
  select: false
},
username: {
  type: String,
  required: true,
  unique: true
},
role: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Role",
  required: true
},

  // For staff members - link to their pharmacy
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: function() {
      return ['pharmacy_staff', 'pharmacy_admin', 'cashier'].includes(this.role);
    }
  },
  // Address for customers and delivery personnel
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  // For delivery personnel
  vehicleInfo: {
    type: {
      type: String,
      enum: ['motorcycle', 'car', 'bicycle', 'scooter']
    },
    licensePlate: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

// Method to get user without sensitive data
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
