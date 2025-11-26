// frontend/src/services/farmerService.js
import { axiosInstance } from '../contexts/AuthContext';
import {
    saveOfflineFarmer,
    updateOfflineFarmer,
    getOfflineFarmers,
    getOfflineAmuAlerts,
    cacheAmuAlerts,
    getOfflineDiseaseAlerts,
    cacheDiseaseAlerts,
    cacheFarmerProfile
} from './offlineService';

export const getMyProfile = async () => {
    if (!navigator.onLine) {
        console.log("Offline: Fetching farmer profile from local DB");
        const farmers = await getOfflineFarmers();
        return farmers[0] || null;
    }
    try {
        const { data } = await axiosInstance.get('/farmers/profile');
        await cacheFarmerProfile(data);
        return data;
    } catch (error) {
        console.error("Error fetching farmer profile:", error);
        // Fallback to offline if online fetch fails
        const farmers = await getOfflineFarmers();
        return farmers[0] || null;
    }
};

export const getMyHighAmuAlerts = async () => {
    if (!navigator.onLine) {
        return await getOfflineAmuAlerts();
    }
    try {
        const { data } = await axiosInstance.get('/farmers/high-amu-alerts');
        await cacheAmuAlerts(data);
        return data;
    } catch (error) {
        console.error("Error fetching high AMU alerts:", error);
        return await getOfflineAmuAlerts();
    }
};

export const getHighAmuAlertDetails = async (alertId) => {
    try {
        const { data } = await axiosInstance.get(`/farmers/high-amu-alerts/${alertId}/details`);
        return data;
    } catch (error) {
        console.error("Error fetching high AMU alert details:", error);
        throw error;
    }
};

export const updateMyProfile = async (profileData) => {
    if (!navigator.onLine) {
        console.log("Offline: Queuing farmer profile update");
        const farmers = await getOfflineFarmers();
        const farmer = farmers[0];
        if (farmer) {
            await updateOfflineFarmer(farmer.id, profileData);
            return { ...farmer, ...profileData };
        } else {
            console.warn("No local farmer profile found to update");
            return profileData;
        }
    }
    try {
        const { data } = await axiosInstance.put('/farmers/profile', profileData);
        return data;
    } catch (error) {
        console.error("Error updating farmer profile:", error);
        throw error;
    }
};

export const getMyDiseaseAlerts = async () => {
    if (!navigator.onLine) {
        return await getOfflineDiseaseAlerts();
    }
    try {
        const { data } = await axiosInstance.get('/farmers/disease-alerts');
        await cacheDiseaseAlerts(data);
        return data;
    } catch (error) {
        console.error("Error fetching disease alerts:", error);
        return await getOfflineDiseaseAlerts();
    }
};