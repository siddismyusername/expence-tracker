const mongoose = require('mongoose');

// Recurring Expense Schema for managing recurring expenses
const recurringExpenseSchema = new mongoose.Schema({
  recurringId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    ref: 'User',
    required: true,
    index: true
  },
  familyId: {
    type: String,
    ref: 'Family',
    default: null,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  category: {
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
    default: 'personal'
  },
  pattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true,
    index: true
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    default: null
  },
  nextOccurrence: {
    type: Date,
    required: true,
    index: true
  },
  lastProcessed: {
    type: Date,
    default: null
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6,
    default: null
  },
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31,
    default: null
  },
  monthOfYear: {
    type: Number,
    min: 1,
    max: 12,
    default: null
  },
  paidBy: {
    type: String,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    userId: {
      type: String,
      ref: 'User'
    },
    amount: Number
  }],
  splitType: {
    type: String,
    enum: ['equal', 'custom', 'full'],
    default: 'full'
  },
  autoApprove: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  occurrenceCount: {
    type: Number,
    default: 0
  },
  maxOccurrences: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes
recurringExpenseSchema.index({ familyId: 1, isActive: 1, nextOccurrence: 1 });
recurringExpenseSchema.index({ userId: 1, isActive: 1, nextOccurrence: 1 });
recurringExpenseSchema.index({ nextOccurrence: 1, isActive: 1 });

// Instance method: Calculate next occurrence
recurringExpenseSchema.methods.calculateNextOccurrence = function() {
  const current = this.nextOccurrence || this.startDate;
  let next = new Date(current);
  
  switch(this.pattern) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  
  return next;
};

// Instance method: Create expense instance
recurringExpenseSchema.methods.createExpenseInstance = async function() {
  const Expense = mongoose.model('Expense');
  
  const expenseData = {
    expenseId: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: this.userId,
    familyId: this.familyId,
    paidBy: this.paidBy,
    amount: this.amount,
    category: this.category,
    description: this.description,
    type: this.type,
    date: new Date().toISOString().split('T')[0],
    recurring: true,
    recurrencePattern: this.pattern,
    recurringExpenseId: this.recurringId,
    sharedWith: this.sharedWith,
    splitType: this.splitType,
    approvalStatus: this.autoApprove ? 'approved' : 'pending',
    nextOccurrence: this.calculateNextOccurrence()
  };
  
  const expense = await Expense.create(expenseData);
  
  // Update recurring expense
  this.lastProcessed = new Date();
  this.occurrenceCount += 1;
  this.nextOccurrence = this.calculateNextOccurrence();
  
  // Check if should deactivate
  if (this.maxOccurrences && this.occurrenceCount >= this.maxOccurrences) {
    this.isActive = false;
  }
  if (this.endDate && this.nextOccurrence > this.endDate) {
    this.isActive = false;
  }
  
  await this.save();
  return expense;
};

// Static method: Find due recurring expenses
recurringExpenseSchema.statics.findDue = function() {
  return this.find({
    isActive: true,
    nextOccurrence: { $lte: new Date() }
  });
};

// Static method: Process all due recurring expenses
recurringExpenseSchema.statics.processDue = async function() {
  const dueExpenses = await this.findDue();
  const results = [];
  
  for (const recurring of dueExpenses) {
    try {
      const expense = await recurring.createExpenseInstance();
      results.push({ success: true, recurringId: recurring.recurringId, expenseId: expense.expenseId });
    } catch (error) {
      results.push({ success: false, recurringId: recurring.recurringId, error: error.message });
    }
  }
  
  return results;
};

const RecurringExpense = mongoose.model('RecurringExpense', recurringExpenseSchema);

module.exports = RecurringExpense;
