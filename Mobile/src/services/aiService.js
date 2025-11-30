// Mobile/src/services/aiService.js
import api from './api';

export const getAnimalHealthTip = async (animalId) => {
    try {
        const { data } = await api.post('/ai/health-tip', { animalId });
        return data; // Returns { tip: "..." }
    } catch (error) {
        console.error('Error fetching AI health tip:', error);
        throw error;
    }
};
