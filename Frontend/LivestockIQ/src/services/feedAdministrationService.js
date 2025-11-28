import { axiosInstance } from '../contexts/AuthContext';

// Get all feed administrations for the authenticated farmer
export const getFeedAdministrations = async (filters = {}) => {
    try {
        const { data } = await axiosInstance.get('/feed-admin', { params: filters });
        return data;
    } catch (error) {
        console.error("Error fetching feed administrations:", error);
        throw error;
    }
};

// Get specific feed administration by ID
export const getFeedAdministrationById = async (id) => {
    try {
        const { data } = await axiosInstance.get(`/feed-admin/${id}`);
        return data;
    } catch (error) {
        console.error("Error fetching feed administration:", error);
        throw error;
    }
};

// Record new feed administration
export const recordFeedAdministration = async (administrationData) => {
    try {
        const { data } = await axiosInstance.post('/feed-admin', administrationData);
        return data;
    } catch (error) {
        console.error("Error recording feed administration:", error);
        throw error;
    }
};

// Update feed administration
export const updateFeedAdministration = async (id, updateData) => {
    try {
        const { data } = await axiosInstance.put(`/feed-admin/${id}`, updateData);
        return data;
    } catch (error) {
        console.error("Error updating feed administration:", error);
        throw error;
    }
};

// Delete feed administration
export const deleteFeedAdministration = async (id) => {
    try {
        const { data } = await axiosInstance.delete(`/feed-admin/${id}`);
        return data;
    } catch (error) {
        console.error("Error deleting feed administration:", error);
        throw error;
    }
};

// Get active feeding programs
export const getActivePrograms = async () => {
    try {
        const { data } = await axiosInstance.get('/feed-admin/active');
        return data;
    } catch (error) {
        console.error("Error fetching active programs:", error);
        throw error;
    }
};

// Complete feeding program
export const completeFeedingProgram = async (id, endDate) => {
    try {
        const { data } = await axiosInstance.post(`/feed-admin/${id}/complete`, { endDate });
        return data;
    } catch (error) {
        console.error("Error completing feeding program:", error);
        throw error;
    }
};

// Get feed administration history for specific animal
export const getAnimalFeedHistory = async (animalId) => {
    try {
        const { data } = await axiosInstance.get(`/feed-admin/animal/${animalId}`);
        return data;
    } catch (error) {
        console.error("Error fetching animal feed history:", error);
        throw error;
    }
};

// Get animals currently in withdrawal period from feed
export const getWithdrawalStatus = async () => {
    try {
        const { data } = await axiosInstance.get('/feed-admin/withdrawal-status');
        return data;
    } catch (error) {
        console.error("Error fetching withdrawal status:", error);
        throw error;
    }
};

// Approve feed administration (Vet only)
export const approveFeedAdministration = async (id) => {
    try {
        const { data } = await axiosInstance.post(`/feed-admin/${id}/approve`);
        return data;
    } catch (error) {
        console.error("Error approving feed administration:", error);
        throw error;
    }
};
