import { apiRequest, getViewMode, getUserData, isAuthenticated, CATEGORIES, formatFromUSD } from './shared.js';
import '/js/navbar.js';

// Check authentication
if (!isAuthenticated()) {
  window.location.href = '/pages/login.html';
}

const totalSpentEl = document.getElementById('totalSpent');
const transactionCountEl = document.getElementById('transactionCount');

let chartInstance = null;
function updateChart(labels, data){
	const ctx = document.getElementById('categoryChart');
	if(!ctx) return;
	if(chartInstance){ chartInstance.destroy(); }
	chartInstance = new Chart(ctx, {
		type: 'bar',
		data: { 
			labels, 
			datasets: [{ 
				label: 'Spending by Category', 
				data, 
				backgroundColor: '#137FEC',
				borderRadius: 8 
			}] 
		},
		options: { 
			responsive: true,
			maintainAspectRatio: true,
			scales: { 
				y: { 
					beginAtZero: true,
					ticks: {
						callback: function(value) {
							return '$' + value.toFixed(2);
						}
					}
				} 
			},
			plugins: {
				legend: {
					display: false
				}
			}
		}
	});
}

async function render(){
	try {
		const viewMode = getViewMode();
		const user = getUserData();
		
		// Build query params
		const params = {};
		if (viewMode === 'family' && user?.familyId) {
			params.familyId = user.familyId;
		} else {
			params.type = 'personal';
		}
		
		const response = await apiRequest('/api/expenses', { 
			method: 'GET',
			params 
		});
		
		const items = response.data || [];
		const total = items.reduce((sum,e)=> sum + Number(e.amount || 0), 0);
		totalSpentEl.textContent = formatFromUSD(total);
		transactionCountEl.textContent = items.length;

		const byCat = CATEGORIES.reduce((acc,c)=> (acc[c]=0,acc), {});
		for(const e of items){ 
			if (byCat.hasOwnProperty(e.category)) {
				byCat[e.category] = (byCat[e.category]||0) + Number(e.amount); 
			}
		}
		updateChart(Object.keys(byCat), Object.values(byCat));
	} catch (error) {
		console.error('Error loading dashboard data:', error);
		totalSpentEl.textContent = 'Error';
		transactionCountEl.textContent = '0';
	}
}

render();


