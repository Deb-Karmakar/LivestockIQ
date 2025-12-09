// Mobile/src/services/vetVisitService.js
import api from './api';

/**
 * Create a vet visit request (Farmer)
 */
export const createVetVisitRequest = async (data) => {
    const response = await api.post('/vet-visits', data);
    return response.data;
};

/**
 * Get vet visit requests (Farmer sees own, Vet sees assigned)
 */
export const getVetVisitRequests = async (params = {}) => {
    const response = await api.get('/vet-visits', { params });
    return response.data;
};

/**
 * Get single vet visit request by ID
 */
export const getVetVisitRequestById = async (id) => {
    const response = await api.get(`/vet-visits/${id}`);
    return response.data;
};
