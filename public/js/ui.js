// UI Components (Notifications, Profile Image)
import { getUserData, setUserData } from './state.js';
import { apiRequest, isAuthenticated } from './api.js';
import { getPreferredCurrency, currencyToUsd } from './utils.js';

// Notifications
const NOTIF_ENABLED_KEY = 'notifEnabled';
const NOTIF_THRESHOLD_KEY = 'notifThresholdUsd';
const DEFAULT_THRESHOLD_USD = 100;
const NOTIF_ACK_KEY = 'notifAckUsd';

function getNotificationEnabled(){
    return localStorage.getItem(NOTIF_ENABLED_KEY) === 'true';
}
function setNotificationEnabled(val){
    localStorage.setItem(NOTIF_ENABLED_KEY, String(!!val));
}
function getNotificationThresholdUsd(){
    const v = localStorage.getItem(NOTIF_THRESHOLD_KEY);
    return v ? Number(v) : DEFAULT_THRESHOLD_USD;
}
function setNotificationThresholdUsd(val){
    localStorage.setItem(NOTIF_THRESHOLD_KEY, String(val));
}
function getNotificationAckUsd(){
    const v = localStorage.getItem(NOTIF_ACK_KEY);
    return v ? Number(v) : 0;
}
function setNotificationAckUsd(val){
    localStorage.setItem(NOTIF_ACK_KEY, String(val));
}

function updateNotificationDot(){
    try{
        const enabled = getNotificationEnabled();
        const thresholdUsd = getNotificationThresholdUsd();
        const ackUsd = getNotificationAckUsd();
        
        // Simple logic: if threshold changed significantly since ack, show dot
        // In a real app, this would check actual spending vs threshold
        const show = enabled && (thresholdUsd !== ackUsd);
        
        const dots = document.querySelectorAll('.notification-dot');
        dots.forEach(d => {
            if(show) d.classList.remove('hidden');
            else d.classList.add('hidden');
        });

        // Bind click to clear
        try{
            const btns = document.querySelectorAll('#notificationBtn');
            btns.forEach(b=>{
                if(b.querySelector && b.querySelector('#notifDot')){
                    if(!b._notifBound){
                        b.addEventListener('click', ()=>{
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

// Profile Image
const PROFILE_IMAGE_KEY = 'profileImageDataUrl';

function getProfileImage(){
    // Try user data first
    const userData = getUserData();
    if (userData && userData.profileImage) return userData.profileImage;
    
    try { return localStorage.getItem(PROFILE_IMAGE_KEY) || ''; } catch { return ''; }
}

async function setProfileImage(dataUrl){
    if(typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return;
    
    // Save locally for immediate feedback
    try { localStorage.setItem(PROFILE_IMAGE_KEY, dataUrl); } catch {}
    
    // Sync with server
    if (isAuthenticated()) {
        try {
            await apiRequest('/api/auth/avatar', {
                method: 'POST',
                body: JSON.stringify({ image: dataUrl })
            });
            
            // Update local user data cache
            const userData = getUserData();
            if (userData) {
                userData.profileImage = dataUrl;
                setUserData(userData);
            }
        } catch (e) {
            console.error('Failed to upload profile image', e);
        }
    }
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

export { 
    NOTIF_ENABLED_KEY, NOTIF_THRESHOLD_KEY, DEFAULT_THRESHOLD_USD, 
    getNotificationEnabled, setNotificationEnabled, 
    getNotificationThresholdUsd, setNotificationThresholdUsd, 
    updateNotificationDot,
    PROFILE_IMAGE_KEY, getProfileImage, setProfileImage, 
    clearProfileImage, applyProfileImageToDom 
};
