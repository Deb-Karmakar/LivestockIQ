// Frontend/LivestockIQ/src/services/vetManagementService.js

import { axiosInstance } from '../contexts/AuthContext';

const VETS_BASE = '/regulator/vets';

/**
 * Get all veterinarians with statistics
 */
export const getAllVets = async (params = {}) => {
    try {
        const response = await axiosInstance.get(`${VETS_BASE}`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching vets:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get detailed veterinarian information
 */
export const getVetDetails = async (vetId) => {
    try {
        const response = await axiosInstance.get(`${VETS_BASE}/${vetId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching vet details:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get farms supervised by a veterinarian
 */
export const getVetFarms = async (vetId, params = {}) => {
    try {
        const response = await axiosInstance.get(`${VETS_BASE}/${vetId}/farms`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching vet farms:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get prescriptions issued by a veterinarian
 */
export const getVetPrescriptions = async (vetId, params = {}) => {
    try {
        const response = await axiosInstance.get(`${VETS_BASE}/${vetId}/prescriptions`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching vet prescriptions:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get compliance metrics for a veterinarian
 */
export const getVetCompliance = async (vetId) => {
    try {
        const response = await axiosInstance.get(`${VETS_BASE}/${vetId}/compliance`);
        return response.data;
    } catch (error) {
        console.error('Error fetching vet compliance:', error);
        throw error.response?.data || error;
    }
};
