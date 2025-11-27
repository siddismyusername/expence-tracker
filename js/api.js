const API_URL = '/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'x-auth-token': token
    };
};

export const api = {
    auth: {
        register: async (data) => {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return res.json();
        },
        login: async (data) => {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return res.json();
        },
        me: async () => {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Not authenticated');
            return res.json();
        },
        updateProfile: async (data) => {
            const res = await fetch(`${API_URL}/auth/update`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update profile');
            return res.json();
        }
    },
    family: {
        details: async () => {
            const res = await fetch(`${API_URL}/family`, {
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to load family details');
            return res.json();
        },
        create: async (data) => {
            const res = await fetch(`${API_URL}/family/create`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return res.json();
        },
        join: async (data) => {
            const res = await fetch(`${API_URL}/family/join`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return res.json();
        },
        leave: async () => {
            const res = await fetch(`${API_URL}/family/leave`, {
                method: 'POST',
                headers: getHeaders()
            });
            return res.json();
        },
        members: async () => {
            const res = await fetch(`${API_URL}/family/members`, {
                headers: getHeaders()
            });
            return res.json();
        }
    },
    expenses: {
        add: async (data) => {
            const res = await fetch(`${API_URL}/expenses`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return res.json();
        },
        list: async (filters = {}) => {
            const params = new URLSearchParams(filters).toString();
            const res = await fetch(`${API_URL}/expenses?${params}`, {
                headers: getHeaders()
            });
            return res.json();
        },
        delete: async (id) => {
            const res = await fetch(`${API_URL}/expenses/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return res.json();
        }
    }
};
