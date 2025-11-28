// models/HealthProfile.js
const mongoose = require('mongoose');

const healthProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null],
    default: null
  },
  height: {
    value: Number,
    unit: {
      type: String,
      enum: ['cm', 'ft'],
      default: 'cm'
    }
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['kg', 'lb'],
      default: 'kg'
    }
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', null],
    default: null
  },
  allergies: [{
    name: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    notes: String
  }],
  medicalConditions: [{
    name: String,
    diagnosedDate: Date,
    isActive: Boolean,
    notes: String
  }],
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    prescribedBy: String,
    notes: String
  }],
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  }
}, { timestamps: true });

// Add text index for searching
healthProfileSchema.index({
  'allergies.name': 'text',
  'medicalConditions.name': 'text',
  'currentMedications.name': 'text'
});

module.exports = mongoose.model('HealthProfile', healthProfileSchema);