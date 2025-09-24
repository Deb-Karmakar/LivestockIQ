// frontend/src/services/regulatorService.js

import { axiosInstance } from '../contexts/AuthContext';

export const getDashboardStats = async () => {
    try {
        const { data } = await axiosInstance.get('/regulator/dashboard-stats');
        return data;
    } catch (error) {
        console.error("Error fetching regulator dashboard stats:", error);
        throw error;
    }
};

export const getComplianceData = async () => {
    try {
        const { data } = await axiosInstance.get('/regulator/compliance-data');
        return data;
    } catch (error) {
        console.error("Error fetching regulator compliance data:", error);
        throw error;
    }
};

export const getTrendData = async () => {
    try {
        const { data } = await axiosInstance.get('/regulator/trends');
        return data;
    } catch (error) {
        console.error("Error fetching trend data:", error);
        throw error;
    }
};

export const getDemographicsData = async () => {
    try {
        const { data } = await axiosInstance.get('/regulator/demographics');
        return data;
    } catch (error) {
        console.error("Error fetching demographics data:", error);
        throw error;
    }
};

export const getMapData = async () => {
    try {
        const { data } = await axiosInstance.get('/regulator/map-data');
        return data;
    } catch (error) {
        console.error("Error fetching map data:", error);
        throw error;
    }
};

export const generateComplianceReport = async (dateRange) => {
    try {
        const { data } = await axiosInstance.post('/regulator/reports/compliance', dateRange, {
            responseType: 'blob',
        });
        return data;
    } catch (error) {
        console.error("Error generating compliance report:", error);
        throw error;
    }
};

export const getRegulatorProfile = async () => {
    const { data } = await axiosInstance.get('/regulator/profile');
    return data;
};

export const updateRegulatorProfile = async (profileData) => {
    const { data } = await axiosInstance.put('/regulator/profile', profileData);
    return data;
};