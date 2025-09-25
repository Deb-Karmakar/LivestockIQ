// frontend/src/services/farmerService.js
import { axiosInstance } from '../contexts/AuthContext';

export const getMyProfile = async () => {
    try {
        const { data } = await axiosInstance.get('/farmers/profile');
        return data;
    } catch (error) {
        console.error("Error fetching farmer profile:", error);
        throw error;
    }
};

export const getMyHighAmuAlerts = async () => {
    try {
        const { data } = await axiosInstance.get('/farmers/high-amu-alerts');
        return data;
    } catch (error) {
        console.error("Error fetching high AMU alerts:", error);
        throw error;
    }
};

export const getHighAmuAlertDetails = async (alertId) => {
    try {
        const { data } = await axiosInstance.get(`/farmers/high-amu-alerts/${alertId}/details`);
        return data;
    } catch (error) {
        console.error("Error fetching high AMU alert details:", error);
        throw error;
    }
};