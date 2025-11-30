// Mobile/src/services/authService.js
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (email, password) => {
    try {
        console.log('Attempting login to:', api.defaults.baseURL);
        console.log('Email:', email);

        const response = await api.post('/auth/login', { email, password });
        console.log('Login response:', response.data);

        // Backend returns user data at root level with token
        const { token, ...userData } = response.data;
        const user = userData; // The rest of the data is the user object

        // Store token and user data
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        console.log('Login successful!');
        return { token, user };
    } catch (error) {
        console.error('Login error:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error message:', error.message);
        throw error.response?.data || { message: error.message || 'Login failed' };
    }
};

export const register = async (userData) => {
    try {
        const response = await api.post('/auth/register', userData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Registration failed' };
    }
};

export const logout = async () => {
    try {
        await AsyncStorage.multiRemove(['token', 'user']);
    } catch (error) {
        console.error('Logout error:', error);
    }
};

export const getCurrentUser = async () => {
    try {
        const userStr = await AsyncStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        return null;
    }
};

export const getToken = async () => {
    try {
        return await AsyncStorage.getItem('token');
    } catch (error) {
        return null;
    }
};
