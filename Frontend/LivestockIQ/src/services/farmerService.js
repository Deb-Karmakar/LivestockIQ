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