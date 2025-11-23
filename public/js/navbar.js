import { getViewMode, setViewMode, VIEW_MODES, getUserData, isAuthenticated, logout, getProfileImage } from './shared.js';

function createNavbar() {
    const userData = getUserData();
    const hasFamilyAccess = userData && userData.familyId;
    const currentMode = getViewMode();
    const profileImg = getProfileImage() || "https://lh3.googleusercontent.com/aida-public/AB6AXuDSPjC3zAh7P5fDaGvew9B6Q0_TFQ4GthU4w_H7MMsDGodQjfRKr-swoexNkpyWBEVDGWBkEXjuI8OhIh5RW_Hvgn60p9m085v8cslVBpmoG4Qtc4KyMGpEDU_C1h2ISdquJNMqhxYewSHaF9LMFEZj6QXptUOuZ2lhIW8yln_F-tG6ofBMfqSYWXfDg0VratBzW7VBVk7OLA2y4WAVe4V1hS8u7C8n7h0cZcUr7vMNk-Pmfphvk9JFjJLU2bbkbZQ5lAMyPmpC8odk";

    const header = document.createElement('header');
    header.className = "sticky top-0 z-10 bg-app-nav backdrop-blur-sm shadow-md transition-all duration-200";
    
    header.innerHTML = `
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-3 items-center gap-4 h-16">
        
        <!-- Logo and App Name -->
        <div class="flex items-center gap-3 flex-shrink-0">
            <div class="w-8 h-8 text-blue-600 dark:text-blue-500">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.263 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z" fill="currentColor"></path>
                <path clip-rule="evenodd" d="M10.4485 13.8519C10.4749 13.9271 10.6203 14.246 11.379 14.7361C12.298 15.3298 13.7492 15.9145 15.6717 16.3735C18.0007 16.9296 20.8712 17.2655 24 17.2655C27.1288 17.2655 29.9993 16.9296 32.3283 16.3735C34.2508 15.9145 35.702 15.3298 36.621 14.7361C37.3796 14.246 37.5251 13.9271 37.5515 13.8519C37.5287 13.7876 37.4333 13.5973 37.0635 13.2931C36.5266 12.8516 35.6288 12.3647 34.343 11.9175C31.79 11.0295 28.1333 10.4437 24 10.4437C19.8667 10.4437 16.2099 11.0295 13.657 11.9175C12.3712 12.3647 11.4734 12.8516 10.9365 13.2931C10.5667 13.5973 10.4713 13.7876 10.4485 13.8519ZM37.5563 18.7877C36.3176 19.3925 34.8502 19.8839 33.2571 20.2642C30.5836 20.9025 27.3973 21.2655 24 21.2655C20.6027 21.2655 17.4164 20.9025 14.7429 20.2642C13.1498 19.8839 11.6824 19.3925 10.4436 18.7877V34.1275C10.4515 34.1545 10.5427 34.4867 11.379 35.027C12.298 35.6207 13.7492 36.2054 15.6717 36.6644C18.0007 37.2205 20.8712 37.5564 24 37.5564C27.1288 37.5564 29.9993 37.2205 32.3283 36.6644C34.2508 36.2054 35.702 35.6207 36.621 35.027C37.4573 34.4867 37.5485 34.1546 37.5563 34.1275V18.7877ZM41.5563 13.8546V34.1455C41.5563 36.1078 40.158 37.5042 38.7915 38.3869C37.3498 39.3182 35.4192 40.0389 33.2571 40.5551C30.5836 41.1934 27.3973 41.5564 24 41.5564C20.6027 41.5564 17.4164 41.1934 14.7429 40.5551C12.5808 40.0389 10.6502 39.3182 9.20848 38.3869C7.84205 37.5042 6.44365 36.1078 6.44365 34.1455L6.44365 13.8546C6.44365 12.2684 7.37223 11.0454 8.39581 10.2036C9.43325 9.3505 10.8137 8.67141 12.343 8.13948C15.4203 7.06909 19.5418 6.44366 24 6.44366C28.4582 6.44366 32.5797 7.06909 35.657 8.13948C37.1863 8.67141 38.5667 9.3505 39.6042 10.2036C40.6278 11.0454 41.5563 12.2684 41.5563 13.8546Z" fill="currentColor" fill-rule="evenodd"></path>
            </svg>
            </div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">FinTrack</h1>
            <!-- Toggle removed as per new requirements -->
        </div>

        <!-- Navigation (centered) -->
        <nav class="hidden md:flex justify-center items-center gap-8">
            <a class="text-sm font-medium text-app-muted hover:text-app-primary transition-colors" href="/pages/dashboard.html">Dashboard</a>
            <a class="text-sm font-medium text-app-muted hover:text-app-primary transition-colors" href="/pages/expenses.html">Expenses</a>
            <a class="text-sm font-medium text-app-muted hover:text-app-primary transition-colors" href="/pages/add-expense.html">Add Expense</a>
        </nav>

        <!-- Profile + Notification -->
        <div class="flex items-center gap-3 flex-shrink-0 justify-end">
            <button id="themeToggle" class="flex items-center justify-center size-10 rounded-full transition-colors text-app-muted hover:text-app-foreground hover:bg-app-input" aria-label="Toggle theme">
            <span class="material-symbols-outlined" id="themeIcon">dark_mode</span>
            </button>
            <button class="relative flex items-center justify-center size-10 rounded-full transition-colors text-app-muted hover:text-app-foreground hover:bg-app-input">
            <span class="material-symbols-outlined">notifications</span>
            <span id="notifDot" style="display:none" class="absolute top-1.5 right-1.5 inline-block size-2 rounded-full bg-red-500"></span>
            </button>
            <div class="relative h-10">
                <button id="profileBtn" aria-haspopup="menu" aria-expanded="false" class="w-10 h-10 bg-center bg-cover rounded-full border-2 border-transparent transition-all focus-ring" style='background-image: url("${profileImg}");'></button>
                <!-- Accessible Dropdown Menu -->
                <div id="profileMenu" class="absolute right-0 top-full mt-2 w-48 hidden bg-app-card border border-app rounded-md shadow-lg py-1" role="menu" aria-label="Profile menu">
                        <a href="/pages/settings.html" role="menuitem" tabindex="-1" class="block px-4 py-2 text-sm text-app-foreground hover:bg-app-input rounded">Settings</a>
                        <button id="logoutBtn" role="menuitem" tabindex="-1" class="block w-full text-left px-4 py-2 text-sm text-app-foreground hover:bg-app-input rounded">Logout</button>
                </div>
            </div>
        </div>

        </div>
    </div>
    `;

    return header;
}

function initNavbar() {
    const navbar = createNavbar();
    // Insert at the beginning of body
    if (document.body.firstChild) {
        document.body.insertBefore(navbar, document.body.firstChild);
    } else {
        document.body.appendChild(navbar);
    }

    // Theme Toggle Logic
    const root = document.documentElement;
    const stored = localStorage.getItem('theme');
    if(stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)){
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    const btn = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');
    function syncIcon(){ if(icon) icon.textContent = root.classList.contains('dark') ? 'light_mode' : 'dark_mode'; }
    syncIcon();
    btn?.addEventListener('click', ()=>{
        root.classList.toggle('dark');
        localStorage.setItem('theme', root.classList.contains('dark') ? 'dark' : 'light');
        syncIcon();
    });

    // Active Link Logic
    const nav = navbar.querySelector('nav');
    if(nav) {
        const currentPath = location.pathname || '/';
        nav.querySelectorAll('a').forEach(a=>{
            a.classList.remove('text-app-primary','font-bold');
            if(a.getAttribute('href') === currentPath){
                a.classList.add('text-app-primary','font-bold');
                a.setAttribute('aria-current','page');
            }else{
                a.removeAttribute('aria-current');
            }
        });
    }

    // View Mode Toggle Logic
    const personalBtn = document.getElementById('personalBtn');
    const familyBtn = document.getElementById('familyBtn');
    const radios = [personalBtn, familyBtn].filter(Boolean);
    function activate(btn){
        if(!btn) return;
        radios.forEach(r=>{
            const isActive = r === btn;
            r.setAttribute('aria-checked', isActive);
            r.dataset.state = isActive ? 'checked' : 'unchecked';
        });
        const val = btn.dataset.value;
        if(val === 'personal') setViewMode(VIEW_MODES.PERSONAL);
        else if(val === 'family') setViewMode(VIEW_MODES.FAMILY);
        window.location.reload();
    }
    radios.forEach(r=>{
        r.addEventListener('click', ()=> activate(r));
        r.addEventListener('keydown', (e)=>{
            if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){
                e.preventDefault();
                let idx = radios.indexOf(r);
                if(e.key === 'ArrowRight') idx = (idx + 1) % radios.length;
                else if(e.key === 'ArrowLeft') idx = (idx - 1 + radios.length) % radios.length;
                else if(e.key === 'Home') idx = 0;
                else if(e.key === 'End') idx = radios.length - 1;
                radios[idx].focus();
                activate(radios[idx]);
            } else if(e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                activate(r);
            }
        });
    });

    // Logout Logic
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Profile dropdown accessibility & interactions
    const profileBtn = document.getElementById('profileBtn');
    const profileMenu = document.getElementById('profileMenu');
    if(profileBtn && profileMenu){
        const menuItems = Array.from(profileMenu.querySelectorAll('[role="menuitem"]'));
        function openMenu(){
            profileMenu.classList.remove('hidden');
            profileBtn.setAttribute('aria-expanded','true');
        }
        function closeMenu(){
            profileMenu.classList.add('hidden');
            profileBtn.setAttribute('aria-expanded','false');
        }
        function toggleMenu(){
            const expanded = profileBtn.getAttribute('aria-expanded') === 'true';
            expanded ? closeMenu() : openMenu();
            if(!expanded){
                // focus first item
                setTimeout(()=> menuItems[0]?.focus(), 0);
            }
        }
        profileBtn.addEventListener('click', (e)=>{
            e.stopPropagation();
            toggleMenu();
        });
        profileBtn.addEventListener('keydown', (e)=>{
            if(e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' '){
                e.preventDefault();
                if(profileBtn.getAttribute('aria-expanded') !== 'true') openMenu();
                setTimeout(()=> menuItems[0]?.focus(), 0);
            }
        });
        menuItems.forEach((item, idx)=>{
            item.addEventListener('keydown',(e)=>{
                if(e.key === 'Escape'){
                    e.preventDefault();
                    closeMenu();
                    profileBtn.focus();
                } else if(e.key === 'ArrowDown'){
                    e.preventDefault();
                    const next = menuItems[(idx+1)%menuItems.length];
                    next.focus();
                } else if(e.key === 'ArrowUp'){
                    e.preventDefault();
                    const prev = menuItems[(idx-1+menuItems.length)%menuItems.length];
                    prev.focus();
                } else if(e.key === 'Home'){
                    e.preventDefault();
                    menuItems[0].focus();
                } else if(e.key === 'End'){
                    e.preventDefault();
                    menuItems[menuItems.length-1].focus();
                }
            });
        });
        document.addEventListener('click',(e)=>{
            if(profileBtn.contains(e.target) || profileMenu.contains(e.target)) return;
            closeMenu();
        });
        document.addEventListener('keydown',(e)=>{
            if(e.key === 'Escape' && profileBtn.getAttribute('aria-expanded') === 'true'){
                closeMenu();
                profileBtn.focus();
            }
        });
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavbar);
} else {
  initNavbar();
}

export { createNavbar, initNavbar };
