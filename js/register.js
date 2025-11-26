import { api } from './api.js';

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    try {
        const data = await api.auth.register({ name, email, password });

        if (data.token) {
            localStorage.setItem('token', data.token);
            window.location.href = '/dashboard.html';
        } else {
            throw new Error(data.msg || 'Registration failed');
        }
    } catch (err) {
        errorMessage.textContent = err.message;
        errorMessage.classList.remove('hidden');
    }
});
