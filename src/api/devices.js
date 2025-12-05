// src/api/devices.js
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_GATEWAY_URL = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const axiosInstance = axios.create({
    baseURL: `${API_GATEWAY_URL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar el token de autorización
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

const getUserId = () => {
    const token =  localStorage.getItem('token')
    const decodedToken = jwtDecode(token);
    return decodedToken.sub;
}

// --- NUEVA FUNCIÓN PARA CREAR DISPOSITIVO ---
/**
 * Crea un nuevo dispositivo.
 * @param {object} deviceData - Datos del dispositivo (e.g., { name: '...', imei: '...', enrolment_id: '...' }).
 * @returns {Promise<object>} La respuesta de la API que incluye el dispositivo creado.
 */
export const createDevice = async (deviceData) => {
    try {
        const response = await axiosInstance.post('/devices/', deviceData); // Endpoint POST /devices/
        return response.data;
    } catch (error) {
        console.error('Error al crear dispositivo:', error.response?.data || error.message);
        throw error;
    }
};

export const getDevices = async (params = {}) => {
    try {
        const response = await axiosInstance.get('/devices/', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching devices:', error);
        throw error;
    }
};

export const getActionsHistory = async (isDevice, id) => {
    try {
        const params = isDevice
            ? { device_id: id }
            : { television_id: id };

        const response = await axiosInstance.get(`/actions/`, {params});
        return response.data;
    } catch (error) {
        console.error('Error fetching actions:', error);
        return null;
    }
};

export const getSims = async (deviceId) => {
    try {
        const response = await axiosInstance.get(`/sims/by-device/${deviceId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching actions:', error);
        return null;
    }
};

export const getDeviceById = async (deviceId) => {
    try {
        const response = await axiosInstance.get(`/devices/${deviceId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching device with ID ${deviceId}:`, error);
        throw error;
    }
};


export const getLastLocation = async (isDevice, id) => {
    try {
        const params = isDevice
            ? { device_id: id }
            : { television_id: id };

        const response = await axiosInstance.get(`/devices/locations/`, { params });
        const data = response.data;

        if (Array.isArray(data) && data.length > 0) {
            return data[0];
        }
        return null;
    } catch (error) {
        console.error(`Error fetching location with ID ${deviceId}:`, error);
        return null;
    }
};

// --- FUNCIÓN PARA ACTUALIZAR DISPOSITIVO ---
export const updateDevice = async (deviceId, deviceData) => {
    try {
        const userId = getUserId();

        const data = {
            ...deviceData,
            applied_by_id: userId
        }

        console.log('New data', data)
        const response = await axiosInstance.patch(`/devices/${deviceId}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating device with ID ${deviceId}:`, error);
        throw error;
    }
};

// Funciones para acciones específicas
export const blockDevice = async (deviceId, isTelevision) => {
    try {
        const userId = getUserId();

        const data = {
            applied_by_id: userId,
            isTelevision: isTelevision,
            payload: null
        };

        console.log("Sending block request with data:", data);
        const response = await axiosInstance.post(`/device-actions/${deviceId}/block`, data);
        return response.data;
    } catch (error) {
        console.error(`Error blocking device with ID ${deviceId}:`, error);
        throw error;
    }
};

export const deleteDevice = async (deviceId, isTelevision) => {
    try {
        console.log("Sending Delete Device");
        if (!isTelevision) {
            const response = await axiosInstance.delete(`/devices/${deviceId}`);
            return response.data;
        } else {
            const response = await axiosInstance.delete(`/televisions/${deviceId}`);
            return response.data;   
        }
    } catch (error) {
        console.error(`Error blocking device with ID ${deviceId}:`, error);
        throw error;
    }
};

export const unblockDevice = async (deviceId, params, isTelevision) => {
    try {
        const userId = getUserId();

        const data = {
            applied_by_id: userId,
            isTelevision: isTelevision,
            payload: {
                ...params
            }
        };

        console.log("Aqui", data);
        const response = await axiosInstance.post(`/device-actions/${deviceId}/unblock`, data);
        return response.data;
    } catch (error) {
        console.error(`Error unblocking device with ID ${deviceId}:`, error);
        throw error;
    }
};

export const locateDevice = async (deviceId, isTelevision) => {
    try {
        const userId = getUserId();

        const data = {
            applied_by_id: userId,
            isTelevision: isTelevision,
            payload: null
        };

        console.error(`Device ${deviceId}:`, data);
        const response = await axiosInstance.post(`/device-actions/${deviceId}/locate`, data);
        return response.data;
    } catch (error) {
        console.error(`Error locating device with ID ${deviceId}:`, error);
        throw error;
    }
};

export const releaseDevice = async (deviceId, isTelevision) => {
    try {
        const userId = getUserId();

        const data = {
            applied_by_id: userId,
            isTelevision: isTelevision,
            payload: null
        };

        const response = await axiosInstance.post(`/device-actions/${deviceId}/unenroll`, data);
        return response.data;
    } catch (error) {
        console.error(`Error releasing device with ID ${deviceId}:`, error);
        throw error;
    }
};

// --- NUEVAS FUNCIONES PARA LA GESTIÓN DE SIMS ---
export const approveDeviceSim = async (deviceId, simId) => {
    try {
        const data = {
            state: "Active"
        };
        const response = await axiosInstance.patch(`/sims/${simId}`, data);

        const userId = getUserId();

        const actionData = {
            applied_by_id: userId,
            payload: {
                sim_id: simId
            }
        };

        await axiosInstance.post(`/device-actions/${deviceId}/unblock_sim`, actionData);
        return response.data;
    } catch (error) {
        console.error(`Error approving SIM ${simId} for device ${deviceId}:`, error);
        throw error;
    }
};

export const removeDeviceSim = async (deviceId, simId) => {
    try {
         const data = {
            state: "Inactive"
        };
        
        const response = await axiosInstance.patch(`/sims/${simId}`, data);
        
        const userId = getUserId();

        const actionData = {
            applied_by_id: userId,
            payload: {
                sim_id: simId
            }
        };
        await axiosInstance.post(`/device-actions/${deviceId}/block_sim`, actionData);
        return response.data;
    } catch (error) {
        console.error(`Error removing SIM ${imsi} from device ${deviceId}:`, error);
        throw error;
    }
};

export const sendNotification = async (deviceId, data, isTelevision) => {
    try {
        const userId = getUserId();

        const notificationData = {
            applied_by_id: userId,
            isTelevision: isTelevision,
            payload: {
                ...data
            }
        };
        console.log("Data", notificationData);
        const response = await axiosInstance.post(`/device-actions/${deviceId}/notify`, notificationData);
        return response.data;
    } catch (error) {
        console.error('Error sent notification:', error);
        throw error;
    }
};