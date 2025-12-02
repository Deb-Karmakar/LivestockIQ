// Frontend/src/services/vetReportsService.js

import { axiosInstance } from '@/contexts/AuthContext';

/**
 * Fetch Vet Practice Overview report data
 * @param {string} from - Start date (ISO format)
 * @param {string} to - End date (ISO format)
 * @returns {Promise} Report data with practice statistics
 */
export const getVetPracticeOverviewData = async (from, to) => {
    try {
        const { data } = await axiosInstance.get('/reports/vet/practice-overview-data', {
            params: { from, to }
        });
        return data;
    } catch (error) {
        console.error("Error fetching vet practice overview:", error);
        throw error;
    }
};

/**
 * Fetch Vet Prescription Analytics data
 * @param {string} from - Start date (ISO format)
 * @param {string} to - End date (ISO format)
 * @returns {Promise} Report data with prescription patterns
 */
export const getVetPrescriptionAnalyticsData = async (from, to) => {
    try {
        const { data } = await axiosInstance.get('/reports/vet/prescription-analytics-data', {
            params: { from, to }
        });
        return data;
    } catch (error) {
        console.error("Error fetching vet prescription analytics:", error);
        throw error;
    }
};

/**
 *  Fetch Vet Farm Supervision data
 * @param {string} from - Start date (ISO format)
 * @param {string} to - End date (ISO format)
 * @returns {Promise} Report data with supervised farms statistics
 */
export const getVetFarmSupervisionData = async (from, to) => {
    try {
        const { data } = await axiosInstance.get('/reports/vet/farm-supervision-data', {
            params: { from, to }
        });
        return data;
    } catch (error) {
        console.error("Error fetching vet farm supervision data:", error);
        throw error;
    }
};

/**
 * Fetch Vet Compliance Monitoring data
 * @param {string} from - Start date (ISO format)
 * @param {string} to - End date (ISO format)
 * @returns {Promise} Report data with approval/rejection statistics
 */
export const getVetComplianceMonitoringData = async (from, to) => {
    try {
        const { data } = await axiosInstance.get('/reports/vet/compliance-monitoring-data', {
            params: { from, to }
        });
        return data;
    } catch (error) {
        console.error("Error fetching vet compliance monitoring:", error);
        throw error;
    }
};

/**
 * Fetch Vet WHO AWaRe Stewardship data
 * @param {string} from - Start date (ISO format)
 * @param {string} to - End date (ISO format)
 * @returns {Promise} Report data with WHO AWaRe drug class usage
 */
export const getVetWhoAwareStewardshipData = async (from, to) => {
    try {
        const { data } = await axiosInstance.get('/reports/vet/who-aware-stewardship-data', {
            params: { from, to }
        });
        return data;
    } catch (error) {
        console.error("Error fetching vet WHO AWaRe stewardship:", error);
        throw error;
    }
};
