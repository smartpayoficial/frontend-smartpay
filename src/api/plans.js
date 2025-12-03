// src/api/plans.js
import axios from 'axios';
import { getCurrentStoreId } from '../common/utils/helpers';
import axiosInstance from '../common/utils/interceptor-store';

// La URL base de tu API, tomada de las variables de entorno de Vite
// const API_GATEWAY_URL = import.meta.env.VITE_REACT_APP_API_BASE_URL;

// // Crear una instancia de Axios con la URL base de tu API Gateway
// const axiosInstance = axios.create({
//     baseURL: `${API_GATEWAY_URL}/api/v1`, // Asume que los endpoints de planes están bajo /api/v1
//     // headers: {
//     //     'Content-Type': 'application/json',
//     // },
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

// --- FUNCIONES PARA PLANES DE PAGO ---

/**
 * Crea un nuevo plan de pago.
 * @param {object} planData - Datos del plan de pago.
 * @returns {Promise<object>} La respuesta de la API que incluye el plan creado.
 */
export const createPlan = async (planData) => {
    try {
        const response = await axiosInstance.post('/plans/', planData); // Endpoint POST /plans/
        return response.data;
    } catch (error) {
        console.error('Error al crear plan de pago:', error.response?.data || error.message);
        console.error('Detalle del error del plan:', error.response?.data?.detail);
        throw error;
    }
};

/**
 * Obtiene una lista de todos los planes de pago.
 * @param {object} [params={}] - Parámetros de consulta opcionales.
 * @returns {Promise<Array<object>>} Una lista de planes de pago.
 */
export const getPlans = async (params = {}) => {
    try {
        const storeId = getCurrentStoreId();
        if (storeId) params.store_id = storeId;

        const response = await axiosInstance.get('/plans/', { params: params });
        return response.data;
    } catch (error) {
        console.error('Error al obtener planes de pago:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Obtiene un plan de pago por su ID.
 * @param {string} planId - El ID del plan de pago.
 * @returns {Promise<object>} El plan de pago.
 */
export const getPlanById = async (planId) => {
    try {
        const response = await axiosInstance.get(`/plans/${planId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener plan de pago con ID ${planId}:`, error.response?.data || error.message);
        throw error;
    }
};

/**
 * Obtiene un plan de pago por su ID.
 * @param {string} deviceId - El ID del dispositivo.
 * @returns {Promise<object>} El plan de pago.
 */
export const getPlanByDeviceId = async (isDevice, id) => {
    try {

        const params = isDevice
            ? { device_id: id }
            : { television_id: id };
        const response = await axiosInstance.get(`/plans/`, { params });
        if (Array.isArray(response.data)) {
            return response.data[0]
        }
        return null
    } catch (error) {
        console.error(`Error al obtener plan de pago con ID ${planId}:`, error.response?.data || error.message);
        throw error;
    }
};


/**
 * Actualiza parcialmente un plan de pago.
 * @param {string} planId - El ID del plan de pago a actualizar.
 * @param {object} planData - Los datos a actualizar.
 * @returns {Promise<object>} El plan de pago actualizado.
 */
export const updatePlan = async (planId, planData) => {
    try {
        const response = await axiosInstance.patch(`/plans/${planId}`, planData);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar plan de pago con ID ${planId}:`, error.response?.data || error.message);
        throw error;
    }
};

/**
 * Elimina un plan de pago por su ID.
 * @param {string} planId - El ID del plan de pago a eliminar.
 * @returns {Promise<object>} La respuesta de la API.
 */
export const deletePlan = async (planId) => {
    try {
        const response = await axiosInstance.delete(`/plans/${planId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al eliminar plan de pago con ID ${planId}:`, error.response?.data || error.message);
        throw error;
    }
};

/**
 * Metodo para cargar contrato
 */
export const uploadContract = async (data) => {
    try {
        const response = await axiosInstance.post(`/plans/upload-pdf/`, data);
        return response.data; //blob pdf
    } catch (error) {
        console.error(`Error al subir el contrato:`, error.response?.data || error.message);
        throw error;
    }
};

/**
 * Metodo para descargar contrato
 */
export const downloadContract = async (planId) => {
    try {
        const response = await axiosInstance.get(`/plans/download-pdf/${planId}`, {
            responseType: 'blob',
        });
        return response.data; //blob pdf
    } catch (error) {
        console.error(`Error al descargar contrato con ID ${planId}:`, error.response?.data || error.message);
        throw error;
    }
};
