// Frontend/src/services/farmerReportsService.js

import { axiosInstance } from '@/contexts/AuthContext';

/**
 * Fetch Farmer AMU Usage report data
 * @param {string} from - Start date (ISO format)
 * @param {string} to - End date (ISO format)
 * @returns {Promise} Report data with AMU trends and drug breakdown
 */
export const getFarmerAmuReportData = async (from, to) => {
    try {
        const { data } = await axiosInstance.get('/reports/farmer/amu-data', {
            params: { from, to }
        });
        return data;
    } catch (error) {
        console.error("Error fetching farmer AMU data:", error);
        throw error;
    }
};

/**
 * Fetch Farmer Animal Health report data
 * @param {string} from - Start date (ISO format)
 * @param {string} to - End date (ISO format)
 * @returns {Promise} Report data with health status and MRL compliance
 */
export const getFarmerAnimalHealthReportData = async (from, to) => {
    try {
        const { data } = await axiosInstance.get('/reports/farmer/animal-health-data', {
            params: { from, to }
        });
        return data;
    } catch (error) {
        console.error("Error fetching farmer animal health data:", error);
        throw error;
    }
};

/**
 * Fetch Farmer Herd Demographics data
 * @returns {Promise} Report data with species, age, and gender breakdown
 */
export const getFarmerHerdDemographicsData = async () => {
    try {
        const { data } = await axiosInstance.get('/reports/farmer/herd-demographics-data');
        return data;
    } catch (error) {
        console.error("Error fetching farmer herd demographics:", error);
        throw error;
    }
};

/**
 * Fetch Farmer Treatment History data
 * @param {string} from - Start date (ISO format)
 * @param {string} to - End date (ISO format)
 * @returns {Promise} Report data with treatment records
 */
export const getFarmerTreatmentHistoryData = async (from, to) => {
    try {
        const { data } = await axiosInstance.get('/reports/farmer/treatment-history-data', {
            params: { from, to }
        });
        return data;
    } catch (error) {
        console.error("Error fetching farmer treatment history:", error);
        throw error;
    }
};

/**
 * Fetch Farmer MRL Compliance data
 * @param {string} from - Start date (ISO format)
 * @param {string} to - End date (ISO format)
 * @returns {Promise} Report data with MRL status and test results
 */
export const getFarmerMrlComplianceData = async (from, to) => {
    try {
        const { data } = await axiosInstance.get('/reports/farmer/mrl-compliance-data', {
            params: { from, to }
        });
        return data;
    } catch (error) {
        console.error("Error fetching farmer MRL compliance data:", error);
        throw error;
    }
};
