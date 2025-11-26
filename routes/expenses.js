const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Expense = require('../models/Expense');
const User = require('../models/User');

// @route   POST api/expenses
// @desc    Add new expense
// @access  Private
router.post('/', auth, async (req, res) => {
    const { amount, category, date, description, isCommon } = req.body;

    try {
        const user = await User.findById(req.user.id);

        // Store amount in USD (amount is already in USD from frontend)
        const newExpense = new Expense({
            amount,
            amountUSD: amount,
            category,
            date,
            description,
            userId: req.user.id,
            isCommon: isCommon || false,
            familyId: user.familyId || null
        });

        const expense = await newExpense.save();
        res.json(expense);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET api/expenses
// @desc    Get all expenses (Personal + Family) - All expenses if user has family
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        let query;
        if (user.familyId) {
            // If user has family, get ALL expenses in the family (personal + common)
            query = { familyId: user.familyId };
        } else {
            // If no family, get only my personal expenses
            query = { userId: req.user.id };
        }

        // Filters
        if (req.query.category) {
            query.category = req.query.category;
        }
        if (req.query.from && req.query.to) {
            query.date = { $gte: new Date(req.query.from), $lte: new Date(req.query.to) };
        }

        const expenses = await Expense.find(query).populate('userId', 'name email').sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ msg: 'Expense not found' });
        }

        // Check user - only the creator can delete
        if (expense.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await Expense.deleteOne({ _id: req.params.id });

        res.json({ msg: 'Expense removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
