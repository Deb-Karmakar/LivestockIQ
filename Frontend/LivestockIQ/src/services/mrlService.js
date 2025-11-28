// Frontend/LivestockIQ/src/services/mrlService.js

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * MRL Compliance API Service
 * Handles all MRL-related API calls
 */

// Get auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Create axios instance with auth
const createAuthConfig = () => ({
    headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
    }
});

/**
 * Get all MRL limits with optional filtering
 */
export const getMRLLimits = async (filters = {}) => {
    try {
        const params = new URLSearchParams(filters).toString();
        const response = await axios.get(
            `${API_URL}/api/mrl/limits${params ? `?${params}` : ''}`,
            createAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching MRL limits:', error);
        throw error;
    }
};

/**
 * Look up MRL limit for specific drug/species/product
 */
export const lookupMRLLimit = async (drugName, species, productType) => {
    try {
        const response = await axios.post(
            `${API_URL}/api/mrl/lookup`,
            { drugName, species, productType },
            createAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error looking up MRL limit:', error);
        throw error;
    }
};

/**
 * Submit lab test result
 */
export const submitLabTest = async (testData) => {
    try {
        const response = await axios.post(
            `${API_URL}/api/mrl/test-result`,
            testData,
            createAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error submitting lab test:', error);
        throw error;
    }
};

/**
 * Get MRL status for specific animal
 */
export const getAnimalMRLStatus = async (animalId) => {
    try {
        const response = await axios.get(
            `${API_URL}/api/mrl/animal-status/${animalId}`,
            createAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error getting animal MRL status:', error);
        throw error;
    }
};

/**
 * Get animals pending MRL tests
 */
export const getPendingMRLTests = async () => {
    try {
        const response = await axios.get(
            `${API_URL}/api/mrl/pending-tests`,
            createAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error getting pending MRL tests:', error);
        throw error;
    }
};

/**
 * Get lab test history for farmer
 */
export const getLabTestHistory = async () => {
    try {
        const response = await axios.get(
            `${API_URL}/api/mrl/test-history`,
            createAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error getting lab test history:', error);
        throw error;
    }
};

/**
 * Verify pre-sale compliance for animal
 */
export const verifyPreSaleCompliance = async (animalId, productType) => {
    try {
        const response = await axios.post(
            `${API_URL}/api/sales/verify-compliance`,
            { animalId, productType },
            createAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error verifying compliance:', error);
        throw error;
    }
};

/**
 * Bulk verify compliance for multiple animals
 */
export const bulkVerifyCompliance = async (animalIds, productType) => {
    try {
        const response = await axios.post(
            `${API_URL}/api/sales/bulk-verify`,
            { animalIds, productType },
            createAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error bulk verifying compliance:', error);
        throw error;
    }
};

export default {
    getMRLLimits,
    lookupMRLLimit,
    submitLabTest,
    getAnimalMRLStatus,
    getPendingMRLTests,
    getLabTestHistory,
    verifyPreSaleCompliance,
    bulkVerifyCompliance
};
