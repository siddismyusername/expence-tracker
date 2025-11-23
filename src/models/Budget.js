const mongoose = require('mongoose');

// Budget Schema for tracking individual and family budgets
const budgetSchema = new mongoose.Schema({
  budgetId: {
    type: String,
    required: true,
    unique: true,
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
  category: {
    type: String,
    required: true,
    index: true
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
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly',
    index: true
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true,
    index: true
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
  alertSent: {
    type: Boolean,
    default: false
  },
  rollover: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
  // versionKey defaults to '__v' for optimistic locking
});

// Compound indexes
budgetSchema.index({ familyId: 1, category: 1, period: 1 });
budgetSchema.index({ userId: 1, category: 1, period: 1 });
budgetSchema.index({ familyId: 1, isActive: 1, startDate: -1 });
budgetSchema.index({ userId: 1, isActive: 1, startDate: -1 });
// Note: endDate already has index: true in field definition

// Virtual for remaining amount
budgetSchema.virtual('remaining').get(function() {
  return Math.max(0, this.limit - this.spent);
});

// Virtual for percent used
budgetSchema.virtual('percentUsed').get(function() {
  return this.limit > 0 ? (this.spent / this.limit) * 100 : 0;
});

// Virtual for is exceeded
budgetSchema.virtual('isExceeded').get(function() {
  return this.spent > this.limit;
});

// Virtual for should alert
budgetSchema.virtual('shouldAlert').get(function() {
  const percent = this.percentUsed;
  return percent >= this.alertThreshold && !this.alertSent;
});

// Instance method: Add expense to budget
budgetSchema.methods.addExpense = function(amount) {
  this.spent += amount;
  
  // Check if alert threshold reached
  if (this.percentUsed >= this.alertThreshold) {
    this.alertSent = true;
  }
  
  return this.save();
};

// Instance method: Reset budget
budgetSchema.methods.reset = function() {
  if (this.rollover) {
    const rolloverAmount = this.remaining;
    this.limit += rolloverAmount;
  }
  this.spent = 0;
  this.lastReset = new Date();
  this.alertSent = false;
  
  // Update start and end dates based on period
  const now = new Date();
  this.startDate = now;
  
  switch(this.period) {
    case 'daily':
      this.endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      break;
    case 'weekly':
      this.endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      this.endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      break;
    case 'yearly':
      this.endDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      break;
  }
  
  return this.save();
};

// Static method: Find active budgets needing reset
budgetSchema.statics.findNeedingReset = function() {
  return this.find({
    isActive: true,
    endDate: { $lte: new Date() }
  });
};

// Static method: Aggregate budget utilization
budgetSchema.statics.aggregateUtilization = function(familyId) {
  return this.aggregate([
    {
      $match: {
        familyId,
        isActive: true
      }
    },
    {
      $project: {
        category: 1,
        limit: 1,
        spent: 1,
        remaining: { $subtract: ['$limit', '$spent'] },
        percentUsed: {
          $multiply: [
            { $divide: ['$spent', '$limit'] },
            100
          ]
        },
        isExceeded: { $gt: ['$spent', '$limit'] }
      }
    },
    {
      $sort: { percentUsed: -1 }
    }
  ]);
};

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
