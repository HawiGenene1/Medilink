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
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: true
  },
  roleTarget: {
    type: String,
    enum: ['OWNER', 'STAFF'],
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['new_order', 'low_stock', 'expired_medicine', 'near_expiry', 'out_of_stock', 'system'],
    default: 'system'
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

<<<<<<< HEAD
module.exports = mongoose.model('Notification', notificationSchema);
=======
// TTL index to auto-delete notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1
