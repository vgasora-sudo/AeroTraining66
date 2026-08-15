// src/services/auth.js
import api from './api';

const TOKEN_KEY = 'aerotraining_token';
const USER_KEY = 'aerotraining_user';

export const authService = {
    async login(username, password) {
        try {
            const response = await api.post('/api/login', { username, password });
            if (response.data.success) {
                localStorage.setItem(TOKEN_KEY, response.data.token);
                localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Error de conexión con el servidor'
            };
        }
    },

    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    isAuthenticated() {
        return !!localStorage.getItem(TOKEN_KEY);
    },

    getCurrentUser() {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    isAdmin() {
        const user = this.getCurrentUser();
        return user?.is_admin === true;
    }
};