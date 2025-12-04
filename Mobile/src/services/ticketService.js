import api from './api';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const createTicket = async (ticketData) => {
    const response = await api.post('/tickets', ticketData);
    return response.data;
};

export const getMyTickets = async (filters = {}) => {
    try {
        const response = await api.get('/tickets/my-tickets', { params: filters });
        await AsyncStorage.setItem('tickets_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('tickets_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch tickets' };
    }
};
