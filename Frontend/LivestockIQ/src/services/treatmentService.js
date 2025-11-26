import { axiosInstance } from '../contexts/AuthContext';
import {
    getOfflineTreatments,
    saveOfflineTreatment,
    updateOfflineTreatment,
    cacheTreatments
} from './offlineService';

export const getTreatments = async () => {
    if (!navigator.onLine) {
        return await getOfflineTreatments();
    }
    try {
        const { data } = await axiosInstance.get('/treatments');
        await cacheTreatments(data);
        return data;
    } catch (error) {
        console.error("Error fetching treatments:", error);
        return await getOfflineTreatments();
    }
};

export const addTreatment = async (treatmentData) => {
    if (!navigator.onLine) {
        return await saveOfflineTreatment(treatmentData);
    }
    try {
        const { data } = await axiosInstance.post('/treatments', treatmentData);
        return data;
    } catch (error) {
        console.error("Error adding treatment:", error);
        throw error;
    }
};

export const updateTreatmentByVet = async (id, updateData) => {
    if (!navigator.onLine) {
        return await updateOfflineTreatment(id, updateData);
    }
    try {
        const { data } = await axiosInstance.put(`/treatments/${id}/vet-update`, updateData);
        return data;
    } catch (error) {
        console.error("Error updating treatment:", error);
        throw error;
    }
};