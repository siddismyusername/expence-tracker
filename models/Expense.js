const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    amountUSD: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    description: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Family',
        default: null
    },
    isCommon: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
