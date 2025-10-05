import { apiList, CATEGORIES, formatFromUSD } from './shared.js';

const totalSpentEl = document.getElementById('totalSpent');
const transactionCountEl = document.getElementById('transactionCount');

let chartInstance = null;
function updateChart(labels, data){
	const ctx = document.getElementById('categoryChart');
	if(!ctx) return;
	if(chartInstance){ chartInstance.destroy(); }
	chartInstance = new Chart(ctx, {
		type: 'bar',
		data: { labels, datasets: [{ label: 'By Category', data, backgroundColor: '#5b8cff' }] },
		options: { scales: { y: { beginAtZero: true } } }
	});
}

async function render(){
	const items = await apiList();
    const total = items.reduce((sum,e)=> sum + Number(e.amount || 0), 0);
    totalSpentEl.textContent = formatFromUSD(total);
	transactionCountEl.textContent = items.length;

	const byCat = CATEGORIES.reduce((acc,c)=> (acc[c]=0,acc), {});
	for(const e of items){ byCat[e.category] = (byCat[e.category]||0) + Number(e.amount); }
    updateChart(Object.keys(byCat), Object.values(byCat));
}

render();


