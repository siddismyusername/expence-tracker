import { api } from './api.js';

async function loadSettings() {
    try {
        const user = await api.auth.me();

        document.getElementById('userNameDisplay').textContent = user.name;
        document.getElementById('userEmailDisplay').textContent = user.email;
        document.getElementById('profileImage').src = user.profilePicture;

        // Populate preferences if any
        if (user.preferences) {
            const currency = user.preferences.currency || 'USD';
            document.getElementById('currencySelect').value = currency;
            document.getElementById('notifThreshold').value = user.preferences.notificationThreshold || 0;
            document.getElementById('notifEnabled').checked = user.preferences.notificationsEnabled || false;
            updateCurrencySymbols(currency);
        }

        // Load Family Section
        loadFamilySection(user);

    } catch (err) {
        console.error(err);
    }
}

async function loadFamilySection(user) {
    const container = document.getElementById('familyContent');
    container.innerHTML = ''; // Clear loading spinner

    if (user.familyId) {
        // Show Family Dashboard
        try {
            const family = await api.family.members();
            renderFamilyDashboard(container, family, user._id);
        } catch (err) {
            container.innerHTML = '<p class="text-red-500">Failed to load family details.</p>';
        }
    } else {
        // Show Create/Join Options
        renderNoFamilyView(container);
    }
}

function renderNoFamilyView(container) {
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-lg border border-app bg-app-input">
                <h3 class="font-bold text-app-foreground mb-2">Create Family</h3>
                <form id="createFamilyForm" class="space-y-3">
                    <input type="text" id="newFamilyName" placeholder="Family Name" required
                        class="w-full rounded bg-app-card border-app text-sm px-3 py-2">
                    <button type="submit" class="w-full bg-primary text-white rounded py-2 text-sm font-medium hover:bg-primary-hover">Create</button>
                </form>
            </div>
            <div class="p-4 rounded-lg border border-app bg-app-input">
                <h3 class="font-bold text-app-foreground mb-2">Join Family</h3>
                <form id="joinFamilyForm" class="space-y-3">
                    <input type="text" id="joinFamilyId" placeholder="Family ID" required
                        class="w-full rounded bg-app-card border-app text-sm px-3 py-2">
                    <button type="submit" class="w-full bg-app-card border border-app text-app-foreground rounded py-2 text-sm font-medium hover:bg-app-input/80">Join</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('createFamilyForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('newFamilyName').value;
        try {
            await api.family.create({ name });
            // Reload settings to update view
            loadSettings();
        } catch (err) {
            alert(err.message);
        }
    });

    document.getElementById('joinFamilyForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const familyId = document.getElementById('joinFamilyId').value;
        try {
            await api.family.join({ familyId });
            loadSettings();
        } catch (err) {
            alert(err.message);
        }
    });
}

function renderFamilyDashboard(container, family, currentUserId) {
    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-xl font-bold text-primary">${family.name}</h3>
                    <p class="text-xs text-app-muted flex items-center gap-2">
                        ID: <span class="font-mono select-all">${family.familyId}</span>
                        <button id="copyFamilyId" class="text-primary hover:text-primary-hover"><span class="material-symbols-outlined text-sm">content_copy</span></button>
                    </p>
                </div>
                <button id="leaveFamilyBtn" class="text-red-500 hover:text-red-600 text-sm font-medium border border-red-500/30 px-3 py-1 rounded hover:bg-red-500/10">Leave Family</button>
            </div>

            <div class="border-t border-app pt-4">
                <h4 class="text-sm font-semibold text-app-foreground mb-3">Members</h4>
                <div class="space-y-2" id="membersList">
                    <!-- Members injected here -->
                </div>
            </div>
        </div>
    `;

    const membersList = document.getElementById('membersList');
    family.members.forEach(member => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-2 rounded hover:bg-app-input/50';
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${member.profilePicture}" alt="${member.name}" class="w-8 h-8 rounded-full">
                <div>
                    <p class="text-sm font-medium text-app-foreground">${member.name} ${member._id === currentUserId ? '(You)' : ''}</p>
                    <p class="text-xs text-app-muted">${member.email}</p>
                </div>
            </div>
            ${member._id === family.createdBy ? '<span class="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Admin</span>' : ''}
        `;
        membersList.appendChild(div);
    });

    document.getElementById('copyFamilyId').addEventListener('click', () => {
        navigator.clipboard.writeText(family.familyId);
        alert('Family ID copied!');
    });

    document.getElementById('leaveFamilyBtn').addEventListener('click', async () => {
        if (!confirm('Are you sure you want to leave this family?')) return;
        try {
            await api.family.leave();
            loadSettings();
        } catch (err) {
            alert(err.message);
        }
    });
}

loadSettings();

// Currency conversion rates (simplified - in production use a real API)
const currencyRates = {
    'USD': 1,
    'EUR': 0.92,
    'GBP': 0.79,
    'INR': 83.12,
    'JPY': 149.50
};

function convertCurrency(amountUSD, toCurrency) {
    return amountUSD * currencyRates[toCurrency];
}

// Handle currency change
document.getElementById('currencySelect').addEventListener('change', async (e) => {
    const newCurrency = e.target.value;
    try {
        await api.auth.updateProfile({ 
            preferences: { currency: newCurrency }
        });
        // Update currency symbol in UI
        updateCurrencySymbols(newCurrency);
    } catch (err) {
        console.error('Error updating currency:', err);
    }
});

function updateCurrencySymbols(currency) {
    const symbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'INR': '₹',
        'JPY': '¥'
    };
    const symbol = symbols[currency] || '$';
    
    // Update threshold currency display
    const thresholdCurrency = document.getElementById('thresholdCurrency');
    if (thresholdCurrency) thresholdCurrency.textContent = symbol;
}

// Handle profile picture upload
document.getElementById('avatarUploadBtn').addEventListener('click', () => {
    document.getElementById('avatarFile').click();
});

document.getElementById('avatarFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // For now, use a placeholder URL generator
    // In production, upload to cloud storage
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const imageUrl = event.target.result;
            await api.auth.updateProfile({ profilePicture: imageUrl });
            document.getElementById('profileImage').src = imageUrl;
        } catch (err) {
            console.error('Error updating profile picture:', err);
            alert('Failed to update profile picture');
        }
    };
    reader.readAsDataURL(file);
});

// Handle notification settings
document.getElementById('notifEnabled').addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    try {
        await api.auth.updateProfile({ 
            preferences: { notificationsEnabled: enabled }
        });
    } catch (err) {
        console.error('Error updating notification settings:', err);
    }
});

document.getElementById('notifThreshold').addEventListener('change', async (e) => {
    const threshold = parseFloat(e.target.value) || 0;
    try {
        await api.auth.updateProfile({ 
            preferences: { notificationThreshold: threshold }
        });
    } catch (err) {
        console.error('Error updating threshold:', err);
    }
});
