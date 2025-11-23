import { 
    CATEGORIES, isFutureDate, generateId, getPreferredCurrency, currencyToUsd, usdToCurrency,
    updateNotificationDot, apiRequest, getViewMode, getUserData, isAuthenticated, 
    getCurrencySymbol, applyProfileImageToDom 
} from './shared.js';
import './navbar.js';

// Check authentication
if (!isAuthenticated()) {
	window.location.href = '/pages/login.html';
}

// Initialize UI elements
const prefix = document.getElementById('currencyPrefix');
if(prefix){ prefix.textContent = getCurrencySymbol(); }
updateNotificationDot();
applyProfileImageToDom();

const amountEl = document.getElementById('amount');
const categoryEl = document.getElementById('category');
const dateEl = document.getElementById('date');
const descEl = document.getElementById('description');
const form = document.getElementById('expense-form');

const amountError = document.getElementById('amountError');
const categoryError = document.getElementById('categoryError');
const dateError = document.getElementById('dateError');

// Populate Categories
if (categoryEl) {
    // Keep the first option (placeholder)
    const placeholder = categoryEl.firstElementChild;
    categoryEl.innerHTML = '';
    categoryEl.appendChild(placeholder);
    
    CATEGORIES.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryEl.appendChild(option);
    });
}

// Family Options Logic
const familyOptions = document.getElementById('familyOptions');
const splitTypeEl = document.getElementById('splitType');
const recurringEl = document.getElementById('recurring');
const sharedWithContainer = document.getElementById('sharedWithContainer');

async function loadFamilyMembers() {
    const userData = getUserData();
    if (!userData || !userData.familyId) return;
    
    try {
        const resp = await apiRequest(`/api/family/${userData.familyId}/members`);
        if (resp.success) {
            const members = resp.data.members.filter(m => m.userId !== userData.userId); // Exclude self
            
            if (members.length === 0) {
                sharedWithContainer.innerHTML = '<p class="text-sm text-gray-500">No other members in family.</p>';
                return;
            }
            
            sharedWithContainer.innerHTML = members.map(m => `
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" value="${m.userId}" class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary">
                    <span class="text-sm text-gray-700 dark:text-gray-300">${m.name}</span>
                </label>
            `).join('');
        }
    } catch (e) {
        console.error('Failed to load members', e);
        sharedWithContainer.innerHTML = '<p class="text-sm text-red-500">Failed to load members.</p>';
    }
}

function toggleFamilyOptions() {
    const mode = getViewMode();
    if (mode === 'family') {
        familyOptions.classList.remove('hidden');
        // Load members if not loaded (simple check)
        if (sharedWithContainer.innerText.includes('Loading')) {
            loadFamilyMembers();
        }
    } else {
        familyOptions.classList.add('hidden');
    }
}

// Initial check
toggleFamilyOptions();

// Listen for changes
window.addEventListener('viewModeChanged', toggleFamilyOptions);

// Future date restriction removed
// dateEl.max = new Date().toISOString().slice(0,10);

// Edit Mode Logic
const urlParams = new URLSearchParams(window.location.search);
const editId = urlParams.get('edit');

if (editId) {
    const h2 = document.querySelector('h2');
    if(h2) h2.textContent = 'Edit Expense';
    const p = document.querySelector('p.text-muted-foreground-light');
    if(p) p.textContent = 'Update expense details.';
    const submitBtn = form.querySelector('button[type="submit"]');
    if(submitBtn) submitBtn.textContent = 'Update Expense';

    // Load data
    (async () => {
        try {
            const response = await apiRequest(`/api/expenses/${editId}`);
            if (response.success && response.data) {
                const expense = response.data;
                const currency = getPreferredCurrency();
                const displayAmount = usdToCurrency(expense.amount, currency);
                
                amountEl.value = displayAmount.toFixed(2);
                categoryEl.value = expense.category;
                dateEl.value = expense.date.split('T')[0];
                descEl.value = expense.description || '';
                
                if (expense.type === 'family') {
                    // Ensure family options are visible
                    familyOptions.classList.remove('hidden');
                    
                    if (expense.splitType) splitTypeEl.value = expense.splitType;
                    if (expense.recurring) recurringEl.checked = true;
                    
                    // Populate sharedWith
                    if (expense.sharedWith && Array.isArray(expense.sharedWith)) {
                        // We need to wait for members to load
                        await loadFamilyMembers();
                        expense.sharedWith.forEach(uid => {
                            const cb = sharedWithContainer.querySelector(`input[value="${uid}"]`);
                            if(cb) cb.checked = true;
                        });
                    }
                }
            } else {
                console.error('Expense not found');
                alert('Expense not found or permission denied.');
                window.location.href = '/pages/expenses.html';
            }
        } catch (error) {
            console.error('Error fetching expense:', error);
            alert('Error loading expense details.');
        }
    })();
}

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
	}
    // Future date check removed
	// else if(isFutureDate(dateEl.value)){
	// 	dateError.textContent = 'Date cannot be in the future';
	// 	valid = false;
	// }
	return valid;
}

form.addEventListener('submit', async (e)=>{
	e.preventDefault();
	if(!validate()) return;
	
	const submitBtn = form.querySelector('button[type="submit"]');
	const originalText = submitBtn.textContent;
	submitBtn.disabled = true;
	submitBtn.textContent = 'Saving...';
	
	try {
		const entered = Number(amountEl.value);
		const currency = getPreferredCurrency();
		const amountUsd = currencyToUsd(entered, currency);
		const viewMode = getViewMode();
		const userData = getUserData();
		
        let response;

        if (editId) {
            // Update existing
            const updateData = {
                amount: amountUsd,
                category: categoryEl.value,
                date: dateEl.value,
                description: descEl.value.trim()
            };
            
            response = await apiRequest(`/api/expenses/${editId}`, {
                method: 'PATCH',
                body: JSON.stringify(updateData)
            });
            
            if (response.success) {
                // Local cache update removed - relying on API
                
                alert('Expense updated successfully!');
                window.location.href = '/pages/expenses.html';
                return;
            }
        } else {
            // Create new
            const sharedWith = Array.from(sharedWithContainer.querySelectorAll('input:checked')).map(cb => cb.value);
            
            const expense = {
                expenseId: generateId(),
                amount: amountUsd,
                category: categoryEl.value,
                date: dateEl.value,
                description: descEl.value.trim(),
                type: viewMode, // 'personal' or 'family'
                familyId: viewMode === 'family' ? userData.familyId : null,
                splitType: viewMode === 'family' ? splitTypeEl.value : 'full',
                sharedWith: viewMode === 'family' ? sharedWith : [],
                recurring: viewMode === 'family' ? recurringEl.checked : false
            };
            
            response = await apiRequest('/api/expenses', {
                method: 'POST',
                body: JSON.stringify(expense)
            });
            
            if (response.success) {
                // Local cache update removed - relying on API

                form.reset();
                updateNotificationDot();
                
                // Show success message
                const successMsg = document.createElement('div');
                successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
                successMsg.textContent = `Expense added successfully! (${viewMode === 'family' ? 'Family' : 'Personal'})`;
                document.body.appendChild(successMsg);
                setTimeout(() => successMsg.remove(), 3000);
            }
        }
	} catch (error) {
		console.error('Error adding expense:', error);
		alert('Failed to add expense: ' + error.message);
	} finally {
		submitBtn.disabled = false;
		submitBtn.textContent = originalText;
	}
});


