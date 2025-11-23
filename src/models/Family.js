const mongoose = require('mongoose');

// Family Schema with embedded members and shared budgets
const familySchema = new mongoose.Schema({
  familyId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  adminUserId: {
    type: String,
    ref: 'User',
    required: true,
    index: true
  },
  members: [{
    userId: {
      type: String,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'parent', 'child'],
      required: true
    },
    email: {
      type: String,
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    allowance: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  sharedBudgets: [{
    budgetId: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    limit: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function(v) {
          return v >= 0;
        },
        message: 'Budget limit must be non-negative'
      }
    },
    spent: {
      type: Number,
      default: 0,
      min: 0
    },
    period: {
      type: String,
      enum: ['weekly', 'monthly'],
      default: 'monthly'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    lastReset: {
      type: Date,
      default: Date.now
    },
    alertThreshold: {
      type: Number,
      default: 80,
      min: 0,
      max: 100
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  invitations: [{
    inviteId: {
      type: String,
      required: true,
      unique: true,
      sparse: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    role: {
      type: String,
      enum: ['admin', 'parent', 'child'],
      required: true
    },
    token: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'cancelled'],
      default: 'pending'
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    currency: {
      type: String,
      default: 'USD'
    },
    approvalRequired: {
      type: Boolean,
      default: false
    },
    approvalThreshold: {
      type: Number,
      default: 100,
      min: 0
    },
    allowChildExpenses: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
  // versionKey defaults to '__v' for optimistic locking
});

// Compound Indexes
familySchema.index({ adminUserId: 1, isActive: 1 });
familySchema.index({ 'members.userId': 1 });
familySchema.index({ 'members.email': 1 });
familySchema.index({ 'invitations.email': 1, 'invitations.status': 1 });
familySchema.index({ 'invitations.token': 1 });
// Note: invitations.expiresAt already has index: true in field definition
// TTL index for expired invitations is defined at field level

// Virtual for member count
familySchema.virtual('memberCount').get(function() {
  return this.members.filter(m => m.isActive).length;
});

// Virtual for total budget
familySchema.virtual('totalBudget').get(function() {
  return this.sharedBudgets.reduce((sum, budget) => sum + budget.limit, 0);
});

// Virtual for total spent
familySchema.virtual('totalSpent').get(function() {
  return this.sharedBudgets.reduce((sum, budget) => sum + budget.spent, 0);
});

// Pre-save validation: Ensure admin is in members
familySchema.pre('save', function(next) {
  if (this.isNew) {
    const adminMember = this.members.find(m => m.userId === this.adminUserId);
    if (!adminMember) {
      next(new Error('Admin user must be included in members array'));
    }
  }
  next();
});

// Instance method: Add member
familySchema.methods.addMember = function(memberData) {
  const exists = this.members.find(m => m.userId === memberData.userId);
  if (exists) {
    throw new Error('Member already exists in family');
  }
  this.members.push({
    ...memberData,
    joinedAt: new Date(),
    isActive: true
  });
  return this.save();
};

// Instance method: Remove member
familySchema.methods.removeMember = function(userId) {
  const member = this.members.find(m => m.userId === userId);
  if (!member) {
    throw new Error('Member not found');
  }
  if (userId === this.adminUserId) {
    throw new Error('Cannot remove admin from family');
  }
  member.isActive = false;
  return this.save();
};

// Instance method: Update budget spent amount
familySchema.methods.updateBudgetSpent = function(category, amount) {
  const budget = this.sharedBudgets.find(b => b.category === category && b.isActive);
  if (budget) {
    budget.spent += amount;
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method: Check if budget exceeded
familySchema.methods.isBudgetExceeded = function(category, additionalAmount = 0) {
  const budget = this.sharedBudgets.find(b => b.category === category && b.isActive);
  if (!budget) return false;
  return (budget.spent + additionalAmount) > budget.limit;
};

// Instance method: Check if budget alert threshold reached
familySchema.methods.shouldAlertBudget = function(category) {
  const budget = this.sharedBudgets.find(b => b.category === category && b.isActive);
  if (!budget) return false;
  const percentUsed = (budget.spent / budget.limit) * 100;
  return percentUsed >= budget.alertThreshold;
};

// Static method: Find by member
familySchema.statics.findByMember = function(userId) {
  return this.findOne({ 
    'members.userId': userId, 
    'members.isActive': true,
    isActive: true 
  });
};

// Post-save hook: Audit logging
familySchema.post('save', async function(doc) {
  try {
    const AuditLog = mongoose.model('AuditLog');
    await AuditLog.create({
      auditId: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityType: 'Family',
      entityId: doc.familyId,
      action: this.isNew ? 'CREATE' : 'UPDATE',
      userId: doc.adminUserId,
      changes: doc.toObject(),
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Audit log creation failed:', error);
  }
});

const Family = mongoose.model('Family', familySchema);

module.exports = Family;
