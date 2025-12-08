// frontend/src/services/labService.js

import { axiosInstance } from '../contexts/AuthContext';

// Get lab technician profile
export const getLabProfile = async () => {
    try {
        const { data } = await axiosInstance.get('/lab/profile');
        return data;
    } catch (error) {
        console.error("Error fetching lab profile:", error);
        throw error;
    }
};

// Get lab dashboard data
export const getLabDashboard = async () => {
    try {
        const { data } = await axiosInstance.get('/lab/dashboard');
        return data;
    } catch (error) {
        console.error("Error fetching lab dashboard:", error);
        throw error;
    }
};

// Upload MRL test result
export const uploadMRLTest = async (testData) => {
    try {
        const { data } = await axiosInstance.post('/lab/mrl-tests', testData);
        return data;
    } catch (error) {
        console.error("Error uploading MRL test:", error);
        throw error;
    }
};

// Get MRL tests uploaded by this technician
export const getMyMRLTests = async (params = {}) => {
    try {
        const { data } = await axiosInstance.get('/lab/mrl-tests', { params });
        return data;
    } catch (error) {
        console.error("Error fetching MRL tests:", error);
        throw error;
    }
};

// Find animal by Tag ID
export const findAnimalByTagId = async (tagId) => {
    try {
        const { data } = await axiosInstance.get(`/lab/animals/${tagId}`);
        return data;
    } catch (error) {
        console.error("Error finding animal:", error);
        throw error;
    }
};
