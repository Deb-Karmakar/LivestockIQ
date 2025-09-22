import { axiosInstance } from '../contexts/AuthContext';

export const getTreatments = async () => {
    try {
        const { data } = await axiosInstance.get('/treatments');
        return data;
    } catch (error) {
        console.error("Error fetching treatments:", error);
        throw error;
    }
};

export const addTreatment = async (treatmentData) => {
    try {
        const { data } = await axiosInstance.post('/treatments', treatmentData);
        return data;
    } catch (error) {
        console.error("Error adding treatment:", error);
        throw error;
    }
};

export const updateTreatmentByVet = async (id, updateData) => {
    try {
        const { data } = await axiosInstance.put(`/treatments/${id}/vet-update`, updateData);
        return data;
    } catch (error) {
        console.error("Error updating treatment:", error);
        throw error;
    }
};