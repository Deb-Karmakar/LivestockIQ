// Frontend service for vet visit requests
import { axiosInstance } from '../contexts/AuthContext';

/**
 * Create a vet visit request (Farmer)
 */
export const createVetVisitRequest = async (data) => {
    const response = await axiosInstance.post('/vet-visits', data);
    return response.data;
};

/**
 * Get vet visit requests (Farmer sees own, Vet sees assigned)
 */
export const getVetVisitRequests = async (params = {}) => {
    const response = await axiosInstance.get('/vet-visits', { params });
    return response.data;
};

/**
 * Get single vet visit request by ID
 */
export const getVetVisitRequestById = async (id) => {
    const response = await axiosInstance.get(`/vet-visits/${id}`);
    return response.data;
};

/**
 * Respond to a vet visit request (Vet only)
 * @param {string} id - Visit request ID
 * @param {Object} data - { action: 'accept'|'decline', scheduledDate?, vetNotes? }
 */
export const respondToVetVisitRequest = async (id, data) => {
    const response = await axiosInstance.put(`/vet-visits/${id}/respond`, data);
    return response.data;
};

/**
 * Mark vet visit as complete (Vet only)
 */
export const completeVetVisit = async (id, data = {}) => {
    const response = await axiosInstance.put(`/vet-visits/${id}/complete`, data);
    return response.data;
};
