import { axiosInstance } from '../contexts/AuthContext';

// Get all animals for the authenticated farmer
export const getAnimals = async () => {
    try {
        console.log("Making API call to /animals");
        const { data } = await axiosInstance.get('/animals');
        console.log("API response:", data);
        return data;
    } catch (error) {
        console.error("Error fetching animals:", error);
        console.error("Error details:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: error.config?.url
        });
        throw error;
    }
};

// Add a new animal
export const addAnimal = async (animalData) => {
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