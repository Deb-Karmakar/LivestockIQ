import api from './api';

export const getFeedInventory = async (includeInactive = false) => {
    const params = includeInactive ? { includeInactive: true } : {};
    const response = await api.get('/feed', { params });
    return response.data;
};

export const getFeedById = async (id) => {
    const response = await api.get(`/feed/${id}`);
    return response.data;
};

export const addFeedItem = async (feedData) => {
    const response = await api.post('/feed', feedData);
    return response.data;
};

export const updateFeedItem = async (id, updateData) => {
    const response = await api.put(`/feed/${id}`, updateData);
    return response.data;
};

export const deleteFeedItem = async (id) => {
    const response = await api.delete(`/feed/${id}`);
    return response.data;
};

export const getFeedStats = async () => {
    const response = await api.get('/feed/stats');
    return response.data;
};

export const getActiveFeed = async () => {
    const response = await api.get('/feed/active');
    return response.data;
};

export const getExpiringFeed = async (days = 30) => {
    const response = await api.get(`/feed/expiring/${days}`);
    return response.data;
};

export const consumeFeed = async (id, quantityUsed) => {
    const response = await api.patch(`/feed/${id}/consume`, { quantityUsed });
    return response.data;
};
