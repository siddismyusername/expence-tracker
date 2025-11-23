import { apiRequest, getViewMode, getUserData, isAuthenticated, CATEGORIES, formatFromUSD } from './shared.js';
import '/js/navbar.js';

// Check authentication
if (!isAuthenticated()) {
  window.location.href = '/pages/login.html';
}

const myTotalSpentEl = document.getElementById('myTotalSpent');
const familyTotalSpentEl = document.getElementById('familyTotalSpent');

let categoryChartInstance = null;
let personalPieChartInstance = null;

function updateCategoryChart(labels, data){
	const ctx = document.getElementById('categoryChart');
	if(!ctx) return;
	if(categoryChartInstance){ categoryChartInstance.destroy(); }
	categoryChartInstance = new Chart(ctx, {
		type: 'bar',
		data: { 
			labels, 
			datasets: [{ 
				label: 'Family Spending', 
				data, 
				backgroundColor: '#137FEC',
				borderRadius: 8 
			}] 
		},
		options: { 
			responsive: true,
			maintainAspectRatio: false,
			scales: { 
				y: { 
					beginAtZero: true,
					ticks: { callback: (val) => '$' + val }
				} 
			},
			plugins: { legend: { display: false } }
		}
	});
}

function updatePersonalPieChart(labels, data){
	const ctx = document.getElementById('personalPieChart');
	if(!ctx) return;
	if(personalPieChartInstance){ personalPieChartInstance.destroy(); }
	
    // Generate colors
    const colors = [
        '#137FEC', '#0EA5E9', '#22C55E', '#FACC15', '#EF4444', 
        '#8B5CF6', '#EC4899', '#64748B', '#F97316', '#14B8A6'
    ];

	personalPieChartInstance = new Chart(ctx, {
		type: 'doughnut',
		data: { 
			labels, 
			datasets: [{ 
				data, 
				backgroundColor: colors.slice(0, labels.length),
				borderWidth: 0
			}] 
		},
		options: { 
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { position: 'right' }
			}
		}
	});
}

async function render(){
	try {
		const user = getUserData();
		
		// Fetch all expenses (API defaults to family if user has familyId)
		const response = await apiRequest('/api/expenses', { method: 'GET' });
		const items = response.data || [];
		
        // 1. Calculate Family Total
		const familyTotal = items.reduce((sum,e)=> sum + Number(e.amount || 0), 0);
		familyTotalSpentEl.textContent = formatFromUSD(familyTotal);

        // 2. Calculate My Total (Personal + Common)
        const myExpenses = items.filter(e => e.userId === user.userId);
        const myTotal = myExpenses.reduce((sum,e)=> sum + Number(e.amount || 0), 0);
        myTotalSpentEl.textContent = formatFromUSD(myTotal);

        // 3. Prepare Family Category Chart
		const byCatFamily = {};
		for(const e of items){ 
            byCatFamily[e.category] = (byCatFamily[e.category]||0) + Number(e.amount); 
		}
		updateCategoryChart(Object.keys(byCatFamily), Object.values(byCatFamily));

        // 4. Prepare Personal Pie Chart (All expenses made by me)
        const byCatPersonal = {};
        for(const e of myExpenses){
            byCatPersonal[e.category] = (byCatPersonal[e.category]||0) + Number(e.amount);
        }
        
        // Only show categories with > 0 spending
        const pieLabels = Object.keys(byCatPersonal).filter(k => byCatPersonal[k] > 0);
        const pieData = pieLabels.map(k => byCatPersonal[k]);
        
        if (pieLabels.length > 0) {
            updatePersonalPieChart(pieLabels, pieData);
        } else {
            // Handle empty state for pie chart?
             const ctx = document.getElementById('personalPieChart');
             if(ctx) {
                 // Maybe clear or show text
             }
        }

	} catch (error) {
		console.error('Error loading dashboard data:', error);
        if(myTotalSpentEl) myTotalSpentEl.textContent = 'Error';
	}
}

render();


