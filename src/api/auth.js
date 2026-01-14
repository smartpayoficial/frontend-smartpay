// auth js
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_GATEWAY_URL = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const axiosInstance = axios.create({
    baseURL: `${API_GATEWAY_URL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Función para actualizar contraseña
 * @param {string} token - Token de restablecimiento de contraseña
 * @param {string} password - Nueva contraseña
 */
export const resetPassword = async (data) => {
    try {
        const response = await axiosInstance.post(`/auth/password-reset/confirm`, data);
        return response.data;
    } catch (error) {
        console.error('Error en resetPassword:', error);
        throw error;
    }
}

/**
 * Enviar correo de restablecimiento de contraseña
 * @param {string} dni
 */
export const requestPasswordReset = async (data) => {
    try {
        const response = await axiosInstance.post(`/auth/password-reset/request`, data);
        return response.data;
    } catch (error) {
        console.error('Error en resetPassword:', error);
        throw error;
    }
}

/**
 * Función para hacer el ME del user. Cargar data del user autenticado
 */

export const getUserMe = async () => {
    try {
        const accessToken = localStorage.getItem('token');
        if (!accessToken) throw new Error('No se encontró token en localStorage');

        const decodedToken = jwtDecode(accessToken);
        const userIdFromToken = decodedToken.sub; // 'sub' es el user_id en tu JWT
        const usernameFromToken = decodedToken.username;
        const roleNameFromToken = decodedToken.role; // El nombre del rol como string (e.g., "Superadmin")

        const {data: fullUserData} = await axiosInstance.get('/users/me');

        const userForFrontend = {
            user_id: fullUserData.user_id || userIdFromToken, // Preferimos el user_id de /users/me, si no, del token
            email: fullUserData.email,
            username: fullUserData.username || usernameFromToken,
            first_name: fullUserData.first_name,
            last_name: fullUserData.last_name,
            store: fullUserData.store,
            phone: fullUserData.phone,
            name: `${fullUserData.first_name || ''} ${fullUserData.last_name || ''}`.trim(), // Nombre completo para Navbar/Sidebar
            // Asegúrate de que la propiedad 'role' del objeto `fullUserData` de /users/me
            // tenga el nombre del rol. Puede ser `fullUserData.role.name` o `fullUserData.role` directamente.
            role: (fullUserData.role && typeof fullUserData.role === 'object' && fullUserData.role.name)
                ? fullUserData.role.name
                : fullUserData.role || roleNameFromToken,
            dni: fullUserData.dni || null,
            state: fullUserData.state || null,
            // Si /users/me devuelve más campos que necesites, agrégalos aquí:
            // city_id: fullUserData.city_id,
            // phone: fullUserData.phone,
            // ...
        }
        localStorage.setItem('user', JSON.stringify(userForFrontend));
        return userForFrontend;
    } catch (error) {
        console.error('Error en get user ME:', error);
        throw error;
    }
}