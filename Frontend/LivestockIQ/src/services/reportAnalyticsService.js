// Frontend/src/services/reportAnalyticsService.js

import { axiosInstance } from '@/contexts/AuthContext';

/**
 * Fetch Compliance & Violation report data
 * @param {string} from - Start date (ISO format)
 * @param {string} to - End date (ISO format)
 * @returns {Promise} Report data with summary and visualization data
 */
export const getComplianceReportData = async (from, to) => {
    try {
        const { data } = await axiosInstance.get('/regulator/reports/compliance-data', {
            params: { from, to }
        });
        return data;
    } catch (error) {
        console.error("Error fetching compliance report data:", error);
        throw error;
    }
};

/**
 * Fetch AMU Trends report data
 * @param {string} from - Start date (ISO format)
 * @param {string} to - End date (ISO format)
 * @returns {Promise} Report data with trend analysis
 */
export const getAmuTrendsReportData = async (from, to) => {
    try {
        const { data } = await axiosInstance.get('/regulator/reports/amu-trends-data', {
            params: { from, to }
        });
        return data;
    } catch (error) {
        console.error("Error fetching AMU trends data:", error);
        throw error;
    }
};

/**
 * Fetch WHO AWaRe classification report data
 * @param {string} from - Start date (ISO format)
 * @param {string} to - End date (ISO format)
 * @returns {Promise} Report data with drug class breakdown
 */
export const getWhoAwareReportData = async (from, to) => {
    try {
        const { data } = await axiosInstance.get('/regulator/reports/who-aware-data', {
            params: { from, to }
        });
        return data;
    } catch (error) {
        console.error("Error fetching WHO AWaRe data:", error);
        throw error;
    }
};

/**
 * Fetch Veterinarian Oversight report data
 * @param {string} from - Start date (ISO format)
 * @param {string} to - End date (ISO format)
 * @returns {Promise} Report data with vet performance metrics
 */
export const getVetOversightReportData = async (from, to) => {
    try {
        const { data } = await axiosInstance.get('/regulator/reports/vet-oversight-data', {
            params: { from, to }
        });
        return data;
    } catch (error) {
        console.error("Error fetching vet oversight data:", error);
        throw error;
    }
};

/**
 * Fetch Farm Risk Profile report data
 * @param {string} from - Start date (ISO format)
 * @param {string} to - End date (ISO format)
 * @returns {Promise} Report data with farm risk assessments
 */
export const getFarmRiskReportData = async (from, to) => {
    try {
        const { data } = await axiosInstance.get('/regulator/reports/farm-risk-data', {
            params: { from, to }
        });
        return data;
    } catch (error) {
        console.error("Error fetching farm risk data:", error);
        throw error;
    }
};

/**
 * Fetch Feed vs Therapeutic report data
 * @param {string} from - Start date (ISO format)
 * @param {string} to - End date (ISO format)
 * @returns {Promise} Report data comparing feed and therapeutic usage
 */
export const getFeedVsTherapeuticReportData = async (from, to) => {
    try {
        const { data } = await axiosInstance.get('/regulator/reports/feed-vs-therapeutic-data', {
            params: { from, to }
        });
        return data;
    } catch (error) {
        console.error("Error fetching feed vs therapeutic data:", error);
        throw error;
    }
};
