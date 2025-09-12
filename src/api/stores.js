import axios from 'axios';
import { use } from 'react';

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