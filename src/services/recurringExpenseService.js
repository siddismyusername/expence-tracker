const RecurringExpense = require('../models/RecurringExpense');
const Expense = require('../models/Expense');
const mongoose = require('mongoose');

// Recurring Expense Processing Service

class RecurringExpenseService {
  
  // Process all due recurring expenses
  async processDueExpenses() {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const dueExpenses = await RecurringExpense.find({
        isActive: true,
        nextOccurrence: { $lte: new Date() }
      }).session(session);
      
      const results = [];
      
      for (const recurring of dueExpenses) {
        try {
          const expense = await this.createExpenseFromRecurring(recurring, session);
          results.push({ 
            success: true, 
            recurringId: recurring.recurringId, 
            expenseId: expense.expenseId 
          });
        } catch (error) {
          results.push({ 
            success: false, 
            recurringId: recurring.recurringId, 
            error: error.message 
          });
        }
      }
      
      await session.commitTransaction();
      console.log(`Processed ${results.filter(r => r.success).length}/${results.length} recurring expenses`);
      
      return results;
    } catch (error) {
      await session.abortTransaction();
      console.error('Recurring expense processing error:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // Create expense from recurring template
  async createExpenseFromRecurring(recurring, session = null) {
    try {
      const expenseData = {
        expenseId: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: recurring.userId,
        familyId: recurring.familyId,
        paidBy: recurring.paidBy,
        amount: recurring.amount,
        category: recurring.category,
        description: recurring.description,
        type: recurring.type,
        date: new Date().toISOString().split('T')[0],
        recurring: true,
        recurrencePattern: recurring.pattern,
        recurringExpenseId: recurring.recurringId,
        sharedWith: recurring.sharedWith,
        splitType: recurring.splitType,
        approvalStatus: recurring.autoApprove ? 'approved' : 'pending',
        nextOccurrence: this.calculateNextOccurrence(recurring)
      };
      
      const expense = new Expense(expenseData);
      
      if (session) {
        await expense.save({ session });
      } else {
        await expense.save();
      }
      
      // Update recurring expense
      recurring.lastProcessed = new Date();
      recurring.occurrenceCount += 1;
      recurring.nextOccurrence = this.calculateNextOccurrence(recurring);
      
      // Check if should deactivate
      if (recurring.maxOccurrences && recurring.occurrenceCount >= recurring.maxOccurrences) {
        recurring.isActive = false;
      }
      if (recurring.endDate && recurring.nextOccurrence > recurring.endDate) {
        recurring.isActive = false;
      }
      
      if (session) {
        await recurring.save({ session });
      } else {
        await recurring.save();
      }
      
      return expense;
    } catch (error) {
      console.error('Create expense from recurring error:', error);
      throw error;
    }
  }
  
  // Calculate next occurrence date
  calculateNextOccurrence(recurring) {
    const current = recurring.nextOccurrence || recurring.startDate;
    const next = new Date(current);
    
    switch(recurring.pattern) {
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
  }
  
  // Preview upcoming recurring expenses
  async previewUpcoming(userId, days = 30) {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      
      const recurring = await RecurringExpense.find({
        userId,
        isActive: true,
        nextOccurrence: { $lte: endDate }
      }).sort({ nextOccurrence: 1 });
      
      const preview = recurring.map(r => ({
        recurringId: r.recurringId,
        amount: r.amount,
        category: r.category,
        description: r.description,
        pattern: r.pattern,
        nextOccurrence: r.nextOccurrence,
        daysUntil: Math.ceil((r.nextOccurrence - new Date()) / (1000 * 60 * 60 * 24))
      }));
      
      return preview;
    } catch (error) {
      console.error('Preview upcoming error:', error);
      throw error;
    }
  }
  
  // Get recurring expense statistics
  async getStatistics(userId) {
    try {
      const stats = await RecurringExpense.aggregate([
        {
          $match: {
            userId,
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            totalRecurring: { $sum: 1 },
            totalMonthlyAmount: {
              $sum: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$pattern', 'daily'] }, then: { $multiply: ['$amount', 30] } },
                    { case: { $eq: ['$pattern', 'weekly'] }, then: { $multiply: ['$amount', 4] } },
                    { case: { $eq: ['$pattern', 'monthly'] }, then: '$amount' },
                    { case: { $eq: ['$pattern', 'yearly'] }, then: { $divide: ['$amount', 12] } }
                  ],
                  default: 0
                }
              }
            },
            byCategory: {
              $push: {
                category: '$category',
                amount: '$amount',
                pattern: '$pattern'
              }
            }
          }
        }
      ]);
      
      return stats[0] || { totalRecurring: 0, totalMonthlyAmount: 0, byCategory: [] };
    } catch (error) {
      console.error('Recurring statistics error:', error);
      throw error;
    }
  }
}

module.exports = new RecurringExpenseService();
