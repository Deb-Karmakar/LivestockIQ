import api from './api';

export const createTicket = async (ticketData) => {
    const response = await api.post('/tickets', ticketData);
    return response.data;
};

export const getMyTickets = async (filters = {}) => {
    const response = await api.get('/tickets/my-tickets', { params: filters });
    return response.data;
};
