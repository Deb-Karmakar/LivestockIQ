// frontend/src/services/reportsService.js

import { axiosInstance } from '../contexts/AuthContext';

export const generateAmuReport = async (dateRange) => {
    try {
        const { data } = await axiosInstance.post('/reports/amu', dateRange, {
            responseType: 'blob', // This is crucial to handle the PDF file response
        });
        return data; // This will be a Blob object
    } catch (error) {
        console.error("Error generating report:", error);
        throw error;
    }
};

export const generateFarmAmuReportForVet = async (reportData) => {
    const { data } = await axiosInstance.post('/reports/farm-amu', reportData, {
        responseType: 'blob',
    });
    return data;
};

export const generateVetSignedLog = async (dateRange) => {
    const { data } = await axiosInstance.post('/reports/vet-log', dateRange, {
        responseType: 'blob',
    });
    return data;
};