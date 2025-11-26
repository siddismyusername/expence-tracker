import { api } from './api.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    try {
        const data = await api.auth.login({ email, password });

        if (data.token) {
            localStorage.setItem('token', data.token);
            window.location.href = '/dashboard.html';
        } else {
            throw new Error(data.msg || 'Login failed');
        }
    } catch (err) {
        errorMessage.textContent = err.message;
        errorMessage.classList.remove('hidden');
    }
});
