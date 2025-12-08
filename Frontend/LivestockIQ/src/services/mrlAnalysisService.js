// frontend/src/services/mrlAnalysisService.js

import { axiosInstance } from '../contexts/AuthContext';

// Get MRL analysis dashboard data
export const getMRLAnalysisDashboard = async (filters = {}) => {
    try {
        const { data } = await axiosInstance.get('/regulator/mrl-analysis/dashboard', { params: filters });
        return data;
    } catch (error) {
        console.error("Error fetching MRL analysis dashboard:", error);
        throw error;
    }
};

// Get all lab tests with pagination
export const getAllLabTests = async (params = {}) => {
    try {
        const { data } = await axiosInstance.get('/regulator/mrl-analysis/tests', { params });
        return data;
    } catch (error) {
        console.error("Error fetching lab tests:", error);
        throw error;
    }
};

// Review (approve/reject) a lab test
export const reviewLabTest = async (testId, action, notes = '') => {
    try {
        const { data } = await axiosInstance.patch(`/regulator/mrl-analysis/tests/${testId}/review`, { action, notes });
        return data;
    } catch (error) {
        console.error("Error reviewing lab test:", error);
        throw error;
    }
};

// Get filter options
export const getFilterOptions = async () => {
    try {
        const { data } = await axiosInstance.get('/regulator/mrl-analysis/filters');
        return data;
    } catch (error) {
        console.error("Error fetching filter options:", error);
        throw error;
    }
};
