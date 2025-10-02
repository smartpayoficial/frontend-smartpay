import axios from 'axios';
import { use } from 'react';
import { getCurrentStoreId } from '../common/utils/helpers';

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

export const getStores = async (params = {}) => {
    try {
        const response = await axiosInstance.get('/stores', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

export const getStoreById = async (id) => {
    try {
        const response = await axiosInstance.get(`/stores/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching store with id ${id}:`, error);
        throw error;
    }
};

export const createStore = async (data) => {
    try {
        const response = await axiosInstance.post('/stores/', data);
        return response.data;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

export const updateStore = async (id, date) => {
    try {
        const response = await axiosInstance.patch(`/stores/${id}`, date);
        return response.data;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

export const deleteStore = async (id) => {
    try {
        const response = await axiosInstance.delete(`/stores/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

export const getAccountTypes = async (params = {}) => {
    try {
        const response = await axiosInstance.get('/account-types/', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching account types:', error);
        throw error;
    }
}

// Consultar contactos registrados a la tienda
export const getContacts = async ( params = {}) => {
    try {
        const storeId = getCurrentStoreId();
        if (storeId) params.store_id = storeId;

        const response = await axiosInstance.get(`/store-contacts/by-store/${storeId}`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching contacts:', error);
        throw error;
    }
}

// Crear un nuevo contacto
export const createContact = async (storeId, data) => {
    try {
        data.store_id = storeId;
        const response = await axiosInstance.post(`/store-contacts/contacts`, data);
        return response.data;
    } catch (error) {
        console.error('Error creating contact:', error);
        throw error;
    }
}
// Actualizar un contacto
export const updateContact = async (contactId, data) => {
    try {
        const response = await axiosInstance.put(`/store-contacts/contacts/${contactId}`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating contact:', error);
        throw error;
    }
}

// Eliminado fisico
export const deleteContact = async (contactId) => {
    try {
        const response = await axiosInstance.delete(`/store-contacts/contacts/${contactId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting contact:', error);
        throw error;
    }
}