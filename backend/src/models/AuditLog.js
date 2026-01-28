// models/AuditLog.js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // User who performed the action
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  
  // Action details
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 
      'BLOCK', 'UNBLOCK', 'APPROVE', 'REJECT',
      'BULK_CREATE', 'BULK_UPDATE', 'BULK_DELETE',
      'EXPORT', 'IMPORT', 'SYSTEM_CHANGE'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: [
      'USER', 'PHARMACY', 'ORDER', 'MEDICINE', 
      'PRESCRIPTION', 'DELIVERY', 'ADMIN', 'SYSTEM'
    ]
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  
  // Description and details
  description: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Changes tracking
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  
  // IP and location tracking
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: String,
  location: {
    country: String,
    city: String,
    coordinates: [Number] // [longitude, latitude]
  },
  
  // Result and impact
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'PARTIAL'],
    default: 'SUCCESS'
  },
  errorMessage: String,
  
  // Metadata
  sessionId: String,
  requestId: String,
  batchId: String, // For bulk operations
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  collection: 'audit_logs'
});

// Indexes for performance
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ ipAddress: 1 });
auditLogSchema.index({ status: 1, createdAt: -1 });

// Text index for searching descriptions
auditLogSchema.index({ description: 'text', userEmail: 'text' });

// Static methods for common queries
auditLogSchema.statics = {
  // Get logs by user
  findByUser: function(userId, limit = 50, page = 1) {
    return this.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('user', 'name email');
  },
  
  // Get logs by action type
  findByAction: function(action, limit = 50, page = 1) {
    return this.find({ action })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('user', 'name email');
  },
  
  // Get logs by resource
  findByResource: function(entityType, entityId, limit = 50) {
    return this.find({ entityType, entityId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name email');
  },
  
  // Get system statistics
  getStats: function(startDate, endDate) {
    const match = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }
    
    return this.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            action: '$action',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.action',
          total: { $sum: '$count' },
          success: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'SUCCESS'] }, '$count', 0]
            }
          },
          failure: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'FAILURE'] }, '$count', 0]
            }
          }
        }
      }
    ]);
  }
};

// Virtual for time ago
auditLogSchema.virtual('timeAgo').get(function() {
  const seconds = Math.floor((new Date() - this.createdAt) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }
  return 'just now';
});

module.exports = mongoose.model('AuditLog', auditLogSchema);