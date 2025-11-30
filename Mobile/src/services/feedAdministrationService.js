import api from './api';

export const getFeedAdministrations = async (filters = {}) => {
    const response = await api.get('/feed-admin', { params: filters });
    return response.data;
};

export const getFeedAdministrationById = async (id) => {
    const response = await api.get(`/feed-admin/${id}`);
    return response.data;
};

export const recordFeedAdministration = async (administrationData) => {
    const response = await api.post('/feed-admin', administrationData);
    return response.data;
};

export const updateFeedAdministration = async (id, updateData) => {
    const response = await api.put(`/feed-admin/${id}`, updateData);
    return response.data;
};

export const deleteFeedAdministration = async (id) => {
    const response = await api.delete(`/feed-admin/${id}`);
    return response.data;
};

export const getActivePrograms = async () => {
    const response = await api.get('/feed-admin/active');
    return response.data;
};

export const completeFeedingProgram = async (id, endDate) => {
    const response = await api.post(`/feed-admin/${id}/complete`, { endDate });
    return response.data;
};

export const getAnimalFeedHistory = async (animalId) => {
    const response = await api.get(`/feed-admin/animal/${animalId}`);
    return response.data;
};

export const getWithdrawalStatus = async () => {
    const response = await api.get('/feed-admin/withdrawal-status');
    return response.data;
};
