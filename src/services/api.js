// src/services/api.js
import axios from 'axios';
import { API } from '../config';

const api = axios.create({
    baseURL: API.baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Interceptor para añadir token a todas las peticiones
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('aerotraining_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('aerotraining_token');
            localStorage.removeItem('aerotraining_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;