const express = require('express');
const mongoose = require('mongoose');
const { asyncHandler } = require('../utils/helpers');
const { CATEGORIES } = require('../utils/constants');
const Expense = require('../models/Expense');
const Family = require('../models/Family');
const { authenticateJWT, optionalAuth } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

router.get('/health', (_req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/categories - List available categories
router.get('/categories', (_req, res) => {
	res.json({ success: true, data: CATEGORIES });
});

// GET /api/expenses - List expenses with filtering
router.get('/expenses', authenticateJWT, asyncHandler(async (req, res) => {
	const { category, fromDate, toDate, type, familyId } = req.query;
	const query = { isDeleted: false };
	
	// Filter by user
	// If familyId provided or type is family, filter by family
	if (familyId || type === 'family') {
		query.familyId = familyId || req.user.familyId;
		query.type = 'family';
	} else if (type === 'personal') {
		query.userId = req.user.userId;
		query.type = 'personal';
	} else {
		// Return both personal and family expenses
		query.$or = [
			{ userId: req.user.userId, type: 'personal' },
			{ familyId: req.user.familyId, type: 'family' }
		];
	}
	
	if (category) query.category = category;
	if (fromDate || toDate) {
		query.date = {};
		if (fromDate) query.date.$gte = fromDate;
		if (toDate) query.date.$lte = toDate;
	}
	
	const items = await Expense.find(query)
		.sort({ date: -1 })
		.lean();
	
	res.json({ success: true, data: items });
}));

// GET /api/expenses/:id - Get single expense
router.get('/expenses/:id', authenticateJWT, asyncHandler(async (req, res) => {
	const { id } = req.params;
	const expense = await Expense.findOne({ expenseId: id, isDeleted: false }).lean();
	
	if (!expense) {
		return res.status(404).json({ success: false, error: 'Expense not found' });
	}
	
	// Check permission
	if (expense.userId !== req.user.userId && expense.paidBy !== req.user.userId) {
		if (expense.type === 'family') {
			if (expense.familyId !== req.user.familyId) {
				return res.status(403).json({ success: false, error: 'Permission denied' });
			}
		} else {
			return res.status(403).json({ success: false, error: 'Permission denied' });
		}
	}
	
	res.json({ success: true, data: expense });
}));

// POST /api/expenses/batch - Batch create expenses (Import)
router.post('/expenses/batch', authenticateJWT, asyncHandler(async (req, res) => {
	const { items } = req.body;
	
	if (!Array.isArray(items) || items.length === 0) {
		return res.status(400).json({ success: false, error: 'No items provided' });
	}
	
	const session = await mongoose.startSession();
	session.startTransaction();
	
	try {
		const expensesToInsert = items.map(item => {
			// Default to personal unless explicitly family AND user is in a family
			const isFamily = item.type === 'family' && req.user.familyId;
			
			return {
				expenseId: item.expenseId || `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 5)}`,
				userId: req.user.userId,
				paidBy: req.user.userId,
				amount: Number(item.amount),
				category: CATEGORIES.includes(item.category) ? item.category : 'Other',
				date: item.date || new Date().toISOString().slice(0, 10),
				description: item.description || 'Imported Expense',
				type: isFamily ? 'family' : 'personal',
				familyId: isFamily ? req.user.familyId : null,
				splitType: 'full',
				approvalStatus: 'approved', // Auto-approve imports
				isDeleted: false,
				createdAt: new Date(),
				updatedAt: new Date()
			};
		});
		
		await Expense.insertMany(expensesToInsert, { session });
		
		await session.commitTransaction();
		
		res.status(201).json({ 
			success: true, 
			count: expensesToInsert.length,
			message: `Successfully imported ${expensesToInsert.length} expenses` 
		});
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		session.endSession();
	}
}));

// POST /api/expenses - Create new expense
router.post('/expenses', authenticateJWT, asyncHandler(async (req, res) => {
	const { 
		expenseId, 
		amount, 
		category, 
		date, 
		description, 
		type, 
		splitType, 
		sharedWith,
		recurring,
		recurrencePattern
	} = req.body;
	
	// Validation
	if (!(amount > 0)) {
		return res.status(400).json({ success: false, error: 'Amount must be > 0' });
	}
	
	if (!CATEGORIES.includes(category)) {
		return res.status(400).json({ success: false, error: 'Invalid category' });
	}
	
	if (!date) {
		return res.status(400).json({ success: false, error: 'Date required' });
	}
	
	// Future date check removed to allow planning
	// if (new Date(date) > new Date()) {
	// 	return res.status(400).json({ success: false, error: 'Future date not allowed' });
	// }
	
	const session = await mongoose.startSession();
	session.startTransaction();
	
	try {
		const id = expenseId || `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		
		// Determine if family expense
		const isFamily = type === 'family' && req.user.familyId;
		
		// Check if approval required
		let approvalStatus = 'approved';
		if (isFamily) {
			const family = await Family.findOne({ familyId: req.user.familyId });
			if (family && family.settings.approvalRequired && amount > family.settings.approvalThreshold) {
				approvalStatus = 'pending';
			}
		}
		
		const expenseData = {
			expenseId: id,
			userId: req.user.userId,
			paidBy: req.user.userId,
			amount,
			category,
			date,
			description,
			type: isFamily ? 'family' : 'personal',
			familyId: isFamily ? req.user.familyId : null,
			splitType: splitType || 'full',
			sharedWith: sharedWith || [],
			recurring: recurring || false,
			recurrencePattern: recurring ? recurrencePattern : null,
			approvalStatus
		};
		
		const expense = await Expense.create([expenseData], { session });
		
		// Send approval notification if pending
		if (approvalStatus === 'pending') {
			await notificationService.sendApprovalRequest(expense[0]);
		}
		
		// Check budget alerts
		if (isFamily) {
			const family = await Family.findOne({ familyId: req.user.familyId });
			if (family && family.shouldAlertBudget(category)) {
				const budget = family.sharedBudgets.find(b => b.category === category && b.isActive);
				if (budget) {
					await notificationService.sendBudgetAlert(req.user.familyId, category, budget);
				}
			}
		}
		
		await session.commitTransaction();
		
		res.status(201).json({ success: true, data: expense[0] });
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		session.endSession();
	}
}));

// DELETE /api/expenses/:id - Delete expense
router.delete('/expenses/:id', authenticateJWT, asyncHandler(async (req, res) => {
	const { id } = req.params;
	
	const expense = await Expense.findOne({ expenseId: id, isDeleted: false });
	
	if (!expense) {
		return res.status(404).json({ success: false, error: 'Expense not found' });
	}
	
	// Check permission
	if (expense.userId !== req.user.userId && expense.paidBy !== req.user.userId) {
		if (expense.type === 'family') {
			const family = await Family.findOne({ familyId: expense.familyId });
			if (!family || family.adminUserId !== req.user.userId) {
				return res.status(403).json({ success: false, error: 'Permission denied' });
			}
		} else {
			return res.status(403).json({ success: false, error: 'Permission denied' });
		}
	}
	
	// Soft delete
	await expense.softDelete(req.user.userId);
	
	res.json({ success: true, message: 'Expense deleted' });
}));

// PATCH /api/expenses/:id - Update expense
router.patch('/expenses/:id', authenticateJWT, asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { amount, category, date, description } = req.body;
	
	const expense = await Expense.findOne({ expenseId: id, isDeleted: false });
	
	if (!expense) {
		return res.status(404).json({ success: false, error: 'Expense not found' });
	}
	
	// Check permission
	if (expense.userId !== req.user.userId && expense.paidBy !== req.user.userId) {
		return res.status(403).json({ success: false, error: 'Permission denied' });
	}
	
	if (amount !== undefined) expense.amount = amount;
	if (category !== undefined) expense.category = category;
	if (date !== undefined) expense.date = date;
	if (description !== undefined) expense.description = description;
	
	await expense.save();
	
	res.json({ success: true, data: expense });
}));

module.exports = router;



