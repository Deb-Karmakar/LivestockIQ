// Mobile/src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Production API URL - Update this with your Render backend URL
const PRODUCTION_API_URL = 'https://livestockiq-backend.onrender.com/api';

const getApiUrl = () => {
    // Check if running in production (EAS build)
    if (!__DEV__) {
        console.log('Running in production mode');
        return PRODUCTION_API_URL;
    }

    // Development mode - use local server
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
    timeout: 15000, // Increased timeout for production
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
        console.error('API Error:', error.message);
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received. Network error or timeout.');
            console.error('Request details:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error setting up request:', error.message);
        }
        console.error('Config:', error.config);

        if (error.response?.status === 401) {
            // Token expired or invalid, logout user
            console.log('401 error - clearing auth');
            await AsyncStorage.multiRemove(['token', 'user']);
        }
        return Promise.reject(error);
    }
);

export default api;
