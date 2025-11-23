// Utility functions (Formatting, Dates, etc.)
import { getUserData, setUserData } from './state.js';
import { apiRequest, isAuthenticated } from './api.js';

const CATEGORIES = [
  'Food', 'Transport', 'Entertainment', 'Bills', 'Shopping',
  'Healthcare', 'Education', 'Kids Activities', 'Household',
  'Utilities', 'Insurance', 'Savings', 'Other'
];

const CURRENCY_KEY = 'currency';
const SUPPORTED_CURRENCIES = ['USD','INR'];
const DEFAULT_CURRENCY = 'USD';
const ESTIMATED_RATES = { USD: 1, INR: 83, EUR: 0.92, GBP: 0.79, JPY: 150 };

function generateId(){
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isFutureDate(iso){
    return new Date(iso) > new Date();
}

function getPreferredCurrency(){
    // Try to get from user data first, then local storage, then default
    const userData = getUserData();
    if (userData && userData.currency) return userData.currency;
    
    const stored = localStorage.getItem(CURRENCY_KEY);
    return SUPPORTED_CURRENCIES.includes(stored) ? stored : DEFAULT_CURRENCY;
}

async function setPreferredCurrency(code){
    const value = SUPPORTED_CURRENCIES.includes(code) ? code : DEFAULT_CURRENCY;
    localStorage.setItem(CURRENCY_KEY, value);
    
    // Sync with server if authenticated
    if (isAuthenticated()) {
        try {
            await apiRequest('/api/auth/settings', {
                method: 'PATCH',
                body: JSON.stringify({ currency: value })
            });
            
            // Update local user data cache
            const userData = getUserData();
            if (userData) {
                userData.currency = value;
                setUserData(userData);
            }
        } catch (e) {
            console.error('Failed to sync currency preference', e);
        }
    }
}

function getCurrencySymbol(code){
    const map = { USD: '$', INR: '₹' };
    return map[code || getPreferredCurrency()] || '$';
}

function getCurrencyFormatter(code){
    const currency = code || getPreferredCurrency();
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency });
}

function formatCurrency(amount, code){
    const formatter = getCurrencyFormatter(code);
    const num = Number(amount || 0);
    return formatter.format(isFinite(num) ? num : 0);
}

function usdToCurrency(amountUsd, code){
    const currency = code || getPreferredCurrency();
    const rate = ESTIMATED_RATES[currency] || 1;
    const num = Number(amountUsd || 0);
    return isFinite(num) ? num * rate : 0;
}

function currencyToUsd(amountInCurrency, code){
    const currency = code || getPreferredCurrency();
    const rate = ESTIMATED_RATES[currency] || 1;
    const num = Number(amountInCurrency || 0);
    return isFinite(num) && rate ? num / rate : 0;
}

function formatFromUSD(amountUsd, code){
    return formatCurrency(usdToCurrency(amountUsd, code), code);
}

export { 
    CATEGORIES, generateId, isFutureDate, 
    getPreferredCurrency, setPreferredCurrency, getCurrencySymbol, 
    formatCurrency, usdToCurrency, currencyToUsd, formatFromUSD 
};
