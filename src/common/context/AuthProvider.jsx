// src/context/AuthProvider.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getUserMe } from '../../api/auth';

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_BASE_URL + '/api/v1';

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem('user');
            // Intentar parsear el usuario almacenado. Si no existe o hay un error, inicializar a null.
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error("Error parsing stored user from localStorage:", error);
            return null;
        }
    });
    const navigate = useNavigate();

    // Esta función se encarga de hacer la llamada a /users/me
    // y de construir el objeto 'user' que se almacenará en el estado y localStorage.
    const fetchAndSetFullUserData = useCallback(async (accessToken) => {
        if (!accessToken) {
            // Si no hay token, no hay usuario. Limpiamos todo.
            setUser(null);
            localStorage.removeItem('user');
            return;
        }

        try {
            // Decodificar el token para obtener datos básicos como user_id, username y role.
            // Aunque /users/me debería devolverlos, tenerlos del token es un fallback o una forma rápida.
            // const decodedToken = jwtDecode(accessToken);
            // const userIdFromToken = decodedToken.sub; // 'sub' es el user_id en tu JWT
            // const usernameFromToken = decodedToken.username;
            // const roleNameFromToken = decodedToken.role; // El nombre del rol como string (e.g., "Superadmin")

            // *** SEGUNDA LLAMADA A LA API ***
            // Hacemos una petición GET a /users/me usando el token recién obtenido.
            // Esta llamada es la que trae el resto de los detalles del usuario (first_name, last_name, email, dni, etc.).
            // const userResponse = await axios.get(`${API_BASE_URL}/users/me`, {
            //     headers: {
            //         Authorization: `Bearer ${accessToken}` // ¡Muy importante! Enviar el token para autenticación
            //     }
            // });
            

            // const fullUserData = userResponse.data; // Aquí recibimos los datos completos del usuario desde /users/me

            // Construimos el objeto 'user' final que usará el frontend.
            // Combinamos los datos del token con los datos de /users/me.
            localStorage.removeItem('paymentFlowState');
            const userForFrontend = await getUserMe()

            // Actualizamos el estado 'user' en el contexto y persistimos en localStorage
            setUser(userForFrontend);
            // localStorage.setItem('user', JSON.stringify(userForFrontend));

        } catch (error) {
            console.error("Error fetching full user details or decoding token:", error.response?.data || error.message);
            // Si la llamada a /users/me falla (ej. token inválido o expirado), limpiamos la sesión
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization']; // Elimina el header de Axios
            navigate('/login'); // Redirige al usuario a la página de login
        }
    }, [navigate]);

    // Este useEffect se ejecuta cuando 'token' o 'user' cambian.
    // Es crucial para configurar el header de autorización de Axios globalmente
    // y para recargar los datos del usuario si el token está presente pero el 'user' no (ej. al recargar la página).
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // Si tenemos un token pero no el objeto 'user' completo (ej. después de una recarga del navegador),
            // llamamos a la función para obtener los detalles del usuario.
            if (!user) {
                fetchAndSetFullUserData(token);
            }
        } else {
            // Si no hay token, nos aseguramos de que no haya un header de autorización
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token, user, fetchAndSetFullUserData]); // Dependencias: re-ejecuta si estos valores cambian

    // Función de login que orquesta las dos llamadas
    const login = async (username, password) => {
        try {
            // *** PRIMERA LLAMADA A LA API (LOGIN) ***
            // Esta llamada solo devuelve el token de acceso y el refresh token.

            // 1. Crear un objeto URLSearchParams para codificar los datos como 'x-www-form-urlencoded'
            const params = new URLSearchParams();
            params.append('username', username);
            params.append('password', password);
            params.append('grant_type', 'password'); // ¡MUY IMPORTANTE para OAuth2PasswordRequestForm!

            // 2. Realizar la petición POST con los parámetros y el header correcto
            const response = await axios.post(`${API_BASE_URL}/auth/login`, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const { access_token, refresh_token } = response.data;

            // Guardamos el token en el estado y en localStorage.
            setToken(access_token);
            localStorage.setItem('token', access_token);

            // ... (resto de tu función login, que parece correcta) ...

            // *** DISPARAR LA SEGUNDA LLAMADA ***
            await fetchAndSetFullUserData(access_token);

            // Si todo fue bien, redirigimos al dashboard.
            console.log("Login successful, redirecting to dashboard..." );
            
            navigate('/dashboard');

        } catch (error) {
            console.error("Login failed:", error.response?.data || error.message);
            // ... (manejo de error) ...
            throw error;
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization']; // Limpia también el header de Axios
        localStorage.removeItem('paymentFlowState'); //Limpiar la persistencia de venta en proceso
        

        navigate('/login');
    };

    // Función de prueba para cambiar el rol (solo para desarrollo, no afecta permisos reales)
    const testChangeRole = useCallback((newRole) => {
        if (user) {
            setUser(prevUser => ({ ...prevUser, role: newRole }));
            // Opcional: Persistir este cambio de rol de prueba en localStorage para que persista al recargar
            // localStorage.setItem('user', JSON.stringify({ ...user, role: newRole }));
        }
    }, [user]);

    const value = {
        token,
        user,
        login,
        logout,
        testChangeRole
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};