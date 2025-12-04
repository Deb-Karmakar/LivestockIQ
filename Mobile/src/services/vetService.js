import api from './api';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const getVetDashboardData = async () => {
    try {
        const response = await api.get('/vets/dashboard');
        await AsyncStorage.setItem('vet_dashboard_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('vet_dashboard_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch dashboard data' };
    }
};

export const getTreatmentRequests = async () => {
    try {
        const response = await api.get('/vets/treatment-requests');
        await AsyncStorage.setItem('vet_treatment_requests_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('vet_treatment_requests_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch treatment requests' };
    }
};

export const getMyFarmers = async () => {
    try {
        const response = await api.get('/vets/my-farmers');
        await AsyncStorage.setItem('vet_farmers_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('vet_farmers_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch farmers' };
    }
};

export const getFeedAdministrationRequests = async () => {
    try {
        const response = await api.get('/feed-admin/pending');
        await AsyncStorage.setItem('vet_feed_requests_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('vet_feed_requests_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch feed administration requests' };
    }
};

export const approveFeedAdministration = async (id, vetNotes) => {
    const response = await api.post(`/feed-admin/${id}/approve`, { vetNotes });
    return response.data;
};

export const rejectFeedAdministration = async (id, reason) => {
    const response = await api.post(`/feed-admin/${id}/reject`, { rejectionReason: reason });
    return response.data;
};

export const getVetProfile = async () => {
    try {
        const response = await api.get('/vets/profile');
        await AsyncStorage.setItem('vet_profile_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('vet_profile_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch profile' };
    }
};

export const getAnimalsForFarmer = async (farmerId) => {
    try {
        const response = await api.get(`/vets/farmers/${farmerId}/animals`);
        await AsyncStorage.setItem(`vet_farmer_animals_${farmerId}_cache`, JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem(`vet_farmer_animals_${farmerId}_cache`);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch animals' };
    }
};

export const reportFarmer = async (reportData) => {
    const response = await api.post('/vets/report-farmer', reportData);
    return response.data;
};

export const getVetPracticeOverviewData = async (from, to) => {
    try {
        const response = await api.get('/reports/vet/practice-overview-data', { params: { from, to } });
        await AsyncStorage.setItem('vet_report_practice_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('vet_report_practice_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch practice overview' };
    }
};

export const getVetPrescriptionAnalyticsData = async (from, to) => {
    try {
        const response = await api.get('/reports/vet/prescription-analytics-data', { params: { from, to } });
        await AsyncStorage.setItem('vet_report_prescription_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('vet_report_prescription_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch prescription analytics' };
    }
};

export const getVetFarmSupervisionData = async (from, to) => {
    try {
        const response = await api.get('/reports/vet/farm-supervision-data', { params: { from, to } });
        await AsyncStorage.setItem('vet_report_supervision_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('vet_report_supervision_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch farm supervision data' };
    }
};

export const getVetComplianceMonitoringData = async (from, to) => {
    try {
        const response = await api.get('/reports/vet/compliance-monitoring-data', { params: { from, to } });
        await AsyncStorage.setItem('vet_report_compliance_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('vet_report_compliance_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch compliance monitoring data' };
    }
};

export const getVetWhoAwareStewardshipData = async (from, to) => {
    try {
        const response = await api.get('/reports/vet/who-aware-stewardship-data', { params: { from, to } });
        await AsyncStorage.setItem('vet_report_who_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('vet_report_who_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch WHO AWaRe stewardship data' };
    }
};

export const getVetDetailsByCode = async (vetId) => {
    try {
        const response = await api.get(`/vets/code/${vetId}`);
        await AsyncStorage.setItem(`vet_details_${vetId}_cache`, JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem(`vet_details_${vetId}_cache`);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch vet details' };
    }
};
