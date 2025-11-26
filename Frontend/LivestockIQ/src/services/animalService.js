import { axiosInstance } from '../contexts/AuthContext';
import {
    getOfflineAnimals,
    saveOfflineAnimal,
    updateOfflineAnimal,
    cacheAnimals
} from './offlineService';

// Get all animals for the authenticated farmer
export const getAnimals = async () => {
    if (!navigator.onLine) {
        return await getOfflineAnimals();
    }

    try {
        console.log("Making API call to /animals");
        const { data } = await axiosInstance.get('/animals');
        console.log("API response:", data);
        await cacheAnimals(data);
        return data;
    } catch (error) {
        console.error("Error fetching animals:", error);
        // Fallback to offline data if API fails
        return await getOfflineAnimals();
    }
};

// Add a new animal
export const addAnimal = async (animalData) => {
    if (!navigator.onLine) {
        return await saveOfflineAnimal(animalData);
    }

    try {
        const { data } = await axiosInstance.post('/animals', animalData);
        return data;
    } catch (error) {
        console.error("Error adding animal:", error);
        throw error;
    }
};

// Updates an existing animal
export const updateAnimal = async (id, updateData) => {
    if (!navigator.onLine) {
        return await updateOfflineAnimal(id, updateData);
    }

    try {
        const { data } = await axiosInstance.put(`/animals/${id}`, updateData);
        return data;
    } catch (error) {
        console.error("Error updating animal:", error);
        throw error;
    }
};

// Deletes an animal
export const deleteAnimal = async (id) => {
    try {
        const { data } = await axiosInstance.delete(`/animals/${id}`);
        return data;
    } catch (error) {
        console.error("Error deleting animal:", error);
        throw error;
    }
};

export const getAnimalHistory = async (animalId) => {
    try {
        const { data } = await axiosInstance.get(`/animals/${animalId}/history`);
        return data;
    } catch (error) {
        console.error("Error fetching animal history:", error);
        throw error;
    }
};