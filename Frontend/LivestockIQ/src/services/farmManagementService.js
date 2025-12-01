// Frontend/LivestockIQ/src/services/farmManagementService.js

import { axiosInstance } from '../contexts/AuthContext';

const FARMS_BASE = '/regulator/farms';

export const getAllFarms = async (params = {}) => {
    try {
        const response = await axiosInstance.get(`${FARMS_BASE}`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching farms:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get detailed farm information
 */
export const getFarmDetails = async (farmId) => {
    try {
        const response = await axiosInstance.get(`${FARMS_BASE}/${farmId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching farm details:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get all animals for a specific farm
 */
export const getFarmAnimals = async (farmId, params = {}) => {
    try {
        const response = await axiosInstance.get(`${FARMS_BASE}/${farmId}/animals`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching farm animals:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get treatment history for a farm
 */
export const getFarmTreatments = async (farmId, params = {}) => {
    try {
        const response = await axiosInstance.get(`${FARMS_BASE}/${farmId}/treatments`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching farm treatments:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get compliance scorecard for a farm
 */
export const getFarmCompliance = async (farmId) => {
    try {
        const response = await axiosInstance.get(`${FARMS_BASE}/${farmId}/compliance`);
        return response.data;
    } catch (error) {
        console.error('Error fetching farm compliance:', error);
        throw error.response?.data || error;
    }
};
