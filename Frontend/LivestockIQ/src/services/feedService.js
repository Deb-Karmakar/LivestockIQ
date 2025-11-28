import { axiosInstance } from '../contexts/AuthContext';

// Get all medicated feed inventory for the authenticated farmer
export const getFeedInventory = async (includeInactive = false) => {
    try {
        const params = includeInactive ? { includeInactive: true } : {};
        const { data } = await axiosInstance.get('/feed', { params });
        return data;
    } catch (error) {
        console.error("Error fetching feed inventory:", error);
        throw error;
    }
};

// Get specific feed item by ID
export const getFeedById = async (id) => {
    try {
        const { data } = await axiosInstance.get(`/feed/${id}`);
        return data;
    } catch (error) {
        console.error("Error fetching feed item:", error);
        throw error;
    }
};

// Add new medicated feed to inventory
export const addFeedItem = async (feedData) => {
    try {
        const { data } = await axiosInstance.post('/feed', feedData);
        return data;
    } catch (error) {
        console.error("Error adding feed item:", error);
        throw error;
    }
};

// Update feed inventory item
export const updateFeedItem = async (id, updateData) => {
    try {
        const { data } = await axiosInstance.put(`/feed/${id}`, updateData);
        return data;
    } catch (error) {
        console.error("Error updating feed item:", error);
        throw error;
    }
};

// Delete feed inventory item
export const deleteFeedItem = async (id) => {
    try {
        const { data } = await axiosInstance.delete(`/feed/${id}`);
        return data;
    } catch (error) {
        console.error("Error deleting feed item:", error);
        throw error;
    }
};

// Get feed expiring within specified days
export const getExpiringFeed = async (days = 30) => {
    try {
        const { data } = await axiosInstance.get(`/feed/expiring/${days}`);
        return data;
    } catch (error) {
        console.error("Error fetching expiring feed:", error);
        throw error;
    }
};

// Get active medicated feed
export const getActiveFeed = async () => {
    try {
        const { data } = await axiosInstance.get('/feed/active');
        return data;
    } catch (error) {
        console.error("Error fetching active feed:", error);
        throw error;
    }
};

// Get feed inventory statistics
export const getFeedStats = async () => {
    try {
        const { data } = await axiosInstance.get('/feed/stats');
        return data;
    } catch (error) {
        console.error("Error fetching feed stats:", error);
        throw error;
    }
};

// Update feed quantity after consumption
export const consumeFeed = async (id, quantityUsed) => {
    try {
        const { data } = await axiosInstance.patch(`/feed/${id}/consume`, { quantityUsed });
        return data;
    } catch (error) {
        console.error("Error consuming feed:", error);
        throw error;
    }
};
