/**
 * Expense Service Layer
 * Business logic for expense operations
 */

const ExpenseRepository = require('../repositories/ExpenseRepository');
const UserRepository = require('../repositories/UserRepository');

class ExpenseService {
    // Currency conversion rates (USD as base)
    currencyRates = {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        INR: 83.12,
        JPY: 110.0
    };

    /**
     * Create a new expense
     * @param {String} userId - User ID
     * @param {Object} expenseData - Expense data
     * @returns {Promise<Object>} Created expense
     */
    async createExpense(userId, expenseData) {
        try {
            const user = await UserRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const { amount, currency, description, category, date, isCommon } = expenseData;

            // Convert amount to USD for storage
            const amountUSD = this.convertToUSD(amount, currency);

            const expense = await ExpenseRepository.create({
                userId,
                familyId: user.familyId || null,
                amount,
                amountUSD,
                currency: currency || 'USD',
                description,
                category: category || 'Other',
                date: date || new Date(),
                isCommon: isCommon || false
            });

            return await ExpenseRepository.findById(expense._id, true);
        } catch (error) {
            console.error('ExpenseService.createExpense Error:', error.message);
            throw error;
        }
    }

    /**
     * Get expenses for user
     * @param {String} userId - User ID
     * @returns {Promise<Array>} Array of expenses
     */
    async getUserExpenses(userId, options = {}) {
        try {
            const user = await UserRepository.findById(userId);
            if (!user) throw new Error('User not found');

            const { year, month } = options || {};
            const hasMonthFilter = Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12;

            if (hasMonthFilter) {
                const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
                const endDate = new Date(year, month, 0, 23, 59, 59, 999); // last day of month
                const baseFilter = user.familyId ? { familyId: user.familyId } : { userId };
                return await ExpenseRepository.findByDateRange(startDate, endDate, baseFilter);
            }

            if (user.familyId) return await ExpenseRepository.findByFamilyId(user.familyId);
            return await ExpenseRepository.findByUserId(userId);
        } catch (error) {
            console.error('ExpenseService.getUserExpenses Error:', error.message);
            throw error;
        }
    }

    /**
     * Get expense by ID
     * @param {String} expenseId - Expense ID
     * @returns {Promise<Object>} Expense object
     */
    async getExpenseById(expenseId) {
        try {
            const expense = await ExpenseRepository.findById(expenseId, true);
            if (!expense) {
                throw new Error('Expense not found');
            }
            return expense;
        } catch (error) {
            console.error('ExpenseService.getExpenseById Error:', error.message);
            throw error;
        }
    }

    /**
     * Update expense
     * @param {String} expenseId - Expense ID
     * @param {String} userId - User ID (for authorization)
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated expense
     */
    async updateExpense(expenseId, userId, updateData) {
        try {
            const expense = await ExpenseRepository.findById(expenseId);
            if (!expense) {
                throw new Error('Expense not found');
            }

            // Check authorization
            if (expense.userId.toString() !== userId) {
                throw new Error('Not authorized');
            }

            // Recalculate USD amount if amount or currency changed
            if (updateData.amount || updateData.currency) {
                const amount = updateData.amount || expense.amount;
                const currency = updateData.currency || expense.currency;
                updateData.amountUSD = this.convertToUSD(amount, currency);
            }

            return await ExpenseRepository.update(expenseId, updateData);
        } catch (error) {
            console.error('ExpenseService.updateExpense Error:', error.message);
            throw error;
        }
    }

    /**
     * Delete expense
     * @param {String} expenseId - Expense ID
     * @param {String} userId - User ID (for authorization)
     * @returns {Promise<Object>} Delete result
     */
    async deleteExpense(expenseId, userId) {
        try {
            const expense = await ExpenseRepository.findById(expenseId);
            if (!expense) {
                throw new Error('Expense not found');
            }

            // Check authorization
            if (expense.userId.toString() !== userId) {
                throw new Error('Not authorized');
            }

            return await ExpenseRepository.delete(expenseId);
        } catch (error) {
            console.error('ExpenseService.deleteExpense Error:', error.message);
            throw error;
        }
    }

    /**
     * Get expense statistics
     * @param {String} userId - User ID
     * @returns {Promise<Object>} Statistics object
     */
    async getStatistics(userId) {
        try {
            const user = await UserRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const filters = user.familyId 
                ? { familyId: user.familyId }
                : { userId };

            const [totalAmount, totalCount, byCategory, byUser] = await Promise.all([
                ExpenseRepository.getTotalAmount(filters),
                ExpenseRepository.count(filters),
                ExpenseRepository.getByCategory(filters),
                user.familyId ? ExpenseRepository.getByUser(filters) : Promise.resolve([])
            ]);

            return {
                totalAmount,
                totalCount,
                byCategory,
                byUser
            };
        } catch (error) {
            console.error('ExpenseService.getStatistics Error:', error.message);
            throw error;
        }
    }

    /**
     * Convert amount to USD
     * @param {Number} amount - Amount to convert
     * @param {String} currency - Source currency
     * @returns {Number} Amount in USD
     */
    convertToUSD(amount, currency) {
        const rate = this.currencyRates[currency] || 1;
        return amount / rate;
    }

    /**
     * Convert amount from USD
     * @param {Number} amountUSD - Amount in USD
     * @param {String} currency - Target currency
     * @returns {Number} Converted amount
     */
    convertFromUSD(amountUSD, currency) {
        const rate = this.currencyRates[currency] || 1;
        return amountUSD * rate;
    }
}

module.exports = new ExpenseService();
