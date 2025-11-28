// models/Prescription.js
const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  imageUrl: {
    type: String,
    required: true
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);