// frontend/src/services/salesService.js

import { axiosInstance } from '../contexts/AuthContext';

export const addSale = async (saleData) => {
    try {
        const { data } = await axiosInstance.post('/sales', saleData);
        return data;
    } catch (error) {
        console.error("Error adding sale:", error);
        throw error.response.data; // Throw the specific error message from the backend
    }
};

export const getSales = async () => {
    try {
        const { data } = await axiosInstance.get('/sales');
        return data;
    } catch (error) {
        console.error("Error fetching sales:", error);
        throw error;
    }
};