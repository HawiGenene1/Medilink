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
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true
  }
}, { timestamps: true });
// Indexes
prescriptionSchema.index({ user: 1, status: 1 });
prescriptionSchema.index({ status: 1, createdAt: -1 });

const Prescription = mongoose.model('Prescription', prescriptionSchema);
module.exports = mongoose.model('Prescription', prescriptionSchema);