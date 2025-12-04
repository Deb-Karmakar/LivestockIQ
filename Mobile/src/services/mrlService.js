import api from './api';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const getAnimalMRLStatus = async (animalId) => {
    try {
        const response = await api.get(`/mrl/animal/${animalId}/status`);
        await AsyncStorage.setItem(`mrl_status_${animalId}`, JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem(`mrl_status_${animalId}`);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch MRL status' };
    }
};

export const getPendingMRLTests = async () => {
    try {
        const response = await api.get('/mrl/pending-tests');
        await AsyncStorage.setItem('mrl_pending_tests', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('mrl_pending_tests');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch pending MRL tests' };
    }
};

export const submitLabTest = async (testData) => {
    try {
        const response = await api.post('/mrl/test-result', testData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to submit lab test' };
    }
};

export const getLabTestHistory = async () => {
    try {
        const response = await api.get('/mrl/my-tests');
        await AsyncStorage.setItem('mrl_test_history', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('mrl_test_history');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch lab test history' };
    }
};
