// Mobile/src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getApiUrl = () => {
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(':')[0];

    if (localhost) {
        return `http://${localhost}:5000/api`;
    }

    // Fallback for Android Emulator
    return 'http://10.0.2.2:5000/api';
};

const API_BASE_URL = getApiUrl();
console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            console.log('API Request:', config.method.toUpperCase(), config.url);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log('Token added to request');
            } else {
                console.log('No token found');
            }
        } catch (error) {
            console.error('Error getting token:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
    },
    async (error) => {
        console.error('API Error:', error.response?.status, error.config?.url);
        console.error('Error details:', error.response?.data);

        if (error.response?.status === 401) {
            // Token expired or invalid, logout user
            console.log('401 error - clearing auth');
            await AsyncStorage.multiRemove(['token', 'user']);
        }
        return Promise.reject(error);
    }
);

export default api;
