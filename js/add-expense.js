import { api } from './api.js';

// Currency conversion rates
const currencyRates = {
    'USD': 1,
    'EUR': 0.92,
    'GBP': 0.79,
    'INR': 83.12,
    'JPY': 149.50
};

const currencySymbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹',
    'JPY': '¥'
};

function convertToUSD(amount, fromCurrency) {
    return amount / currencyRates[fromCurrency];
}

// Load user preferences and set currency symbol
async function loadUserPreferences() {
    try {
        const user = await api.auth.me();
        const userCurrency = user.preferences?.currency || 'USD';
        const currencySymbol = currencySymbols[userCurrency];
        
        document.getElementById('currencyPrefix').textContent = currencySymbol;
        document.getElementById('amount').dataset.currency = userCurrency;
    } catch (err) {
        console.error('Error loading user preferences:', err);
    }
}

document.getElementById('expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const amountInput = document.getElementById('amount');
    const amount = parseFloat(amountInput.value);
    const userCurrency = amountInput.dataset.currency || 'USD';
    const amountUSD = convertToUSD(amount, userCurrency);
    
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;
    const isCommon = document.getElementById('isCommon').checked;

    try {
        await api.expenses.add({
            amount: amountUSD,
            category,
            date,
            description,
            isCommon
        });

        if (window.toast) {
            window.toast.success(
                `Expense of ${currencySymbols[userCurrency]}${amount.toFixed(2)} added successfully!`,
                'Expense Added'
            );
        }
        
        setTimeout(() => {
            window.location.href = '/expenses.html';
        }, 1000);
    } catch (err) {
        if (window.toast) {
            window.toast.error('Failed to add expense: ' + err.message, 'Error');
        }
    }
});

// Populate Categories
const categories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'];
const categorySelect = document.getElementById('category');
categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
});

// Set default date to today
document.getElementById('date').valueAsDate = new Date();

// Load user preferences on page load
loadUserPreferences();
