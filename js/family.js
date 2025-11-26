import { api } from './api.js';

const noFamilyView = document.getElementById('noFamilyView');
const familyDashboardView = document.getElementById('familyDashboardView');

async function loadFamily() {
    try {
        const user = await api.auth.me();

        if (user.familyId) {
            showFamilyDashboard();
        } else {
            showNoFamilyView();
        }
    } catch (err) {
        console.error(err);
    }
}

function showNoFamilyView() {
    noFamilyView.classList.remove('hidden');
    familyDashboardView.classList.add('hidden');
}

async function showFamilyDashboard() {
    noFamilyView.classList.add('hidden');
    familyDashboardView.classList.remove('hidden');

    try {
        const family = await api.family.members();

        document.getElementById('familyName').textContent = family.name;
        document.getElementById('familyId').textContent = family.familyId;

        const membersList = document.getElementById('membersList');
        membersList.innerHTML = '';

        family.members.forEach(member => {
            const div = document.createElement('div');
            div.className = 'p-4 flex items-center justify-between hover:bg-app-input/50 transition-colors';
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <img src="${member.profilePicture}" alt="${member.name}" class="w-10 h-10 rounded-full border border-app">
                    <div>
                        <p class="font-medium text-app-foreground">${member.name}</p>
                        <p class="text-xs text-app-muted">${member.email}</p>
                    </div>
                </div>
                ${member._id === family.createdBy ? '<span class="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Admin</span>' : ''}
            `;
            membersList.appendChild(div);
        });

    } catch (err) {
        console.error(err);
    }
}

// Create Family
document.getElementById('createFamilyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('newFamilyName').value;
    try {
        await api.family.create({ name });
        loadFamily();
    } catch (err) {
        alert(err.message);
    }
});

// Join Family
document.getElementById('joinFamilyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const familyId = document.getElementById('joinFamilyId').value;
    try {
        await api.family.join({ familyId });
        loadFamily();
    } catch (err) {
        alert(err.message);
    }
});

// Leave Family
document.getElementById('leaveFamilyBtn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to leave this family?')) return;
    try {
        await api.family.leave();
        loadFamily();
    } catch (err) {
        alert(err.message);
    }
});

// Copy ID
document.getElementById('copyFamilyIdBtn').addEventListener('click', () => {
    const id = document.getElementById('familyId').textContent;
    navigator.clipboard.writeText(id);
    alert('Family ID copied!');
});

loadFamily();
