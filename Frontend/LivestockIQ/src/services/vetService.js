import { axiosInstance } from '../contexts/AuthContext';

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
    try {
        const { data } = await axiosInstance.get('/vets/treatment-requests');
        return data;
    } catch (error) {
        console.error("Error fetching treatment requests:", error);
        throw error;
    }
};

export const getAnimalsForFarmer = async (farmerId) => {
    const { data } = await axiosInstance.get(`/vets/farmers/${farmerId}/animals`);
    return data;
};

export const getVetProfile = async () => {
    const { data } = await axiosInstance.get('/vets/profile');
    return data;
};

export const updateVetProfile = async (profileData) => {
    const { data } = await axiosInstance.put('/vets/profile', profileData);
    return data;
};

export const reportFarmer = async (reportData) => {
    const { data } = await axiosInstance.post('/vets/report-farmer', reportData);
    return data;
};