import { axiosInstance } from '../contexts/AuthContext';
import {
    saveOfflineVet,
    getOfflineVets,
    updateOfflineVet,
    getOfflineVetDashboard,
    cacheVetDashboard,
    getOfflineTreatmentRequests,
    cacheTreatmentRequests,
    cacheVetProfile,
    getOfflineMyFarmers,
    cacheMyFarmers,
    getOfflineFarmerAnimals,
    cacheFarmerAnimals,
    saveOfflineReport
} from './offlineService';

// Fetches a vet's public details by their unique code
export const getVetDetailsByCode = async (vetId) => {
    try {
        const { data } = await axiosInstance.get(`/vets/code/${vetId}`);
        return data;
    } catch (error) {
        console.error("Error fetching vet details:", error);
        throw error;
    }
};

export const getTreatmentRequests = async () => {
    if (!navigator.onLine) {
        return await getOfflineTreatmentRequests();
    }
    try {
        const { data } = await axiosInstance.get('/vets/treatment-requests');
        await cacheTreatmentRequests(data);
        return data;
    } catch (error) {
        console.error("Error fetching treatment requests:", error);
        return await getOfflineTreatmentRequests();
    }
};

export const getAnimalsForFarmer = async (farmerId) => {
    if (!navigator.onLine) {
        return await getOfflineFarmerAnimals(farmerId);
    }
    try {
        const { data } = await axiosInstance.get(`/vets/farmers/${farmerId}/animals`);
        await cacheFarmerAnimals(farmerId, data);
        return data;
    } catch (error) {
        console.error("Error fetching farmer animals:", error);
        return await getOfflineFarmerAnimals(farmerId);
    }
};

export const getVetProfile = async () => {
    if (!navigator.onLine) {
        const vets = await getOfflineVets();
        return vets[0] || null;
    }
    try {
        const { data } = await axiosInstance.get('/vets/profile');
        await cacheVetProfile(data);
        return data;
    } catch (error) {
        console.error("Error fetching vet profile:", error);
        const vets = await getOfflineVets();
        return vets[0] || null;
    }
};

export const updateVetProfile = async (profileData) => {
    if (!navigator.onLine) {
        const vets = await getOfflineVets();
        const vet = vets[0];
        if (vet) {
            await updateOfflineVet(vet.id, profileData);
            return { ...vet, ...profileData };
        } else {
            console.warn("No local vet profile found to update");
            return profileData;
        }
    }
    const { data } = await axiosInstance.put('/vets/profile', profileData);
    return data;
};

export const reportFarmer = async (reportData) => {
    if (!navigator.onLine) {
        return await saveOfflineReport(reportData);
    }
    try {
        const { data } = await axiosInstance.post('/vets/report-farmer', reportData);
        return data;
    } catch (error) {
        console.error("Error reporting farmer:", error);
        throw error;
    }
};

export const getMyFarmers = async () => {
    if (!navigator.onLine) {
        return await getOfflineMyFarmers();
    }
    try {
        const { data } = await axiosInstance.get('vets/my-farmers');
        await cacheMyFarmers(data);
        return data;
    } catch (error) {
        console.error("Error fetching my farmers:", error);
        return await getOfflineMyFarmers();
    }
};

export const getVetDashboardData = async () => {
    if (!navigator.onLine) {
        return await getOfflineVetDashboard();
    }
    try {
        const { data } = await axiosInstance.get('/vets/dashboard');
        await cacheVetDashboard(data);
        return data;
    } catch (error) {
        console.error("Error fetching vet dashboard data:", error);
        return await getOfflineVetDashboard();
    }
};

// Feed Administration Requests for Vets
export const getFeedAdministrationRequests = async () => {
    try {
        const { data } = await axiosInstance.get('/feed-admin/pending');
        return data;
    } catch (error) {
        console.error("Error fetching feed administration requests:", error);
        throw error;
    }
};

export const approveFeedAdministration = async (id, vetNotes) => {
    try {
        const { data } = await axiosInstance.post(`/feed-admin/${id}/approve`, { vetNotes });
        return data;
    } catch (error) {
        console.error("Error approving feed administration:", error);
        throw error;
    }
};

export const rejectFeedAdministration = async (id, rejectionReason) => {
    try {
        const { data } = await axiosInstance.post(`/feed-admin/${id}/reject`, { rejectionReason });
        return data;
    } catch (error) {
        console.error("Error rejecting feed administration:", error);
        throw error;
    }
};

// Add treatment directly by vet (auto-approved)
export const addTreatmentByVet = async (treatmentData) => {
    try {
        const { data } = await axiosInstance.post('/treatments/vet-entry', treatmentData);
        return data;
    } catch (error) {
        console.error("Error adding treatment by vet:", error);
        throw error;
    }
};