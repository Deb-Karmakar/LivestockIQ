// Frontend/src/services/offlineTreatmentService.js
// Service for offline treatment records (non-registered farmers)

import { axiosInstance } from '../contexts/AuthContext';

/**
 * Create new offline treatment record
 */
export const createOfflineTreatment = async (treatmentData) => {
    try {
        const { data } = await axiosInstance.post('/vet/offline-treatments', treatmentData);
        return data;
    } catch (error) {
        console.error('Error creating offline treatment:', error);
        throw error;
    }
};

/**
 * Get all offline treatments for logged-in vet
 */
export const getOfflineTreatments = async (params = {}) => {
    try {
        const { data } = await axiosInstance.get('/vet/offline-treatments', { params });
        return data;
    } catch (error) {
        console.error('Error fetching offline treatments:', error);
        throw error;
    }
};

/**
 * Get specific offline treatment by ID
 */
export const getOfflineTreatmentById = async (id) => {
    try {
        const { data } = await axiosInstance.get(`/vet/offline-treatments/${id}`);
        return data;
    } catch (error) {
        console.error('Error fetching offline treatment:', error);
        throw error;
    }
};

/**
 * Update offline treatment
 */
export const updateOfflineTreatment = async (id, treatmentData) => {
    try {
        const { data } = await axiosInstance.put(`/vet/offline-treatments/${id}`, treatmentData);
        return data;
    } catch (error) {
        console.error('Error updating offline treatment:', error);
        throw error;
    }
};

/**
 * Delete offline treatment
 */
export const deleteOfflineTreatment = async (id) => {
    try {
        const { data } = await axiosInstance.delete(`/vet/offline-treatments/${id}`);
        return data;
    } catch (error) {
        console.error('Error deleting offline treatment:', error);
        throw error;
    }
};

/**
 * Resend prescription email
 */
export const resendPrescriptionEmail = async (id) => {
    try {
        const { data } = await axiosInstance.post(`/vet/offline-treatments/${id}/resend-email`);
        return data;
    } catch (error) {
        console.error('Error resending email:', error);
        throw error;
    }
};

/**
 * Get offline treatment statistics
 */
export const getOfflineTreatmentStats = async () => {
    try {
        const { data } = await axiosInstance.get('/vet/offline-treatments/stats');
        return data;
    } catch (error) {
        console.error('Error fetching stats:', error);
        throw error;
    }
};
