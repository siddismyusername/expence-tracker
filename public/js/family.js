import { 
    apiRequest, getUserData, setUserData, isAuthenticated 
} from './shared.js';
import './navbar.js';

if (!isAuthenticated()) {
    window.location.href = '/pages/login.html';
}

const noFamilyView = document.getElementById('noFamilyView');
const familyDashboardView = document.getElementById('familyDashboardView');

// Forms
const createFamilyForm = document.getElementById('createFamilyForm');
const joinFamilyForm = document.getElementById('joinFamilyForm');

// Dashboard Elements
const familyNameEl = document.getElementById('familyName');
const familyIdEl = document.getElementById('familyId');
const copyFamilyIdBtn = document.getElementById('copyFamilyIdBtn');
const copyInviteBtn = document.getElementById('copyInviteBtn');
const membersListEl = document.getElementById('membersList');
const leaveFamilyBtn = document.getElementById('leaveFamilyBtn');

async function init() {
    const user = getUserData();
    
    if (user.familyId) {
        showFamilyDashboard(user.familyId);
    } else {
        showNoFamilyView();
    }
}

function showNoFamilyView() {
    noFamilyView.classList.remove('hidden');
    familyDashboardView.classList.add('hidden');
}

async function showFamilyDashboard(familyId) {
    noFamilyView.classList.add('hidden');
    familyDashboardView.classList.remove('hidden');
    
    try {
        // Fetch Family Details
        const familyRes = await apiRequest(`/api/family/${familyId}`);
        
        if (familyRes.success) {
            const family = familyRes.data.family;
            familyNameEl.textContent = family.name;
            familyIdEl.textContent = family.familyId;
            
            // Setup Copy Button
            copyFamilyIdBtn.onclick = () => {
                navigator.clipboard.writeText(family.familyId);
                const originalText = copyFamilyIdBtn.innerHTML;
                copyFamilyIdBtn.innerHTML = '<span class="material-symbols-outlined">check</span> Copied';
                setTimeout(() => copyFamilyIdBtn.innerHTML = originalText, 2000);
            };

            // Setup Invite Button
            if (copyInviteBtn) {
                copyInviteBtn.onclick = () => {
                    const inviteText = `Join my family on Expense Tracker! Use Family ID: ${family.familyId}`;
                    navigator.clipboard.writeText(inviteText);
                    
                    const originalHTML = copyInviteBtn.innerHTML;
                    const originalClasses = copyInviteBtn.className;
                    
                    copyInviteBtn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> Copied!';
                    copyInviteBtn.classList.remove('bg-primary', 'hover:bg-primary-hover');
                    copyInviteBtn.classList.add('bg-green-600', 'hover:bg-green-700');
                    
                    setTimeout(() => {
                        copyInviteBtn.innerHTML = originalHTML;
                        copyInviteBtn.className = originalClasses;
                    }, 2000);
                };
            }

            renderMembers(family.members, family.adminUserId);
        } else {
            // Handle sync issues (e.g. user removed from family but local storage says otherwise)
            if (familyRes.error === 'Not a member of this family' || familyRes.error === 'Family not found') {
                console.warn('Local family state out of sync with server. Resetting.');
                const user = getUserData();
                user.familyId = null;
                setUserData(user);
                showNoFamilyView();
                // Optional: Show a toast notification here
            } else {
                console.error('Failed to load family data:', familyRes.error);
            }
        }
    } catch (error) {
        console.error('Failed to load family data', error);
    }
}

function renderMembers(members, adminId) {
    const currentUser = getUserData();
    const isAdmin = currentUser.userId === adminId;
    
    membersListEl.innerHTML = members.map(member => `
        <div class="flex items-center justify-between p-4 bg-app-background rounded-lg border border-app">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    ${member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p class="font-medium text-app-foreground">
                        ${member.name} 
                        ${member.userId === currentUser.userId ? '(You)' : ''}
                        ${member.userId === adminId ? '<span class="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">Admin</span>' : ''}
                    </p>
                    <p class="text-sm text-muted-foreground-light dark:text-muted-foreground-dark">${member.email}</p>
                </div>
            </div>
            ${isAdmin && member.userId !== currentUser.userId ? `
                <button onclick="removeMember('${member.userId}')" class="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Remove Member">
                    <span class="material-symbols-outlined">person_remove</span>
                </button>
            ` : ''}
        </div>
    `).join('');
}

// Make removeMember globally available for the onclick handler
window.removeMember = async (userId) => {
    if(!confirm('Are you sure you want to remove this member?')) return;
    
    const user = getUserData();
    const res = await apiRequest(`/api/family/${user.familyId}/members/${userId}`, {
        method: 'DELETE'
    });
    
    if(res.success) {
        // Refresh dashboard
        showFamilyDashboard(user.familyId);
    } else {
        alert(res.error || 'Failed to remove member');
    }
};

// Event Listeners
if (leaveFamilyBtn) {
    leaveFamilyBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to leave this family?')) return;

        try {
            const res = await apiRequest('/api/family/leave', {
                method: 'POST'
            });

            if (res.success) {
                // Update local user data
                const user = getUserData();
                user.familyId = null;
                setUserData(user);
                
                // Reload to show no family view
                window.location.reload();
            } else {
                alert(res.error || 'Failed to leave family');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to leave family');
        }
    });
}

createFamilyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('newFamilyName').value;
    
    try {
        const res = await apiRequest('/api/family', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
        
        if (res.success) {
            // Update local user data
            const user = getUserData();
            user.familyId = res.data.family.familyId;
            setUserData(user);
            
            // Reload to show dashboard
            window.location.reload();
        } else {
            alert(res.error);
        }
    } catch (error) {
        console.error(error);
        alert('Failed to create family');
    }
});

joinFamilyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const familyId = document.getElementById('joinFamilyId').value;
    
    try {
        const res = await apiRequest('/api/family/join', {
            method: 'POST',
            body: JSON.stringify({ familyId })
        });
        
        if (res.success) {
            // Update local user data
            const user = getUserData();
            user.familyId = res.data.family.familyId;
            setUserData(user);
            
            // Reload to show dashboard
            window.location.reload();
        } else {
            alert(res.error);
        }
    } catch (error) {
        console.error(error);
        alert('Failed to join family');
    }
});

// Initialize
init();
