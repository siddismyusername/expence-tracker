import { 
    getPreferredCurrency, setPreferredCurrency, updateNotificationDot, usdToCurrency, 
    getCurrencySymbol, getNotificationThresholdUsd, applyProfileImageToDom,
    apiList, getNotificationEnabled, setNotificationEnabled, setNotificationThresholdUsd, 
    currencyToUsd, setProfileImage, isAuthenticated,
    getUserData, setUserData, apiRequest, getProfileImage
} from './shared.js';
import './navbar.js';

if (!isAuthenticated()) {
    window.location.href = '/pages/login.html';
}

// Currency settings
const sel = document.getElementById('currencySelect');
if(sel) {
    sel.value = getPreferredCurrency();
    sel.addEventListener('change', ()=>{
        setPreferredCurrency(sel.value);
        const currency = sel.value;
        const sym = document.getElementById('thresholdCurrency');
        const input = document.getElementById('notifThreshold');
        if(sym) sym.textContent = getCurrencySymbol(currency);
        if(input) input.value = String(usdToCurrency(getNotificationThresholdUsd(), currency).toFixed(2));
        updateNotificationDot();
    });
    // Initial sync for threshold UI
    const currency = sel.value;
    const sym = document.getElementById('thresholdCurrency');
    const input = document.getElementById('notifThreshold');
    if(sym) sym.textContent = getCurrencySymbol(currency);
    if(input) input.value = String(usdToCurrency(getNotificationThresholdUsd(), currency).toFixed(2));
}

updateNotificationDot();
applyProfileImageToDom();

// Update user name and email display
const userData = getUserData();
if(userData) {
    const nameDisplay = document.getElementById('userNameDisplay');
    const emailDisplay = document.getElementById('userEmailDisplay');
    const profileImageEl = document.getElementById('profileImage');
    
    if(nameDisplay) nameDisplay.textContent = userData.name || 'User Name';
    if(emailDisplay) emailDisplay.textContent = userData.email || 'user@example.com';
    if(profileImageEl) {
        const profileImg = getProfileImage() || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=random`;
        profileImageEl.src = profileImg;
    }
}

// Avatar upload
const uploadBtn = document.getElementById('avatarUploadBtn');
const fileInput = document.getElementById('avatarFile');
uploadBtn?.addEventListener('click', (e)=>{ e.preventDefault(); fileInput?.click(); });
fileInput?.addEventListener('change', ()=>{
    const file = fileInput.files && fileInput.files[0];
    if(!file) return;
    if(file.size > 10 * 1024 * 1024){ alert('File too large (max 10MB)'); fileInput.value = ''; return; }
    if(!/^image\/(png|jpeg|jpg|gif|webp)$/i.test(file.type)){ alert('Unsupported format'); fileInput.value=''; return; }
    const reader = new FileReader();
    reader.onload = ()=>{
        const dataUrl = String(reader.result || '');
        if(!dataUrl.startsWith('data:image/')) return;
        setProfileImage(dataUrl);
        applyProfileImageToDom();
        // Update settings page image immediately
        const profileImageEl = document.getElementById('profileImage');
        if(profileImageEl) profileImageEl.src = dataUrl;
        fileInput.value = '';
    };
    reader.readAsDataURL(file);
});

// Notifications settings
const enabledEl = document.getElementById('notifEnabled');
const thresholdEl = document.getElementById('notifThreshold');
if(enabledEl){ enabledEl.checked = !!getNotificationEnabled(); }
enabledEl?.addEventListener('change', ()=>{
    setNotificationEnabled(enabledEl.checked);
    updateNotificationDot();
});
thresholdEl?.addEventListener('input', ()=>{
    const currency = getPreferredCurrency();
    const usd = currencyToUsd(thresholdEl.value, currency);
    setNotificationThresholdUsd(usd);
    updateNotificationDot();
});

// Data Management
const downloadBtn = document.getElementById('downloadBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const startEl = document.getElementById('start-date');
const endEl = document.getElementById('end-date');

function withinRange(item){
    const s = startEl.value ? new Date(startEl.value) : null;
    const e = endEl.value ? new Date(endEl.value) : null;
    const d = new Date(item.date);
    if(s && d < s) return false;
    if(e && d > e) return false;
    return true;
}

downloadBtn?.addEventListener('click', async (e)=>{
    e.preventDefault();
    const items = (await apiList()) || [];
    const filtered = items.filter(withinRange);
    const payload = { version: 1, exportedAt: new Date().toISOString(), currency: 'USD', items: filtered };
    const blob = new Blob([JSON.stringify(payload,null,2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses-export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
});

importBtn?.addEventListener('click', ()=> importFile?.click());
importFile?.addEventListener('change', async ()=>{
    const file = importFile.files && importFile.files[0];
    if(!file) return;
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        
        if(!items.length) {
            alert('No items found in file');
            return;
        }

        const confirmImport = confirm(`Found ${items.length} expenses. Import them to your account?`);
        if(!confirmImport) {
            importFile.value = '';
            return;
        }

        const srcCurrency = (data && data.currency) || 'USD';
        
        // Normalize data for API
        const normalizedItems = items.map(x => ({
            amount: srcCurrency === 'USD' ? Number(x.amount||0) : currencyToUsd(x.amount, srcCurrency),
            category: x.category,
            date: x.date,
            description: x.description,
            type: x.type || 'personal'
        }));

        const resp = await apiRequest('/api/expenses/batch', {
            method: 'POST',
            body: JSON.stringify({ items: normalizedItems })
        });

        if (resp.success) {
            alert(`Successfully imported ${resp.count} expenses!`);
        } else {
            throw new Error(resp.error || 'Import failed');
        }
    } catch (err) {
        console.error(err);
        alert('Import failed: ' + err.message);
    } finally {
        importFile.value = '';
    }
});

// Family Management Logic
const familySection = document.getElementById('familySection');
const familyContent = document.getElementById('familyContent');

async function initFamilySection() {
    console.log('initFamilySection called');
    if (!familySection || !familyContent) {
        console.error('Family section elements not found in DOM');
        return;
    }
    
    const isAuth = isAuthenticated();
    console.log('Is Authenticated:', isAuth);

    if (!isAuth) {
        console.log('User not authenticated, hiding family section');
        return;
    }

    // Always try to fetch fresh user data to ensure family status is up to date
    try {
        console.log('Fetching fresh user data...');
        const resp = await apiRequest('/api/auth/me');
        console.log('User data response:', resp);
        
        if (resp.success && resp.data.user) {
            const userData = resp.data.user;
            setUserData(userData);
            
            // Update profile section
            const nameDisplay = document.getElementById('userNameDisplay');
            const emailDisplay = document.getElementById('userEmailDisplay');
            if(nameDisplay) nameDisplay.textContent = userData.name;
            if(emailDisplay) emailDisplay.textContent = userData.email;
            
            // Show family section
            console.log('Showing family section');
            familySection.classList.remove('hidden');
            
            if (userData.familyId) {
                console.log('Rendering family dashboard for:', userData.familyId);
                await renderFamilyDashboard(userData);
            } else {
                console.log('Rendering create family view');
                renderCreateFamily();
            }
        } else {
            console.error('Failed to fetch user data: Invalid response', resp);
            // Fallback to local data if API returns success:false but no error thrown
            const localData = getUserData();
            if (localData) {
                console.log('Falling back to local user data (API success:false)');
                familySection.classList.remove('hidden');
                if (localData.familyId) {
                    await renderFamilyDashboard(localData);
                } else {
                    renderCreateFamily();
                }
            } else {
                 familyContent.innerHTML = `<p class="text-red-500">Failed to load user data.</p>`;
            }
        }
    } catch (e) {
        console.error('Failed to fetch user data', e);
        // Fallback to local data if fetch fails
        const localData = getUserData();
        if (localData) {
            console.log('Falling back to local user data (API Error)');
            familySection.classList.remove('hidden');
            if (localData.familyId) {
                await renderFamilyDashboard(localData);
            } else {
                renderCreateFamily();
            }
        } else {
             familyContent.innerHTML = `<p class="text-red-500">Failed to load user data. Please check your connection.</p>`;
        }
    }
}

function renderCreateFamily() {
    familyContent.innerHTML = `
        <div class="space-y-6">
            <!-- Create Family -->
            <div class="text-center">
                <div class="mb-4 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-users text-4xl mb-2"></i>
                    <p>Create a family group to share expenses and budgets.</p>
                </div>
                <form id="createFamilyForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">Family Name</label>
                        <input type="text" id="familyNameInput" required class="form-field" placeholder="e.g. The Smiths">
                    </div>
                    <button type="submit" class="w-full flex justify-center px-4 py-2 rounded-md text-sm font-medium text-white bg-app-primary hover:brightness-110 focus-ring">
                        Create Family
                    </button>
                </form>
            </div>

            <div class="relative">
                <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                    <span class="px-2 bg-app-card text-gray-500">Or join existing</span>
                </div>
            </div>

            <!-- Join Family -->
            <div>
                <form id="joinFamilyForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">Family ID</label>
                        <input type="text" id="joinFamilyIdInput" required class="form-field" placeholder="e.g. fam_123abc">
                    </div>
                    <button type="submit" class="w-full flex justify-center px-4 py-2 rounded-md text-sm font-medium text-app-foreground bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus-ring border border-gray-300 dark:border-gray-600">
                        Join Family
                    </button>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('createFamilyForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('familyNameInput').value;
        try {
            const resp = await apiRequest('/api/family', {
                method: 'POST',
                body: JSON.stringify({ name })
            });
            if (resp.success) {
                // Update local user data with new familyId
                const userData = getUserData();
                userData.familyId = resp.data.family.familyId;
                userData.role = 'admin';
                setUserData(userData);
                // Reload to show dashboard
                initFamilySection();
                alert('Family created successfully!');
            }
        } catch (err) {
            alert(err.message);
        }
    });

    document.getElementById('joinFamilyForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const familyId = document.getElementById('joinFamilyIdInput').value;
        try {
            const resp = await apiRequest('/api/family/join', {
                method: 'POST',
                body: JSON.stringify({ familyId })
            });
            if (resp.success) {
                // Update local user data with new familyId
                const userData = getUserData();
                userData.familyId = resp.data.family.familyId;
                setUserData(userData);
                // Reload to show dashboard
                initFamilySection();
                alert('Joined family successfully!');
            } else {
                alert(resp.error || 'Failed to join family');
            }
        } catch (err) {
            alert(err.message);
        }
    });
}

async function renderFamilyDashboard(userData) {
    try {
        console.log('Fetching family details...');
        // Fetch family details and members
        const [familyResp, membersResp] = await Promise.all([
            apiRequest(`/api/family/${userData.familyId}`),
            apiRequest(`/api/family/${userData.familyId}/members`)
        ]);
        
        console.log('Family details fetched:', familyResp, membersResp);

        if (!familyResp.success || !membersResp.success) {
            throw new Error('Failed to fetch family details');
        }
        
        const family = familyResp.data.family;
        const members = membersResp.data.members;
        // Fix: Check admin status against family.adminUserId, not user role
        const isAdmin = family.adminUserId === userData.userId;

        let membersHtml = members.map(m => {
            const displayRole = m.role === 'admin' ? 'Admin' : 'Member';
            return `
            <div class="flex items-center justify-between p-3 rounded-lg bg-app-input">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold bg-app-primary/15 text-app-primary">
                        ${m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p class="text-sm font-medium text-app-foreground">
                            ${m.name} ${m.userId === userData.userId ? '(You)' : ''}
                        </p>
                        <p class="text-xs text-app-muted capitalize">${displayRole}</p>
                    </div>
                </div>
                ${isAdmin && m.userId !== userData.userId ? `
                <button onclick="removeMember('${m.userId}')" class="text-red-500 hover:text-red-700 text-sm" title="Remove Member">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </div>
        `}).join('');

        familyContent.innerHTML = `
            <div class="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-xl font-bold text-app-foreground">${family.name}</h3>
                        <p class="text-sm text-app-muted mt-1">Family ID: <span class="font-mono select-all bg-app-input px-1 rounded">${family.familyId}</span></p>
                    </div>
                    <div class="flex flex-col gap-2">
                        <button id="settingsCopyInviteBtn" class="px-3 py-1 rounded text-sm font-medium text-white bg-app-primary hover:brightness-110 transition-colors flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">content_copy</span> Copy Invite
                        </button>
                        <button id="settingsLeaveFamilyBtn" class="px-3 py-1 rounded text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 transition-colors">
                            Leave Family
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="mb-6">
                <h4 class="text-sm font-medium text-app-foreground mb-3">Members</h4>
                <div class="space-y-2 max-h-60 overflow-y-auto">
                    ${membersHtml}
                </div>
            </div>
        `;

        // Setup Copy Invite Button
        const copyBtn = document.getElementById('settingsCopyInviteBtn');
        if (copyBtn) {
            copyBtn.onclick = () => {
                const inviteText = `Join my family on Expense Tracker! Use Family ID: ${family.familyId}`;
                navigator.clipboard.writeText(inviteText);
                
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> Copied!';
                copyBtn.classList.remove('bg-app-primary');
                copyBtn.classList.add('bg-green-600');
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                    copyBtn.classList.add('bg-app-primary');
                    copyBtn.classList.remove('bg-green-600');
                }, 2000);
            };
        }

        // Setup Leave Family Button
        const leaveBtn = document.getElementById('settingsLeaveFamilyBtn');
        if (leaveBtn) {
            leaveBtn.onclick = async () => {
                if (!confirm('Are you sure you want to leave this family?')) return;
                try {
                    const res = await apiRequest('/api/family/leave', { method: 'POST' });
                    if (res.success) {
                        // Update local user data
                        const user = getUserData();
                        user.familyId = null;
                        setUserData(user);
                        window.location.reload();
                    } else {
                        alert(res.error || 'Failed to leave family');
                    }
                } catch (error) {
                    console.error(error);
                    alert('Failed to leave family');
                }
            };
        }

        if (isAdmin) {
            // Expose removeMember to global scope for onclick
            window.removeMember = async (userId) => {
                if(!confirm('Are you sure you want to remove this member?')) return;
                try {
                    const resp = await apiRequest(`/api/family/${userData.familyId}/members/${userId}`, {
                        method: 'DELETE'
                    });
                    if (resp.success) {
                        initFamilySection(); // Reload
                    }
                } catch (err) {
                    alert(err.message);
                }
            };
        }

    } catch (err) {
        familyContent.innerHTML = `<p class="text-red-500">Failed to load family data.</p>`;
        console.error(err);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initFamilySection().catch(console.error));
} else {
    initFamilySection().catch(console.error);
}
