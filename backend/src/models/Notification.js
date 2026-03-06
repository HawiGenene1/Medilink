// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for general user notifications
  },
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: false // Optional for general notifications
  },
  roleTarget: {
    type: String,
    enum: ['OWNER', 'STAFF', 'ANY'],
    default: 'ANY',
    required: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: [
      'new_order',
      'order_alert',
      'order_update',
      'low_stock',
      'expired_medicine',
      'near_expiry',
      'out_of_stock',
      'system',
      'account',
      'promotion',
      'info',
      'warning'
    ],
    default: 'system'
  },
  link: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster querying
notificationSchema.index({ pharmacyId: 1, roleTarget: 1, isRead: 1, createdAt: -1 });

// TTL index to auto-delete notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
