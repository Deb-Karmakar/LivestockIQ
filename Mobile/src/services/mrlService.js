import api from './api';

export const getAnimalMRLStatus = async (animalId) => {
    try {
        const response = await api.get(`/mrl/animal/${animalId}/status`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch MRL status' };
    }
};

export const getPendingMRLTests = async () => {
    try {
        const response = await api.get('/mrl/pending-tests');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch pending MRL tests' };
    }
};

export const submitLabTest = async (testData) => {
    try {
        const response = await api.post('/mrl/test-result', testData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to submit lab test' };
    }
};

export const getLabTestHistory = async () => {
    try {
        const response = await api.get('/mrl/my-tests');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch lab test history' };
    }
};
