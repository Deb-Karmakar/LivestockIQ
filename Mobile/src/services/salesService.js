// Mobile/src/services/salesService.js
import api from './api';

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
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch sales' };
    }
};
