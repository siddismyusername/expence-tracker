import { api } from './api.js';

const navbarHtml = `
<nav class="bg-app-card">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
            <div class="flex">
                <div class="flex-shrink-0 flex items-center">
                    <a href="/" class="text-xl font-bold text-primary">FinTrack</a>
                </div>
                <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <a href="/dashboard.html" class="border-transparent text-muted-foreground-light dark:text-muted-foreground-dark hover:border-primary hover:text-app-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">Dashboard</a>
                    <a href="/expenses.html" class="border-transparent text-muted-foreground-light dark:text-muted-foreground-dark hover:border-primary hover:text-app-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">Expenses</a>
                    <a href="/add-expense.html" class="border-transparent text-muted-foreground-light dark:text-muted-foreground-dark hover:border-primary hover:text-app-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">Add Expense</a>
                </div>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:items-center gap-4">
                <!-- Dark Mode Toggle -->
                <button id="theme-toggle" type="button" class="text-muted-foreground-light dark:text-muted-foreground-dark hover:text-app-foreground focus:outline-none transition-colors">
                    <span class="material-symbols-outlined" id="theme-icon">light_mode</span>
                </button>

                <div class="ml-3 relative">
                    <div>
                        <button type="button" class="bg-app-input flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" id="user-menu-button" aria-expanded="false" aria-haspopup="true">
                            <span class="sr-only">Open user menu</span>
                            <img class="h-8 w-8 rounded-full" src="https://ui-avatars.com/api/?name=User&background=random" alt="" id="navProfileImage">
                        </button>
                    </div>
                    <!-- Dropdown menu -->
                    <div class="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-app-card ring-1 ring-black ring-opacity-5 focus:outline-none z-50" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1" id="user-menu">
                        <a href="/settings.html" class="block px-4 py-2 text-sm text-app-foreground hover:bg-app-input transition-colors" role="menuitem" tabindex="-1" id="user-menu-item-0">Settings</a>
                        <a href="#" class="block px-4 py-2 text-sm text-app-foreground hover:bg-app-input transition-colors" role="menuitem" tabindex="-1" id="logout-button">Sign out</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</nav>
`;

// Inject Navbar
const navbarPlaceholder = document.querySelector('div[id^="navbar"]'); // Matches navbar-placeholder or navbarContainer
if (navbarPlaceholder) {
    navbarPlaceholder.innerHTML = navbarHtml;
} else {
    // Fallback if no placeholder found, prepend to body
    const navDiv = document.createElement('div');
    navDiv.innerHTML = navbarHtml;
    document.body.prepend(navDiv);
}

// Theme Toggle Logic
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const html = document.documentElement;

// Check saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
    themeIcon.textContent = 'dark_mode'; // Show moon icon when in dark mode? Or sun? Usually sun to switch to light.
    // Let's stick to: Icon shows current state or target state?
    // Material symbols: light_mode (sun), dark_mode (moon).
    // If dark, show light_mode (to switch to light). If light, show dark_mode.
    themeIcon.textContent = 'light_mode';
} else {
    html.classList.remove('dark');
    themeIcon.textContent = 'dark_mode';
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            themeIcon.textContent = 'dark_mode';
        } else {
            html.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            themeIcon.textContent = 'light_mode';
        }
    });
}

// User Menu Toggle
const userMenuButton = document.getElementById('user-menu-button');
const userMenu = document.getElementById('user-menu');

if (userMenuButton && userMenu) {
    userMenuButton.addEventListener('click', () => {
        userMenu.classList.toggle('hidden');
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!userMenuButton.contains(e.target) && !userMenu.contains(e.target)) {
            userMenu.classList.add('hidden');
        }
    });
}

// Logout
const logoutBtn = document.getElementById('logout-button');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });
}

// Check Auth
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login.html';
} else {
    // Fetch user to update profile image
    api.auth.me().then(user => {
        const navImg = document.getElementById('navProfileImage');
        if (navImg && user.profilePicture) {
            navImg.src = user.profilePicture;
        }
    }).catch(() => {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });
}
