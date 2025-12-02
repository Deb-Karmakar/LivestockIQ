import api from './api';

export const getMyProfile = async () => {
    try {
        const response = await api.get('/farmers/profile');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch profile' };
    }
};

export const updateMyProfile = async (profileData) => {
    try {
        const response = await api.put('/farmers/profile', profileData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to update profile' };
    }
};

export const getMyHighAmuAlerts = async () => {
    try {
        const response = await api.get('/farmers/high-amu-alerts');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch AMU alerts' };
    }
};
