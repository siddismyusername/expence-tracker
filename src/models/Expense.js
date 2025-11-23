const mongoose = require('mongoose');

const { CATEGORIES } = require('../utils/constants');

// Expense Schema with family context and split functionality
const expenseSchema = new mongoose.Schema({
  expenseId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  familyId: {
    type: String,
    ref: 'Family',
    default: null,
    index: true
  },
  userId: {
    type: String,
    ref: 'User',
    required: true,
    index: true
  },
  paidBy: {
    type: String,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
    validate: {
      validator: function(v) {
        return v > 0;
      },
      message: 'Amount must be greater than 0'
    }
  },
  category: {
    type: String,
    required: true,
    enum: CATEGORIES,
    index: true
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  type: {
    type: String,
    enum: ['personal', 'family'],
    default: 'personal',
    index: true
  },
  splitType: {
    type: String,
    enum: ['equal', 'custom', 'full'],
    default: 'full'
  },
  sharedWith: [{
    userId: {
      type: String,
      ref: 'User',
      required: true
    },
    name: String,
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    isPaid: {
      type: Boolean,
      default: false
    }
  }],
  recurring: {
    type: Boolean,
    default: false,
    index: true
  },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', null],
    default: null
  },
  recurringExpenseId: {
    type: String,
    ref: 'RecurringExpense',
    default: null,
    index: true
  },
  nextOccurrence: {
    type: Date,
    default: null
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
    index: true
  },
  approvedBy: {
    type: String,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  attachments: [{
    fileId: String,
    fileName: String,
    fileType: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number] // [longitude, latitude]
    },
    address: String
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: String,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
  // versionKey defaults to '__v' for optimistic locking
});

// Compound Indexes for query optimization
expenseSchema.index({ familyId: 1, date: -1 });
expenseSchema.index({ familyId: 1, category: 1, date: -1 });
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, type: 1, date: -1 });
expenseSchema.index({ paidBy: 1, date: -1 });
expenseSchema.index({ familyId: 1, type: 1, approvalStatus: 1 });
expenseSchema.index({ familyId: 1, paidBy: 1, category: 1 });
expenseSchema.index({ date: 1, category: 1 });
expenseSchema.index({ isDeleted: 1, deletedAt: 1 });

// Partial index for pending approvals
expenseSchema.index(
  { familyId: 1, approvalStatus: 1, createdAt: -1 },
  { partialFilterExpression: { approvalStatus: 'pending' } }
);

// Text index for search functionality
expenseSchema.index({ description: 'text', tags: 'text' });

// Geospatial index for location-based queries
expenseSchema.index({ location: '2dsphere' });

// TTL index for soft-deleted expenses (auto-archive after 90 days)
expenseSchema.index(
  { deletedAt: 1 },
  { 
    expireAfterSeconds: 7776000, // 90 days
    partialFilterExpression: { isDeleted: true }
  }
);

// Virtual for split count
expenseSchema.virtual('splitCount').get(function() {
  return this.sharedWith ? this.sharedWith.length : 0;
});

// Virtual for pending amount
expenseSchema.virtual('pendingAmount').get(function() {
  if (!this.sharedWith || this.sharedWith.length === 0) return 0;
  return this.sharedWith
    .filter(s => !s.isPaid)
    .reduce((sum, s) => sum + s.amount, 0);
});

// Pre-save validation
expenseSchema.pre('save', async function(next) {
  // Validate familyId exists if type is family
  if (this.type === 'family' && !this.familyId) {
    return next(new Error('familyId required for family expenses'));
  }
  
  // Validate split amounts equal total
  if (this.sharedWith && this.sharedWith.length > 0) {
    const splitTotal = this.sharedWith.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(splitTotal - this.amount) > 0.01) {
      return next(new Error('Split amounts must equal total amount'));
    }
  }
  
  // Set equal splits if splitType is equal
  if (this.splitType === 'equal' && this.sharedWith && this.sharedWith.length > 0) {
    const perPerson = this.amount / this.sharedWith.length;
    this.sharedWith.forEach(s => {
      s.amount = perPerson;
    });
  }
  
  next();
});

// Pre-save hook: Validate family membership
expenseSchema.pre('save', async function(next) {
  if (this.type === 'family' && this.familyId) {
    try {
      const Family = mongoose.model('Family');
      const family = await Family.findOne({ familyId: this.familyId });
      
      if (!family) {
        return next(new Error('Family not found'));
      }
      
      const isMember = family.members.some(m => 
        m.userId === this.userId && m.isActive
      );
      
      if (!isMember) {
        return next(new Error('User is not a member of this family'));
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Instance method: Approve expense
expenseSchema.methods.approve = function(approverUserId) {
  this.approvalStatus = 'approved';
  this.approvedBy = approverUserId;
  this.approvedAt = new Date();
  return this.save();
};

// Instance method: Reject expense
expenseSchema.methods.reject = function(approverUserId, reason) {
  this.approvalStatus = 'rejected';
  this.approvedBy = approverUserId;
  this.approvedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

// Instance method: Soft delete
expenseSchema.methods.softDelete = function(deletedByUserId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedByUserId;
  return this.save();
};

// Instance method: Mark split as paid
expenseSchema.methods.markSplitPaid = function(userId) {
  const split = this.sharedWith.find(s => s.userId === userId);
  if (split) {
    split.isPaid = true;
    return this.save();
  }
  throw new Error('Split not found for user');
};

// Static method: Find by date range
expenseSchema.statics.findByDateRange = function(startDate, endDate, filters = {}) {
  return this.find({
    date: { $gte: startDate, $lte: endDate },
    isDeleted: false,
    ...filters
  }).sort({ date: -1 });
};

// Static method: Aggregate by category
expenseSchema.statics.aggregateByCategory = function(familyId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        familyId,
        date: { $gte: startDate, $lte: endDate },
        approvalStatus: 'approved',
        isDeleted: false
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

// Post-save hook: Update family budget
expenseSchema.post('save', async function(doc) {
  if (doc.type === 'family' && doc.familyId && doc.approvalStatus === 'approved') {
    try {
      const Family = mongoose.model('Family');
      await Family.findOneAndUpdate(
        {
          familyId: doc.familyId,
          'sharedBudgets.category': doc.category,
          'sharedBudgets.isActive': true
        },
        {
          $inc: { 'sharedBudgets.$.spent': doc.amount }
        }
      );
    } catch (error) {
      console.error('Budget update failed:', error);
    }
  }
});

// Post-save hook: Audit logging
expenseSchema.post('save', async function(doc) {
  try {
    const AuditLog = mongoose.model('AuditLog');
    await AuditLog.create({
      auditId: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityType: 'Expense',
      entityId: doc.expenseId,
      action: this.isNew ? 'CREATE' : 'UPDATE',
      userId: doc.userId,
      familyId: doc.familyId,
      changes: doc.toObject(),
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Audit log creation failed:', error);
  }
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
