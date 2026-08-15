// src/services/authService.js
import config from '../config';

const TOKEN_KEY = 'aerotraining_token';
const USER_KEY = 'aerotraining_user';

export const authService = {
    // Login
    async login(username, password) {
        const response = await fetch(`${config.API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        if (data.success) {
            localStorage.setItem(TOKEN_KEY, data.token);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
        return data;
    },

    // Logout
    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    // Verificar si está autenticado
    isAuthenticated() {
        return !!localStorage.getItem(TOKEN_KEY);
    },

    // Obtener usuario actual
    getCurrentUser() {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    // Obtener token
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    // Headers para peticiones autenticadas
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.getToken()}`,
            'Content-Type': 'application/json'
        };
    }
};