import { apiRequest, getViewMode, getUserData, isAuthenticated, formatFromUSD, CATEGORIES } from './shared.js';
import './navbar.js';

// Check authentication
if (!isAuthenticated()) {
  window.location.href = '/pages/login.html';
}

const tableBody = document.getElementById('expenseBody');
const categoryEl = document.getElementById('category');
const fromEl = document.getElementById('from-date');
const toEl = document.getElementById('to-date');
const clearBtn = document.getElementById('clear-filters');

const max = new Date().toISOString().slice(0,10);
if(fromEl) fromEl.max = max;
if(toEl) toEl.max = max;

// Populate category dropdown from CATEGORIES
if(categoryEl) {
    categoryEl.innerHTML = '<option value="">All Categories</option>' + 
    CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function getFilters(){
  const filters = {};
  if (categoryEl && categoryEl.value) filters.category = categoryEl.value;
  if (fromEl && fromEl.value) filters.startDate = fromEl.value;
  if (toEl && toEl.value) filters.endDate = toEl.value;
  
  const viewMode = getViewMode();
  if (viewMode === 'family') {
    const user = getUserData();
    if (user && user.familyId) {
      filters.familyId = user.familyId;
    }
  } else {
    filters.type = 'personal';
  }
  
  return filters;
}

async function render(){
  if(!tableBody) return;
  try {
    const filters = getFilters();
    const response = await apiRequest('/api/expenses', { 
      method: 'GET',
      params: filters
    });
    
    let items = response.data || [];
    items.sort((a,b)=> new Date(b.date) - new Date(a.date));

    tableBody.innerHTML = '';
    for(const exp of items){
      const tr = document.createElement('tr');
      const typeLabel = exp.type === 'family' ? '👨‍👩‍👧‍👦' : '👤';
      const statusBadge = exp.status !== 'approved' ? 
        `<span class="text-xs px-2 py-1 rounded ${exp.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}">${exp.status}</span>` : '';
      
      tr.innerHTML = `
        <td class="px-4 py-3">${new Date(exp.date).toLocaleDateString()}</td>
        <td class="px-4 py-3">${typeLabel} ${exp.category}</td>
        <td class="px-4 py-3">${formatFromUSD(exp.amount)}</td>
        <td class="px-4 py-3">${exp.description || ''} ${statusBadge}</td>
        <td class="px-4 py-3 text-center">
          <button class="p-1 text-blue-500 rounded-full hover:bg-blue-500/10 mr-1" onclick="window.location.href='/pages/add-expense.html?edit=${exp.expenseId}'">
            <span class="material-symbols-outlined">edit</span>
          </button>
          <button class="p-1 text-red-500 rounded-full hover:bg-red-500/10" data-del="${exp.expenseId}">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </td>
      `;
      tableBody.appendChild(tr);
    }
    if(!items.length){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" class="text-center py-6 text-muted-foreground-light dark:text-muted-foreground-dark">No expenses found.</td>`;
      tableBody.appendChild(tr);
    }
  } catch (error) {
    console.error('Error loading expenses:', error);
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-red-500">Error loading expenses: ${error.message}</td></tr>`;
  }
}

if(tableBody) {
    tableBody.addEventListener('click', async (e)=>{
    const btn = e.target.closest('button');
    if(!btn || !btn.dataset.del) return;
    
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
        await apiRequest(`/api/expenses/${btn.dataset.del}`, { method: 'DELETE' });
        render();
    } catch (error) {
        alert('Failed to delete expense: ' + error.message);
    }
    });
}

if(categoryEl) categoryEl.addEventListener('change', render);
if(fromEl) fromEl.addEventListener('change', render);
if(toEl) toEl.addEventListener('change', render);

if(clearBtn) {
    clearBtn.addEventListener('click', ()=>{
    categoryEl.value = '';
    fromEl.value = '';
    toEl.value = '';
    render();
    });
}

// Initial render
if(tableBody) render();
