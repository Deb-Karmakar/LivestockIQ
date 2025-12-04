// Mobile/src/services/animalService.js
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getAnimals = async () => {
    try {
        const response = await api.get('/animals');
        await AsyncStorage.setItem('animals_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('animals_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error.response?.data || { message: 'Failed to fetch animals' };
    }
};

export const getAnimalByTag = async (tagId) => {
    try {
        const response = await api.get(`/animals/${tagId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Animal not found' };
    }
};

export const createAnimal = async (animalData) => {
    try {
        const response = await api.post('/animals', animalData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to create animal' };
    }
};

export const updateAnimal = async (tagId, animalData) => {
    try {
        const response = await api.put(`/animals/${tagId}`, animalData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to update animal' };
    }
};

export const deleteAnimal = async (tagId) => {
    try {
        const response = await api.delete(`/animals/${tagId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to delete animal' };
    }
};

export const getAnimalHistory = async (animalId) => {
    try {
        const response = await api.get(`/animals/${animalId}/history`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch animal history' };
    }
};
