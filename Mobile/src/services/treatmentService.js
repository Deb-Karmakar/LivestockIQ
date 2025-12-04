// Mobile/src/services/treatmentService.js
import api from './api';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const getTreatments = async (filters = {}) => {
    try {
        const response = await api.get('/treatments', { params: filters });
        await AsyncStorage.setItem('treatments_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('treatments_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch treatments' };
    }
};

export const getTreatmentById = async (id) => {
    try {
        const response = await api.get(`/treatments/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Treatment not found' };
    }
};

export const requestTreatment = async (treatmentData) => {
    try {
        const response = await api.post('/treatments', treatmentData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to request treatment' };
    }
};

export const approveTreatment = async (id, approvalData) => {
    try {
        const response = await api.put(`/treatments/${id}/vet-update`, {
            status: 'Approved',
            ...approvalData
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to approve treatment' };
    }
};

export const rejectTreatment = async (id, reason) => {
    try {
        const response = await api.put(`/treatments/${id}/vet-update`, {
            status: 'Rejected',
            rejectionReason: reason
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to reject treatment' };
    }
};

export const getTreatmentRequests = async () => {
    try {
        const response = await api.get('/vets/treatment-requests');
        await AsyncStorage.setItem('vet_treatment_requests_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('vet_treatment_requests_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch treatment requests' };
    }
};
