// src/api/payments.js
import axios from 'axios';
import { getCurrentStoreId } from '../common/utils/helpers';
import axiosInstance from '../common/utils/interceptor-store';

// // La URL base de tu API, tomada de las variables de entorno de Vite
// const API_GATEWAY_URL = import.meta.env.VITE_REACT_APP_API_BASE_URL;

// // Crear una instancia de Axios con la URL base de tu API Gateway
// const axiosInstance = axios.create({
//     baseURL: `${API_GATEWAY_URL}/api/v1`, // Asume que los endpoints de pagos están bajo /api/v1/payments
//     headers: {
//         'Content-Type': 'application/json',
//     },
// });

// // Interceptor para agregar el token de autorización
// axiosInstance.interceptors.request.use(
//     (config) => {
//         const token = localStorage.getItem('token');
//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     },
//     (error) => {
//         return Promise.reject(error);
//     }
// );

// --- FUNCIONES PARA PAGOS ---

/**
 * Crea un nuevo pago.
 * @param {object} paymentData - Datos del pago.
 * @returns {Promise<object>} La respuesta de la API que incluye el pago creado.
 */
export const createPayment = async (paymentData) => {
    try {
        console.error("Payment", paymentData);
        // Según tu Swagger/OpenAPI, el endpoint para crear pagos es POST /api/v1/payments/payments
        const response = await axiosInstance.post('/payments/', paymentData);
        return response.data;
    } catch (error) {
        console.error('Error al crear pago:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Obtiene una lista de pagos.
 * @param {object} [params={}] - Parámetros de consulta opcionales.
 * @returns {Promise<Array<object>>} Una lista de pagos.
 */
export const getPayments = async (params = {}) => {
    try {
        const storeId = getCurrentStoreId();
        if (storeId) params.store_id = storeId;

        const response = await axiosInstance.get('/payments/', { params }); // Endpoint GET /payments/payments
        return response.data;
    } catch (error) {
        console.error('Error al obtener pagos:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Obtiene un pago por su ID.
 * @param {string} paymentId - El ID del pago.
 * @returns {Promise<object>} El pago.
 */
export const getPaymentById = async (paymentId) => {
    try {
        const response = await axiosInstance.get(`/payments/${paymentId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener pago con ID ${paymentId}:`, error.response?.data || error.message);
        throw error;
    }
};

/**
 * Actualiza parcialmente un pago.
 * @param {string} paymentId - El ID del pago a actualizar.
 * @param {object} paymentData - Los datos a actualizar.
 * @returns {Promise<object>} El pago actualizado.
 */
export const updatePayment = async (paymentId, paymentData) => {
    try {
        const response = await axiosInstance.patch(`/payments/${paymentId}`, paymentData);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar pago con ID ${paymentId}:`, error.response?.data || error.message);
        throw error;
    }
};

/**
 * Elimina un pago por su ID.
 * @param {string} paymentId - El ID del pago a eliminar.
 * @returns {Promise<object>} La respuesta de la API.
 */
export const deletePayment = async (paymentId) => {
    try {
        const response = await axiosInstance.delete(`/payments/${paymentId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al eliminar pago con ID ${paymentId}:`, error.response?.data || error.message);
        throw error;
    }
};