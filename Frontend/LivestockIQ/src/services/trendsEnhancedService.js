// Enhanced Trends Service - Frontend/LivestockIQ/src/services/trendsEnhancedService.js

import { axiosInstance } from '../contexts/AuthContext';

export const getTrendDataEnhanced = async (period = '12m') => {
    try {
        const { data } = await axiosInstance.get(`/regulator/trends-enhanced/enhanced?period=${period}`);
        return data;
    } catch (error) {
        console.error("Error fetching enhanced trend data:", error);
        throw error;
    }
};

