// Frontend/LivestockIQ/src/services/mrlService.js

import { axiosInstance } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * MRL Compliance API Service
 * Handles all MRL-related API calls
 */

/**
 * Get all MRL limits with optional filtering
 */
export const getMRLLimits = async (filters = {}) => {
    try {
        const params = new URLSearchParams(filters).toString();
        const response = await axiosInstance.get(
            `/mrl/limits${params ? `?${params}` : ''}`
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
        const response = await axiosInstance.post(
            `/mrl/lookup`,
            { drugName, species, productType }
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
        const response = await axiosInstance.post(
            `/mrl/test-result`,
            testData
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
        const response = await axiosInstance.get(
            `/mrl/animal/${animalId}/status`
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
        const response = await axiosInstance.get(
            `/mrl/pending-tests`
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
        const response = await axiosInstance.get(
            `/mrl/my-tests`
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
        const response = await axiosInstance.post(
            `/sales/verify-compliance`,
            { animalId, productType }
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
        const response = await axiosInstance.post(
            `/sales/bulk-verify`,
            { animalIds, productType }
        );
        return response.data;
    } catch (error) {
        console.error('Error bulk verifying compliance:', error);
        throw error;
    }
};

/**
 * Get pending lab tests for regulator verification
 */
export const getPendingVerifications = async (filters = {}) => {
    try {
        const params = new URLSearchParams(filters).toString();
        const response = await axiosInstance.get(
            `/mrl/regulator/pending-verifications${params ? `?${params}` : ''}`
        );
        return response.data;
    } catch (error) {
        console.error('Error getting pending verifications:', error);
        throw error;
    }
};

/**
 * Get verification statistics for regulator dashboard
 */
export const getVerificationStats = async () => {
    try {
        const response = await axiosInstance.get(
            `/mrl/regulator/verification-stats`
        );
        return response.data;
    } catch (error) {
        console.error('Error getting verification stats:', error);
        throw error;
    }
};

/**
 * Get detailed information for a specific lab test
 */
export const getLabTestDetails = async (testId) => {
    try {
        const response = await axiosInstance.get(
            `/mrl/regulator/test/${testId}`
        );
        return response.data;
    } catch (error) {
        console.error('Error getting lab test details:', error);
        throw error;
    }
};

/**
 * Verify (approve or reject) a lab test
 */
export const verifyLabTest = async (testId, approved, notes = '') => {
    try {
        const response = await axiosInstance.put(
            `/mrl/regulator/verify/${testId}`,
            { approved, notes }
        );
        return response.data;
    } catch (error) {
        console.error('Error verifying lab test:', error);
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
    bulkVerifyCompliance,
    getPendingVerifications,
    getVerificationStats,
    getLabTestDetails,
    verifyLabTest
};
