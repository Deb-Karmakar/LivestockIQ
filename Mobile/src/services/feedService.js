import api from './api';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const getFeedInventory = async (includeInactive = false) => {
    try {
        const params = includeInactive ? { includeInactive: true } : {};
        const response = await api.get('/feed', { params });
        await AsyncStorage.setItem('feed_inventory_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('feed_inventory_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch feed inventory' };
    }
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
    try {
        const response = await api.get('/feed/stats');
        await AsyncStorage.setItem('feed_stats_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('feed_stats_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch feed stats' };
    }
};

export const getActiveFeed = async () => {
    try {
        const response = await api.get('/feed/active');
        await AsyncStorage.setItem('active_feed_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('active_feed_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch active feed' };
    }
};

export const getExpiringFeed = async (days = 30) => {
    const response = await api.get(`/feed/expiring/${days}`);
    return response.data;
};

export const consumeFeed = async (id, quantityUsed) => {
    const response = await api.patch(`/feed/${id}/consume`, { quantityUsed });
    return response.data;
};
