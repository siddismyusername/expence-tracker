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

function convertCurrency(amountUSD, toCurrency) {
    return amountUSD * currencyRates[toCurrency];
}

async function loadExpenses() {
    const categoryFilter = document.getElementById('category').value;
    const fromDate = document.getElementById('from-date').value;
    const toDate = document.getElementById('to-date').value;

    const filters = {};
    if (categoryFilter) filters.category = categoryFilter;
    if (fromDate) filters.from = fromDate;
    if (toDate) filters.to = toDate;

    try {
        const expenses = await api.expenses.list(filters);
        const user = await api.auth.me();
        const userCurrency = user.preferences?.currency || 'USD';
        const currencySymbol = currencySymbols[userCurrency];
        
        const tbody = document.getElementById('expenseBody');
        tbody.innerHTML = '';

        if (expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-muted-foreground-light dark:text-muted-foreground-dark">No expenses found.</td></tr>';
            return;
        }

        expenses.forEach(exp => {
            const amountInUserCurrency = convertCurrency(exp.amountUSD || exp.amount, userCurrency);
            const userName = exp.userId?.name || 'Unknown';
            const isMyExpense = exp.userId?._id === user._id || exp.userId === user._id;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-4 py-3 text-sm text-app-foreground">${new Date(exp.date).toLocaleDateString()}</td>
                <td class="px-4 py-3 text-sm text-app-foreground">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${exp.isCommon ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}">
                        ${exp.category}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm font-bold text-app-foreground">${currencySymbol}${amountInUserCurrency.toFixed(2)}</td>
                <td class="px-4 py-3 text-sm text-app-foreground">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${isMyExpense ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}">
                        ${userName}${isMyExpense ? ' (You)' : ''}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm text-app-muted">${exp.description || '-'}</td>
                <td class="px-4 py-3 text-center">
                    ${isMyExpense ? `
                        <button class="text-red-500 hover:text-red-700 transition-colors" onclick="deleteExpense('${exp._id}')">
                            <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                    ` : '<span class="text-xs text-app-muted">-</span>'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error loading expenses:', err);
    }
}

// Delete Expense
window.deleteExpense = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
        const result = await api.expenses.delete(id);
        if (result.msg) {
            if (window.toast) {
                window.toast.success('Expense deleted successfully!', 'Deleted');
            }
            loadExpenses();
        }
    } catch (err) {
        console.error('Delete error:', err);
        if (window.toast) {
            window.toast.error('Failed to delete expense. You can only delete your own expenses.', 'Error');
        }
    }
};

// Filters
document.getElementById('category').addEventListener('change', loadExpenses);
document.getElementById('from-date').addEventListener('change', loadExpenses);
document.getElementById('to-date').addEventListener('change', loadExpenses);
document.getElementById('clear-filters').addEventListener('click', () => {
    document.getElementById('category').value = '';
    document.getElementById('from-date').value = '';
    document.getElementById('to-date').value = '';
    loadExpenses();
});

// Populate Categories (Mock)
const categories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'];
const categorySelect = document.getElementById('category');
categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
});

loadExpenses();
