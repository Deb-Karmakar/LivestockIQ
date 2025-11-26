// frontend/src/services/salesService.js

import { axiosInstance } from '../contexts/AuthContext';
import {
    getOfflineSales,
    saveOfflineSale,
    cacheSales
} from './offlineService';

export const addSale = async (saleData) => {
    if (!navigator.onLine) {
        return await saveOfflineSale(saleData);
    }
    try {
        const { data } = await axiosInstance.post('/sales', saleData);
        return data;
    } catch (error) {
        console.error("Error adding sale:", error);
        throw error.response.data; // Throw the specific error message from the backend
    }
};

export const getSales = async () => {
    if (!navigator.onLine) {
        return await getOfflineSales();
    }
    try {
        const { data } = await axiosInstance.get('/sales');
        await cacheSales(data);
        return data;
    } catch (error) {
        console.error("Error fetching sales:", error);
        return await getOfflineSales();
    }
};