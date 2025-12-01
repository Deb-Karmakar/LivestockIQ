// frontend/src/services/regulatorServiceEnhanced.js

import { axiosInstance } from '../contexts/AuthContext';

/**
 * Enhanced Demographics Service
 * Fetches comprehensive demographics data with regional, AMU, and MRL analysis
 */
export const getDemographicsDataEnhanced = async (period = '12m') => {
    try {
        const { data } = await axiosInstance.get(`/regulator/demographics-enhanced?period=${period}`);
        return data;
    } catch (error) {
        console.error("Error fetching enhanced demographics data:", error);
        throw error;
    }
};
