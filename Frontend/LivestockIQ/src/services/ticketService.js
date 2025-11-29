import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    return userInfo?.token || localStorage.getItem('token');
};

// ========================================
// USER TICKET FUNCTIONS
// ========================================

/**
 * Create a new support ticket
 * @param {Object} ticketData - Ticket details (subject, description, category, priority)
 */
export const createTicket = async (ticketData) => {
    try {
        const token = getAuthToken();
        const response = await axios.post(`${API_URL}/tickets`, ticketData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating ticket:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get user's own tickets
 * @param {Object} filters - Optional filters (status, priority, category, sortBy, order)
 */
export const getUserTickets = async (filters = {}) => {
    try {
        const token = getAuthToken();
        const queryParams = new URLSearchParams(filters).toString();
        const response = await axios.get(`${API_URL}/tickets/my-tickets?${queryParams}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching user tickets:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get single ticket by ID
 * @param {string} ticketId - Ticket ID
 */
export const getTicketById = async (ticketId) => {
    try {
        const token = getAuthToken();
        const response = await axios.get(`${API_URL}/tickets/${ticketId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching ticket:', error);
        throw error.response?.data || error;
    }
};

// ========================================
// ADMIN TICKET FUNCTIONS
// ========================================

/**
 * Get all tickets (admin only)
 * @param {Object} filters - Filters (status, priority, category, role, search, startDate, endDate, page, limit)
 */
export const getAllTickets = async (filters = {}) => {
    try {
        const token = getAuthToken();
        const queryParams = new URLSearchParams();

        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
                queryParams.append(key, filters[key]);
            }
        });

        const response = await axios.get(`${API_URL}/tickets/admin/all?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching all tickets:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get ticket statistics (admin only)
 */
export const getTicketStats = async () => {
    try {
        const token = getAuthToken();
        const response = await axios.get(`${API_URL}/tickets/admin/stats`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching ticket stats:', error);
        throw error.response?.data || error;
    }
};

/**
 * Update ticket status (admin only)
 * @param {string} ticketId - Ticket ID
 * @param {string} status - New status
 * @param {string} note - Optional note
 */
export const updateTicketStatus = async (ticketId, status, note = '') => {
    try {
        const token = getAuthToken();
        const response = await axios.patch(
            `${API_URL}/tickets/${ticketId}/status`,
            { status, note },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating ticket status:', error);
        throw error.response?.data || error;
    }
};

/**
 * Respond to a ticket (admin only)
 * @param {string} ticketId - Ticket ID
 * @param {string} response - Admin response message
 */
export const respondToTicket = async (ticketId, response) => {
    try {
        const token = getAuthToken();
        const result = await axios.post(
            `${API_URL}/tickets/${ticketId}/respond`,
            { response },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return result.data;
    } catch (error) {
        console.error('Error responding to ticket:', error);
        throw error.response?.data || error;
    }
};

/**
 * Resolve a ticket (admin only)
 * @param {string} ticketId - Ticket ID
 * @param {string} resolutionNote - Optional resolution note
 */
export const resolveTicket = async (ticketId, resolutionNote = '') => {
    try {
        const token = getAuthToken();
        const response = await axios.patch(
            `${API_URL}/tickets/${ticketId}/resolve`,
            { resolutionNote },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error resolving ticket:', error);
        throw error.response?.data || error;
    }
};

export default {
    createTicket,
    getUserTickets,
    getTicketById,
    getAllTickets,
    getTicketStats,
    updateTicketStatus,
    respondToTicket,
    resolveTicket,
};
