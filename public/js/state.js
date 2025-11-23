// State Management (User Session, View Mode)
const USER_DATA_KEY = 'userData';
const VIEW_MODE_KEY = 'viewMode';
const VIEW_MODES = { PERSONAL: 'personal', FAMILY: 'family' };

function getUserData(){
    try { return JSON.parse(localStorage.getItem(USER_DATA_KEY)); }
    catch { return null; }
}

function setUserData(data){
    if(data) localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
    else localStorage.removeItem(USER_DATA_KEY);
}

function getViewMode(){
    return localStorage.getItem(VIEW_MODE_KEY) || VIEW_MODES.PERSONAL;
}

function setViewMode(mode){
    if(Object.values(VIEW_MODES).includes(mode)){
        localStorage.setItem(VIEW_MODE_KEY, mode);
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('viewModeChanged', { detail: mode }));
    }
}

function isPersonalMode(){ return getViewMode() === VIEW_MODES.PERSONAL; }
function isFamilyMode(){ return getViewMode() === VIEW_MODES.FAMILY; }

export { 
    USER_DATA_KEY, VIEW_MODE_KEY, VIEW_MODES, 
    getUserData, setUserData, getViewMode, setViewMode, 
    isPersonalMode, isFamilyMode 
};
