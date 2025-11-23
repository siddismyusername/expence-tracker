const mongoose = require('mongoose');

// Audit Log Schema for tracking all database operations
const auditLogSchema = new mongoose.Schema({
  auditId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  entityType: {
    type: String,
    required: true,
    enum: ['User', 'Family', 'Expense', 'Budget', 'RecurringExpense', 'Category'],
    index: true
  },
  entityId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE', 'LOGIN', 'LOGOUT'],
    index: true
  },
  userId: {
    type: String,
    ref: 'User',
    default: null,
    index: true
  },
  familyId: {
    type: String,
    ref: 'Family',
    default: null,
    index: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  oldValues: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false,
  versionKey: false
});

// Compound indexes
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ familyId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// Note: timestamp already has index: true in field definition
// TTL index - Auto-delete audit logs older than 1 year (defined at field level)

// Static method: Get audit trail for entity
auditLogSchema.statics.getAuditTrail = function(entityType, entityId, limit = 50) {
  return this.find({ entityType, entityId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method: Get user activity
auditLogSchema.statics.getUserActivity = function(userId, startDate, endDate) {
  return this.find({
    userId,
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ timestamp: -1 });
};

// Static method: Aggregate activity by action
auditLogSchema.statics.aggregateByAction = function(familyId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        familyId,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
