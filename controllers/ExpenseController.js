/**
 * Expense Controller
 * Handles HTTP requests for expense endpoints
 */

const ExpenseService = require('../services/ExpenseService');

class ExpenseController {
    /**
     * Create a new expense
     * POST /api/expenses
     */
    async createExpense(req, res) {
        try {
            const expense = await ExpenseService.createExpense(req.user.id, req.body);
            res.json(expense);
        } catch (error) {
            console.error('ExpenseController.createExpense Error:', error.message);
            res.status(500).json({ msg: 'Server error' });
        }
    }

    /**
     * Get all expenses for current user
     * GET /api/expenses
     */
    async getExpenses(req, res) {
        try {
            const expenses = await ExpenseService.getUserExpenses(req.user.id);
            res.json(expenses);
        } catch (error) {
            console.error('ExpenseController.getExpenses Error:', error.message);
            res.status(500).json({ msg: 'Server error' });
        }
    }

    /**
     * Get expense by ID
     * GET /api/expenses/:id
     */
    async getExpenseById(req, res) {
        try {
            const expense = await ExpenseService.getExpenseById(req.params.id);
            res.json(expense);
        } catch (error) {
            console.error('ExpenseController.getExpenseById Error:', error.message);
            
            if (error.message === 'Expense not found') {
                return res.status(404).json({ msg: error.message });
            }
            
            res.status(500).json({ msg: 'Server error' });
        }
    }

    /**
     * Update expense
     * PUT /api/expenses/:id
     */
    async updateExpense(req, res) {
        try {
            const expense = await ExpenseService.updateExpense(
                req.params.id,
                req.user.id,
                req.body
            );
            res.json(expense);
        } catch (error) {
            console.error('ExpenseController.updateExpense Error:', error.message);
            
            if (error.message === 'Not authorized') {
                return res.status(403).json({ msg: error.message });
            }
            if (error.message === 'Expense not found') {
                return res.status(404).json({ msg: error.message });
            }
            
            res.status(500).json({ msg: 'Server error' });
        }
    }

    /**
     * Delete expense
     * DELETE /api/expenses/:id
     */
    async deleteExpense(req, res) {
        try {
            await ExpenseService.deleteExpense(req.params.id, req.user.id);
            res.json({ msg: 'Expense deleted successfully' });
        } catch (error) {
            console.error('ExpenseController.deleteExpense Error:', error.message);
            
            if (error.message === 'Not authorized') {
                return res.status(403).json({ msg: error.message });
            }
            if (error.message === 'Expense not found') {
                return res.status(404).json({ msg: error.message });
            }
            
            res.status(500).json({ msg: 'Server error' });
        }
    }

    /**
     * Get expense statistics
     * GET /api/expenses/stats
     */
    async getStatistics(req, res) {
        try {
            const stats = await ExpenseService.getStatistics(req.user.id);
            res.json(stats);
        } catch (error) {
            console.error('ExpenseController.getStatistics Error:', error.message);
            res.status(500).json({ msg: 'Server error' });
        }
    }
}

module.exports = new ExpenseController();
