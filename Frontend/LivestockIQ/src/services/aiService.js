// frontend/src/services/aiService.js
import { axiosInstance } from '../contexts/AuthContext';

export const getAnimalHealthTip = async (animalId) => {
    try {
        // Send the animal's database ID to the backend
        const { data } = await axiosInstance.post('/ai/health-tip', { animalId });
        return data; // This will return an object like { tip: "..." }
    } catch (error) {
        console.error("Error fetching AI health tip:", error);
        throw error;
    }
};

export const getRegulatorInsights = async () => {
    try {
        const { data } = await axiosInstance.post('/ai/regulator-insights');
        return data; // Returns { insights: "..." }
    } catch (error) {
        console.error("Error fetching regulator insights:", error);
        throw error;
    }
};