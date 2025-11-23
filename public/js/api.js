// API Client and Authentication
const API_BASE = '';
const AUTH_TOKEN_KEY = 'authToken';

function getAuthToken(){
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setAuthToken(token){
    if(token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
}

function getAuthHeaders(){
    const token = getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function isAuthenticated(){
    return !!getAuthToken();
}

function logout(){
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('userData');
    localStorage.removeItem('viewMode');
    window.location.href = '/pages/login.html';
}

async function apiRequest(endpoint, options = {}){
    const url = `${API_BASE}${endpoint}`;
    const headers = { ...getAuthHeaders(), ...(options.headers || {}) };
    
    try {
        const response = await fetch(url, { ...options, headers });
        
        if (response.status === 401) {
            logout();
            return { success: false, error: 'Session expired' };
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Request failed:', error);
        return { success: false, error: error.message };
    }
}

async function apiList(params){
    try{
        const sp = new URLSearchParams(params || {});
        for (const [k,v] of [...sp.entries()]) { if(!v) sp.delete(k); }
        const resp = await apiRequest(`/api/expenses?${sp.toString()}`);
        if(resp.success && Array.isArray(resp.data)){
            return resp.data;
        }
    }catch(e){
        console.error('Failed to fetch from API', e);
    }
    return [];
}

export { 
    API_BASE, AUTH_TOKEN_KEY, getAuthToken, setAuthToken, 
    getAuthHeaders, isAuthenticated, logout, apiRequest, apiList 
};
