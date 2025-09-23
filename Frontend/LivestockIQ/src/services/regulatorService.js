// frontend/src/services/regulatorService.js

import { axiosInstance } from '../contexts/AuthContext';

export const getDashboardStats = async () => {
    try {
        const { data } = await axiosInstance.get('/regulator/dashboard-stats');
        return data;
    } catch (error) {
        console.error("Error fetching regulator dashboard stats:", error);
        throw error;
    }
};