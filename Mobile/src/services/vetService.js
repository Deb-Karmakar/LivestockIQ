import api from './api';

export const getVetDashboardData = async () => {
    const response = await api.get('/vets/dashboard');
    return response.data;
};

export const getTreatmentRequests = async () => {
    const response = await api.get('/vets/treatment-requests');
    return response.data;
};

export const getMyFarmers = async () => {
    const response = await api.get('/vets/my-farmers');
    return response.data;
};

export const getFeedAdministrationRequests = async () => {
    const response = await api.get('/feed-admin/pending');
    return response.data;
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
    const response = await api.get('/vets/profile');
    return response.data;
};

export const getAnimalsForFarmer = async (farmerId) => {
    const response = await api.get(`/vets/farmers/${farmerId}/animals`);
    return response.data;
};

export const reportFarmer = async (reportData) => {
    const response = await api.post('/vets/report-farmer', reportData);
    return response.data;
};

export const getVetPracticeOverviewData = async (from, to) => {
    const response = await api.get('/reports/vet/practice-overview-data', { params: { from, to } });
    return response.data;
};

export const getVetPrescriptionAnalyticsData = async (from, to) => {
    const response = await api.get('/reports/vet/prescription-analytics-data', { params: { from, to } });
    return response.data;
};

export const getVetFarmSupervisionData = async (from, to) => {
    const response = await api.get('/reports/vet/farm-supervision-data', { params: { from, to } });
    return response.data;
};

export const getVetComplianceMonitoringData = async (from, to) => {
    const response = await api.get('/reports/vet/compliance-monitoring-data', { params: { from, to } });
    return response.data;
};

export const getVetWhoAwareStewardshipData = async (from, to) => {
    const response = await api.get('/reports/vet/who-aware-stewardship-data', { params: { from, to } });
    return response.data;
};

export const getVetDetailsByCode = async (vetId) => {
    const response = await api.get(`/vets/code/${vetId}`);
    return response.data;
};
