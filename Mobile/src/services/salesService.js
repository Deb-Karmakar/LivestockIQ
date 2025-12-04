// Mobile/src/services/salesService.js
import api from './api';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const addSale = async (saleData) => {
    try {
        const response = await api.post('/sales', saleData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to add sale' };
    }
};

export const getSales = async () => {
    try {
        const response = await api.get('/sales');
        await AsyncStorage.setItem('sales_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('sales_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch sales' };
    }
};
