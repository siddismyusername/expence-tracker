// Shared utilities for expense pages
const PROFILE_IMAGE_KEY = 'profileImageDataUrl';
const STORAGE_KEY = 'expenses';
const API_BASE = '';
const CATEGORIES = ['Food','Transport','Entertainment','Bills','Shopping','Other'];
// Notifications
const NOTIF_ENABLED_KEY = 'notifEnabled';
const NOTIF_THRESHOLD_KEY = 'notifThresholdUsd';
const DEFAULT_THRESHOLD_USD = 100;
const NOTIF_ACK_KEY = 'notifAckUsd';

// Currency preference and formatting
const CURRENCY_KEY = 'currency';
const SUPPORTED_CURRENCIES = ['USD','INR'];
const DEFAULT_CURRENCY = 'USD';
// Simple static rates with USD as the base. Adjust as needed or wire to API.
const EXCHANGE_RATES = { USD: 1, INR: 83 };

function getPreferredCurrency(){
    const stored = localStorage.getItem(CURRENCY_KEY);
    return SUPPORTED_CURRENCIES.includes(stored) ? stored : DEFAULT_CURRENCY;
}

function setPreferredCurrency(code){
    const value = SUPPORTED_CURRENCIES.includes(code) ? code : DEFAULT_CURRENCY;
    localStorage.setItem(CURRENCY_KEY, value);
}

function getCurrencySymbol(code){
    const map = { USD: '$', INR: '₹' };
    return map[code || getPreferredCurrency()] || '$';
}

function getCurrencyFormatter(code){
    const currency = code || getPreferredCurrency();
    // Use locale tuned for currency style grouping
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency });
}

function formatCurrency(amount, code){
    const formatter = getCurrencyFormatter(code);
    const num = Number(amount || 0);
    return formatter.format(isFinite(num) ? num : 0);
}

// Conversions (store in USD, display in selected currency)
function usdToCurrency(amountUsd, code){
    const currency = code || getPreferredCurrency();
    const rate = EXCHANGE_RATES[currency] || 1;
    const num = Number(amountUsd || 0);
    return isFinite(num) ? num * rate : 0;
}

function currencyToUsd(amountInCurrency, code){
    const currency = code || getPreferredCurrency();
    const rate = EXCHANGE_RATES[currency] || 1;
    const num = Number(amountInCurrency || 0);
    return isFinite(num) && rate ? num / rate : 0;
}

function formatFromUSD(amountUsd, code){
    return formatCurrency(usdToCurrency(amountUsd, code), code);
}

function readExpenses(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
}
function writeExpenses(expenses){
    // Ensure there are no duplicate IDs when writing
    const seen = new Set();
    const deduped = [];
    for(const e of expenses){
        const key = String((e && (e.expenseId || e.id)) || '');
        if(!key || seen.has(key)) continue;
        seen.add(key);
        deduped.push(e);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
}
function generateId(){
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function isFutureDate(iso){
    return new Date(iso) > new Date();
}
async function apiList(params){
    // Prefer local data if available
    const local = readExpenses();
    if(Array.isArray(local) && local.length) return local;
    try{
        const sp = new URLSearchParams(params || {});
        for (const [k,v] of [...sp.entries()]) { if(!v) sp.delete(k); }
        const resp = await fetch(`${API_BASE}/api/expenses?${sp.toString()}`);
        if(resp.ok){
            const data = await resp.json();
            if(Array.isArray(data)) return data;
        }
    }catch{}
    return local;
}
async function apiCreate(expense){
    try{
        const resp = await fetch(`${API_BASE}/api/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(expense) });
        if(resp.ok){
            const created = await resp.json();
            const items = readExpenses().filter(e=> String(e.expenseId || e.id) !== String(created.expenseId || created.id));
            items.push(created);
            writeExpenses(items);
            return created;
        }
        // If server responded but not OK, fall back to local persistence
        throw new Error('Server not OK');
    }catch{
        const items = readExpenses().filter(e=> String(e.expenseId || e.id) !== String(expense.expenseId || expense.id));
        items.push(expense);
        writeExpenses(items);
        return expense;
    }
}
async function apiDelete(id){
    try{
        const resp = await fetch(`${API_BASE}/api/expenses/${id}`, { method: 'DELETE' });
        if(!resp.ok) throw new Error('Server not OK');
    }
    finally{
        const items = readExpenses().filter(e=> String(e.expenseId || e.id) !== String(id));
        writeExpenses(items);
    }
}

export { STORAGE_KEY, API_BASE, CATEGORIES, readExpenses, writeExpenses, generateId, isFutureDate, apiList, apiCreate, apiDelete, CURRENCY_KEY, SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, getPreferredCurrency, setPreferredCurrency, getCurrencySymbol, getCurrencyFormatter, formatCurrency, EXCHANGE_RATES, usdToCurrency, currencyToUsd, formatFromUSD };

// Notification preferences helpers
function getNotificationEnabled(){
    return localStorage.getItem(NOTIF_ENABLED_KEY) === '1';
}
function setNotificationEnabled(enabled){
    localStorage.setItem(NOTIF_ENABLED_KEY, enabled ? '1' : '0');
}
function getNotificationThresholdUsd(){
    const v = Number(localStorage.getItem(NOTIF_THRESHOLD_KEY));
    return isFinite(v) && v > 0 ? v : DEFAULT_THRESHOLD_USD;
}
function setNotificationThresholdUsd(value){
    const num = Number(value);
    localStorage.setItem(NOTIF_THRESHOLD_KEY, isFinite(num) && num > 0 ? String(num) : String(DEFAULT_THRESHOLD_USD));
}

function getNotificationAckUsd(){
    const v = Number(localStorage.getItem(NOTIF_ACK_KEY));
    return isFinite(v) && v >= 0 ? v : 0;
}

function setNotificationAckUsd(value){
    const num = Number(value);
    localStorage.setItem(NOTIF_ACK_KEY, isFinite(num) && num >= 0 ? String(num) : '0');
}

async function computeTotalSpentUsd(){
    const items = await apiList();
    return (items || []).reduce((sum, e)=> sum + Number(e.amount || 0), 0);
}

async function updateNotificationDot(){
    try{
        const dots = Array.from(document.querySelectorAll('#notifDot'));
        if(!dots.length) return;
        const enabled = getNotificationEnabled();
        if(!enabled){ dots.forEach(d=> d.style.display = 'none'); return; }
        const thresholdUsd = getNotificationThresholdUsd();
        const totalUsd = await computeTotalSpentUsd();
        // Compare in selected currency to align with user's expectation
        const currency = getPreferredCurrency();
        const totalInCurrency = usdToCurrency(totalUsd, currency);
        const thresholdInCurrency = usdToCurrency(thresholdUsd, currency);
        // Show only when total strictly exceeds threshold (in USD) and the threshold hasn't been acknowledged
        const ackUsd = getNotificationAckUsd();
        const show = (Number(totalUsd) > Number(thresholdUsd)) && (Number(ackUsd) < Number(thresholdUsd));
        dots.forEach(d=> d.style.display = show ? 'inline-block' : 'none');
        // ensure notification buttons wire up to acknowledge
        try{
            const btns = Array.from(document.querySelectorAll('button'));
            btns.forEach(b=>{
                if(b.querySelector && b.querySelector('#notifDot')){
                    if(!b._notifBound){
                        b.addEventListener('click', ()=>{
                            // Acknowledge current threshold (store threshold USD)
                            setNotificationAckUsd(thresholdUsd);
                            updateNotificationDot();
                        });
                        b._notifBound = true;
                    }
                }
            });
        }catch(e){}
    }catch{}
}

export { NOTIF_ENABLED_KEY, NOTIF_THRESHOLD_KEY, DEFAULT_THRESHOLD_USD, getNotificationEnabled, setNotificationEnabled, getNotificationThresholdUsd, setNotificationThresholdUsd, updateNotificationDot };

// Profile picture helpers
function getProfileImage(){
    try { return localStorage.getItem(PROFILE_IMAGE_KEY) || ''; } catch { return ''; }
}

function setProfileImage(dataUrl){
    if(typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return;
    try { localStorage.setItem(PROFILE_IMAGE_KEY, dataUrl); } catch {}
}

function clearProfileImage(){
    try { localStorage.removeItem(PROFILE_IMAGE_KEY); } catch {}
}

function applyProfileImageToDom(){
    const url = getProfileImage();
    if(!url) return;
    try{
        const nodes = Array.from(document.querySelectorAll('[data-profile-avatar]'));
        nodes.forEach(el=>{ el.style.backgroundImage = `url("${url}")`; });
    }catch{}
}

export { PROFILE_IMAGE_KEY, getProfileImage, setProfileImage, clearProfileImage, applyProfileImageToDom };


