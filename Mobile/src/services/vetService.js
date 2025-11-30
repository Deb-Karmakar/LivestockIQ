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

export const getVetProfile = async () => {
    const response = await api.get('/vets/profile');
    return response.data;
};
