import api from './api';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const getFeedAdministrations = async (filters = {}) => {
    try {
        const response = await api.get('/feed-admin', { params: filters });
        await AsyncStorage.setItem('feed_admin_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('feed_admin_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch feed administrations' };
    }
};

export const getFeedAdministrationById = async (id) => {
    const response = await api.get(`/feed-admin/${id}`);
    return response.data;
};

export const recordFeedAdministration = async (administrationData) => {
    const response = await api.post('/feed-admin', administrationData);
    return response.data;
};

export const updateFeedAdministration = async (id, updateData) => {
    const response = await api.put(`/feed-admin/${id}`, updateData);
    return response.data;
};

export const deleteFeedAdministration = async (id) => {
    const response = await api.delete(`/feed-admin/${id}`);
    return response.data;
};

export const getActivePrograms = async () => {
    try {
        const response = await api.get('/feed-admin/active');
        await AsyncStorage.setItem('active_programs_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('active_programs_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch active programs' };
    }
};

export const completeFeedingProgram = async (id, endDate) => {
    const response = await api.post(`/feed-admin/${id}/complete`, { endDate });
    return response.data;
};

export const getAnimalFeedHistory = async (animalId) => {
    const response = await api.get(`/feed-admin/animal/${animalId}`);
    return response.data;
};

export const getWithdrawalStatus = async () => {
    try {
        const response = await api.get('/feed-admin/withdrawal-status');
        await AsyncStorage.setItem('withdrawal_status_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('withdrawal_status_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch withdrawal status' };
    }
};
