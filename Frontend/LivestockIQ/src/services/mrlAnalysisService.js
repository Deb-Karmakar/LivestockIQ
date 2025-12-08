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

// Export MRL data to CSV
export const exportMRLDataCSV = async (filters = {}) => {
    try {
        const { data } = await axiosInstance.get('/regulator/mrl-analysis/export-csv', {
            params: filters,
            responseType: 'blob' // Important: treat response as binary data
        });

        // Create a downloadable link
        const url = window.URL.createObjectURL(new Blob([data], { type: 'text/csv' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `mrl-analysis-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error("Error exporting CSV:", error);
        throw error;
    }
};

