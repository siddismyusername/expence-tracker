import express from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/helpers.js';

const router = express.Router();

// Expense model colocated for simplicity; consider moving to src/models if it grows
const expenseSchema = new mongoose.Schema({
	expenseId: { type: String, required: true, unique: true },
	amount: { type: Number, required: true, min: 0.01 },
	category: { type: String, required: true, enum: ['Food','Transport','Entertainment','Bills','Shopping','Other'] },
	date: { type: String, required: true },
	description: { type: String }
},{ timestamps: true });

const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

router.get('/api/health', (_req, res) => {
	res.json({ status: 'ok' });
});

router.get('/api/expenses', asyncHandler(async (req, res) => {
	const { category, fromDate, toDate } = req.query;
	const query = {};
	if(category) query.category = category;
	if(fromDate || toDate){
		query.date = {};
		if(fromDate) query.date.$gte = fromDate;
		if(toDate) query.date.$lte = toDate;
	}
	const items = await Expense.find(query).sort({ date: -1 }).lean();
	res.json(items);
}));

router.post('/api/expenses', asyncHandler(async (req, res) => {
	const { expenseId, amount, category, date, description } = req.body;
	if(!(amount > 0)) return res.status(400).json({ error: 'Amount must be > 0' });
	const categories = ['Food','Transport','Entertainment','Bills','Shopping','Other'];
	if(!categories.includes(category)) return res.status(400).json({ error: 'Invalid category' });
	if(!date) return res.status(400).json({ error: 'Date required' });
	if(new Date(date) > new Date()) return res.status(400).json({ error: 'Future date not allowed' });
	const id = expenseId || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
	const created = await Expense.create({ expenseId: id, amount, category, date, description });
	res.status(201).json(created);
}));

router.delete('/api/expenses/:id', asyncHandler(async (req, res) => {
	const { id } = req.params;
	await Expense.deleteOne({ expenseId: id });
	res.json({ ok: true });
}));

export default router;


