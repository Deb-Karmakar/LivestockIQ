import { axiosInstance } from '../contexts/AuthContext';

export const getAllUsers = async () => {
    try {
        const response = await axiosInstance.get('/admin/users');
        return response.data;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};

export const updateUserStatus = async (userId, role, status) => {
    try {
        const response = await axiosInstance.patch(`/admin/users/${userId}/status`, { role, status });
        return response.data;
    } catch (error) {
        console.error("Error updating user status:", error);
        throw error;
    }
};

export const deleteUser = async (userId, role) => {
    try {
        const response = await axiosInstance.delete(`/admin/users/${userId}?role=${role}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
};
