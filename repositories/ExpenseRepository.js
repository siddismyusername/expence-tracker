/**
 * Expense Repository
 * Centralized database operations for Expense model
 * All database queries for expenses are handled here
 */

const Expense = require('../models/Expense');

class ExpenseRepository {
    /**
     * Create a new expense
     * @param {Object} expenseData - Expense data
     * @returns {Promise<Object>} Created expense
     */
    async create(expenseData) {
        try {
            const expense = new Expense(expenseData);
            return await expense.save();
        } catch (error) {
            console.error('ExpenseRepository.create Error:', error.message);
            throw error;
        }
    }

    /**
     * Find expense by ID
     * @param {String} expenseId - Expense ID
     * @param {Boolean} populate - Whether to populate user data
     * @returns {Promise<Object>} Expense object
     */
    async findById(expenseId, populate = false) {
        try {
            const query = Expense.findById(expenseId);
            if (populate) {
                query.populate('userId', 'name email');
            }
            return await query;
        } catch (error) {
            console.error('ExpenseRepository.findById Error:', error.message);
            throw error;
        }
    }

    /**
     * Find all expenses with filters
     * @param {Object} filters - Query filters
     * @param {Boolean} populate - Whether to populate user data
     * @returns {Promise<Array>} Array of expenses
     */
    async findAll(filters = {}, populate = true) {
        try {
            const query = Expense.find(filters).sort({ date: -1 });
            if (populate) {
                query.populate('userId', 'name email');
            }
            return await query;
        } catch (error) {
            console.error('ExpenseRepository.findAll Error:', error.message);
            throw error;
        }
    }

    /**
     * Find expenses by user ID
     * @param {String} userId - User ID
     * @param {Boolean} populate - Whether to populate user data
     * @returns {Promise<Array>} Array of expenses
     */
    async findByUserId(userId, populate = true) {
        try {
            return await this.findAll({ userId }, populate);
        } catch (error) {
            console.error('ExpenseRepository.findByUserId Error:', error.message);
            throw error;
        }
    }

    /**
     * Find expenses by family ID
     * @param {String} familyId - Family ID
     * @param {Boolean} populate - Whether to populate user data
     * @returns {Promise<Array>} Array of expenses
     */
    async findByFamilyId(familyId, populate = true) {
        try {
            return await this.findAll({ familyId }, populate);
        } catch (error) {
            console.error('ExpenseRepository.findByFamilyId Error:', error.message);
            throw error;
        }
    }

    /**
     * Find expenses with date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {Object} additionalFilters - Additional query filters
     * @returns {Promise<Array>} Array of expenses
     */
    async findByDateRange(startDate, endDate, additionalFilters = {}) {
        try {
            const filters = {
                ...additionalFilters,
                date: { $gte: startDate, $lte: endDate }
            };
            return await this.findAll(filters);
        } catch (error) {
            console.error('ExpenseRepository.findByDateRange Error:', error.message);
            throw error;
        }
    }

    /**
     * Find expenses by category
     * @param {String} category - Category name
     * @param {Object} additionalFilters - Additional query filters
     * @returns {Promise<Array>} Array of expenses
     */
    async findByCategory(category, additionalFilters = {}) {
        try {
            const filters = { ...additionalFilters, category };
            return await this.findAll(filters);
        } catch (error) {
            console.error('ExpenseRepository.findByCategory Error:', error.message);
            throw error;
        }
    }

    /**
     * Update expense by ID
     * @param {String} expenseId - Expense ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated expense
     */
    async update(expenseId, updateData) {
        try {
            return await Expense.findByIdAndUpdate(
                expenseId,
                { $set: updateData },
                { new: true, runValidators: true }
            );
        } catch (error) {
            console.error('ExpenseRepository.update Error:', error.message);
            throw error;
        }
    }

    /**
     * Delete expense by ID
     * @param {String} expenseId - Expense ID
     * @returns {Promise<Object>} Delete result
     */
    async delete(expenseId) {
        try {
            return await Expense.deleteOne({ _id: expenseId });
        } catch (error) {
            console.error('ExpenseRepository.delete Error:', error.message);
            throw error;
        }
    }

    /**
     * Get total expense count
     * @param {Object} filters - Query filters
     * @returns {Promise<Number>} Total expenses
     */
    async count(filters = {}) {
        try {
            return await Expense.countDocuments(filters);
        } catch (error) {
            console.error('ExpenseRepository.count Error:', error.message);
            throw error;
        }
    }

    /**
     * Get total amount sum
     * @param {Object} filters - Query filters
     * @returns {Promise<Number>} Total amount
     */
    async getTotalAmount(filters = {}) {
        try {
            const result = await Expense.aggregate([
                { $match: filters },
                { $group: { _id: null, total: { $sum: '$amountUSD' } } }
            ]);
            return result.length > 0 ? result[0].total : 0;
        } catch (error) {
            console.error('ExpenseRepository.getTotalAmount Error:', error.message);
            throw error;
        }
    }

    /**
     * Get expenses grouped by category
     * @param {Object} filters - Query filters
     * @returns {Promise<Array>} Category-wise totals
     */
    async getByCategory(filters = {}) {
        try {
            return await Expense.aggregate([
                { $match: filters },
                { 
                    $group: { 
                        _id: '$category', 
                        total: { $sum: '$amountUSD' },
                        count: { $sum: 1 }
                    } 
                },
                { $sort: { total: -1 } }
            ]);
        } catch (error) {
            console.error('ExpenseRepository.getByCategory Error:', error.message);
            throw error;
        }
    }

    /**
     * Get expenses grouped by user
     * @param {Object} filters - Query filters
     * @returns {Promise<Array>} User-wise totals
     */
    async getByUser(filters = {}) {
        try {
            return await Expense.aggregate([
                { $match: filters },
                { 
                    $group: { 
                        _id: '$userId', 
                        total: { $sum: '$amountUSD' },
                        count: { $sum: 1 }
                    } 
                },
                { $sort: { total: -1 } }
            ]);
        } catch (error) {
            console.error('ExpenseRepository.getByUser Error:', error.message);
            throw error;
        }
    }
}

module.exports = new ExpenseRepository();
