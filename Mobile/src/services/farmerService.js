import api from './api';

export const getMyProfile = async () => {
    try {
        const response = await api.get('/farmers/profile');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch profile' };
    }
};

export const getFarmerProfile = getMyProfile;

export const updateMyProfile = async (profileData) => {
    try {
        const response = await api.put('/farmers/profile', profileData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to update profile' };
    }
};

import AsyncStorage from '@react-native-async-storage/async-storage';

export const getMyHighAmuAlerts = async () => {
    try {
        const response = await api.get('/farmers/high-amu-alerts');
        await AsyncStorage.setItem('amu_alerts_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('amu_alerts_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch AMU alerts' };
    }
};

export const getFarmerAmuReport = async (startDate, endDate) => {
    try {
        const response = await api.get('/reports/farmer/amu-data', {
            params: { from: startDate, to: endDate }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch AMU report' };
    }
};

export const getFarmerAnimalHealthReport = async (startDate, endDate) => {
    try {
        const response = await api.get('/reports/farmer/animal-health-data', {
            params: { from: startDate, to: endDate }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch animal health report' };
    }
};

export const getFarmerHerdDemographics = async () => {
    try {
        const response = await api.get('/reports/farmer/herd-demographics-data');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch herd demographics' };
    }
};

export const getFarmerTreatmentHistory = async (startDate, endDate) => {
    try {
        const response = await api.get('/reports/farmer/treatment-history-data', {
            params: { from: startDate, to: endDate }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch treatment history' };
    }
};

export const getFarmerMrlCompliance = async (startDate, endDate) => {
    try {
        const response = await api.get('/reports/farmer/mrl-compliance-data', {
            params: { from: startDate, to: endDate }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch MRL compliance report' };
    }
};
