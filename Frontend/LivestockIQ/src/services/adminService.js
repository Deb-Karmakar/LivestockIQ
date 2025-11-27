import { axiosInstance } from '../contexts/AuthContext';

export const getDashboardStats = async () => {
    try {
        const response = await axiosInstance.get('/admin/dashboard-stats');
        return response.data;
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
    }
};
