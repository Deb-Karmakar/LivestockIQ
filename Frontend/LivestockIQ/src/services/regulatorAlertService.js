// Frontend/LivestockIQ/src/services/regulatorAlertService.js

import { axiosInstance } from '../contexts/AuthContext';

/**
 * Regulator Alert API Service
 * Handles all regulator alert-related API calls
 */

/**
 * Get all alerts with optional filtering
 * @param {Object} filters - { status, severity, alertType, riskLevel, farmerId, page, limit }
 */
export const getAlerts = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value);
            }
        });

        const response = await axiosInstance.get(
            `/regulator/alerts${params.toString() ? `?${params.toString()}` : ''}`
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching alerts:', error);
        throw error;
    }
};

/**
 * Get dashboard statistics
 */
export const getAlertStats = async () => {
    try {
        const response = await axiosInstance.get('/regulator/alert-stats');
        return response.data;
    } catch (error) {
        console.error('Error fetching alert stats:', error);
        throw error;
    }
};

/**
 * Get single alert by ID
 * @param {string} alertId - Alert ID
 */
export const getAlertById = async (alertId) => {
    try {
        const response = await axiosInstance.get(`/regulator/alerts/${alertId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching alert details:', error);
        throw error;
    }
};

/**
 * Acknowledge an alert
 * @param {string} alertId - Alert ID
 */
export const acknowledgeAlert = async (alertId) => {
    try {
        const response = await axiosInstance.put(`/regulator/alerts/${alertId}/acknowledge`);
        return response.data;
    } catch (error) {
        console.error('Error acknowledging alert:', error);
        throw error;
    }
};

/**
 * Update alert status
 * @param {string} alertId - Alert ID
 * @param {string} status - New status (NEW, ACKNOWLEDGED, INVESTIGATING, RESOLVED, ESCALATED)
 * @param {string} notes - Optional notes
 * @param {string} actionTaken - Optional action description
 */
export const updateAlertStatus = async (alertId, status, notes = '', actionTaken = '') => {
    try {
        const response = await axiosInstance.put(`/regulator/alerts/${alertId}/status`, {
            status,
            notes,
            actionTaken
        });
        return response.data;
    } catch (error) {
        console.error('Error updating alert status:', error);
        throw error;
    }
};

/**
 * Get farm violation history
 * @param {string} farmerId - Farm ID
 */
export const getFarmViolationHistory = async (farmerId) => {
    try {
        const response = await axiosInstance.get(`/regulator/farms/${farmerId}/violations`);
        return response.data;
    } catch (error) {
        console.error('Error fetching farm violation history:', error);
        throw error;
    }
};

/**
 * Export violation report
 * @param {Object} filters - { startDate, endDate, format }
 */
export const exportViolationReport = async (filters = {}) => {
    try {
        const params = new URLSearchParams(filters).toString();
        const response = await axiosInstance.get(
            `/regulator/export-violations${params ? `?${params}` : ''}`,
            {
                responseType: filters.format === 'csv' ? 'blob' : 'json'
            }
        );

        if (filters.format === 'csv') {
            // Create download link for CSV
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'violation-report.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            return { success: true, message: 'Report downloaded' };
        }

        return response.data;
    } catch (error) {
        console.error('Error exporting violation report:', error);
        throw error;
    }
};
