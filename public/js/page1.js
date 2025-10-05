import { CATEGORIES, isFutureDate, generateId, apiCreate, getPreferredCurrency, currencyToUsd, updateNotificationDot } from './shared.js';

const amountEl = document.getElementById('amount');
const categoryEl = document.getElementById('category');
const dateEl = document.getElementById('date');
const descEl = document.getElementById('description');
const form = document.getElementById('expense-form');

const amountError = document.getElementById('amountError');
const categoryError = document.getElementById('categoryError');
const dateError = document.getElementById('dateError');

dateEl.max = new Date().toISOString().slice(0,10);

function validate(){
	let valid = true;
	amountError.textContent = '';
	categoryError.textContent = '';
	dateError.textContent = '';

	const amount = parseFloat(amountEl.value);
	if(!(amount > 0)){
		amountError.textContent = 'Amount must be a positive number';
		valid = false;
	}
	if(!CATEGORIES.includes(categoryEl.value)){
		categoryError.textContent = 'Select a category';
		valid = false;
	}
	if(!dateEl.value){
		dateError.textContent = 'Date is required';
		valid = false;
	} else if(isFutureDate(dateEl.value)){
		dateError.textContent = 'Date cannot be in the future';
		valid = false;
	}
	return valid;
}

form.addEventListener('submit', async (e)=>{
	e.preventDefault();
	if(!validate()) return;
    const entered = Number(amountEl.value);
    const currency = getPreferredCurrency();
    const amountUsd = currencyToUsd(entered, currency);
    const expense = {
		expenseId: generateId(),
        amount: amountUsd,
		category: categoryEl.value,
		date: dateEl.value,
		description: descEl.value.trim()
	};
	await apiCreate(expense);
	form.reset();
	updateNotificationDot();
});


