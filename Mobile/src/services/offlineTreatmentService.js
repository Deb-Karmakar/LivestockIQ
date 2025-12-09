// Mobile service for offline treatment records (non-registered farmers)
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Create new offline treatment record
 */
export const createOfflineTreatment = async (treatmentData) => {
    const response = await api.post('/vet/offline-treatments', treatmentData);
    return response.data;
};

/**
 * Get all offline treatments for logged-in vet
 */
export const getOfflineTreatments = async (params = {}) => {
    try {
        const response = await api.get('/vet/offline-treatments', { params });
        await AsyncStorage.setItem('vet_offline_treatments_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('vet_offline_treatments_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch offline treatments' };
    }
};

/**
 * Get specific offline treatment by ID
 */
export const getOfflineTreatmentById = async (id) => {
    const response = await api.get(`/vet/offline-treatments/${id}`);
    return response.data;
};

/**
 * Delete offline treatment
 */
export const deleteOfflineTreatment = async (id) => {
    const response = await api.delete(`/vet/offline-treatments/${id}`);
    return response.data;
};

/**
 * Resend prescription email
 */
export const resendPrescriptionEmail = async (id) => {
    const response = await api.post(`/vet/offline-treatments/${id}/resend-email`);
    return response.data;
};
