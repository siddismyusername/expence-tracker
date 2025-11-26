import { api } from './api.js';

// Currency conversion rates (same as settings.js)
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

async function loadDashboard() {
    try {
        const expenses = await api.expenses.list();
        const user = await api.auth.me();
        const userCurrency = user.preferences?.currency || 'USD';
        const currencySymbol = currencySymbols[userCurrency];
        const budgetThreshold = user.preferences?.notificationThreshold || 0;

        // Calculate Totals
        let myTotal = 0;
        let familyTotal = 0;
        const familySpendingByUser = {};
        const familySpendingByCategory = {};
        const mySpendingByCategory = {};

        expenses.forEach(exp => {
            const amountInUserCurrency = convertCurrency(exp.amountUSD || exp.amount, userCurrency);
            
            // Family Total includes ALL expenses if user has family
            familyTotal += amountInUserCurrency;

            // Group by Category for family
            familySpendingByCategory[exp.category] = (familySpendingByCategory[exp.category] || 0) + amountInUserCurrency;

            // Group by User - use populated user name if available
            const userName = exp.userId?.name || 'Unknown';
            familySpendingByUser[userName] = (familySpendingByUser[userName] || 0) + amountInUserCurrency;

            // My personal spending - ONLY non-common expenses
            if ((exp.userId?._id === user._id || exp.userId === user._id) && !exp.isCommon) {
                myTotal += amountInUserCurrency;
                mySpendingByCategory[exp.category] = (mySpendingByCategory[exp.category] || 0) + amountInUserCurrency;
            }
        });

        // Check budget threshold and show notification
        if (budgetThreshold > 0 && myTotal > budgetThreshold) {
            if (window.toast) {
                window.toast.error(
                    `Your personal spending (${currencySymbol}${myTotal.toFixed(2)}) has exceeded your budget limit of ${currencySymbol}${budgetThreshold.toFixed(2)}!`,
                    'Budget Exceeded',
                    8000
                );
            }
        }

        // Update UI with currency symbol
        document.getElementById('myTotalSpent').textContent = `${currencySymbol}${myTotal.toFixed(2)}`;
        document.getElementById('familyTotalSpent').textContent = `${currencySymbol}${familyTotal.toFixed(2)}`;

        // Charts
        renderCharts(familySpendingByUser, familySpendingByCategory, mySpendingByCategory);

    } catch (err) {
        console.error('Error loading dashboard:', err);
    }
}

function renderCharts(userSpending, familyCategory, myCategory) {
    // User Distribution Pie
    new Chart(document.getElementById('userDistributionPie'), {
        type: 'pie',
        data: {
            labels: Object.keys(userSpending),
            datasets: [{
                data: Object.values(userSpending),
                backgroundColor: ['#137FEC', '#0EA5E9', '#22C55E', '#FACC15', '#EF4444']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Family Category Bar
    new Chart(document.getElementById('categoryChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(familyCategory),
            datasets: [{
                label: 'Amount',
                data: Object.values(familyCategory),
                backgroundColor: '#137FEC'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Personal Category Bar
    new Chart(document.getElementById('personalCategoryBar'), {
        type: 'bar',
        data: {
            labels: Object.keys(myCategory),
            datasets: [{
                label: 'Amount',
                data: Object.values(myCategory),
                backgroundColor: '#0EA5E9'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

loadDashboard();
