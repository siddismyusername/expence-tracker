const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const ExpenseController = require('../controllers/ExpenseController');

// @route   POST api/expenses
// @desc    Add new expense
// @access  Private
router.post('/', auth, (req, res) => ExpenseController.createExpense(req, res));

// @route   GET api/expenses
// @desc    Get all expenses (Personal + Family) - All expenses if user has family
// @access  Private
router.get('/', auth, (req, res) => ExpenseController.getExpenses(req, res));

// @route   GET api/expenses/stats
// @desc    Get expense statistics
// @access  Private
router.get('/stats', auth, (req, res) => ExpenseController.getStatistics(req, res));

// @route   GET api/expenses/:id
// @desc    Get expense by ID
// @access  Private
router.get('/:id', auth, (req, res) => ExpenseController.getExpenseById(req, res));

// @route   PUT api/expenses/:id
// @desc    Update expense
// @access  Private
router.put('/:id', auth, (req, res) => ExpenseController.updateExpense(req, res));

// @route   DELETE api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', auth, (req, res) => ExpenseController.deleteExpense(req, res));

module.exports = router;
