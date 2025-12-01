// Frontend/LivestockIQ/src/services/prescriptionReviewService.js

import { axiosInstance } from '../contexts/AuthContext';

const PRESCRIPTIONS_BASE = '/regulator/prescriptions';

/**
 * Get all prescriptions with optional filtering
 */
export const getAllPrescriptions = async (params = {}) => {
    try {
        const response = await axiosInstance.get(`${PRESCRIPTIONS_BASE}`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get detailed prescription information
 */
export const getPrescriptionDetails = async (prescriptionId) => {
    try {
        const response = await axiosInstance.get(`${PRESCRIPTIONS_BASE}/${prescriptionId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching prescription details:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get prescription statistics
 */
export const getPrescriptionStats = async (params = {}) => {
    try {
        const response = await axiosInstance.get(`${PRESCRIPTIONS_BASE}/stats`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching prescription stats:', error);
        throw error.response?.data || error;
    }
};
