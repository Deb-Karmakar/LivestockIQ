// Mobile/src/services/treatmentService.js
import api from './api';

export const getTreatments = async (filters = {}) => {
    try {
        const response = await api.get('/treatments', { params: filters });
        return response.data;
    } catch (error) {
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
        const response = await api.post(`/vet/treatments/${id}/approve`, approvalData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to approve treatment' };
    }
};

export const rejectTreatment = async (id, reason) => {
    try {
        const response = await api.post(`/vet/treatments/${id}/reject`, { reason });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to reject treatment' };
    }
};

export const getTreatmentRequests = async () => {
    try {
        const response = await api.get('/vet/treatment-requests');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch treatment requests' };
    }
};
