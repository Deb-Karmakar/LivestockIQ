import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getInventory = async () => {
    try {
        const response = await api.get('/inventory');
        await AsyncStorage.setItem('inventory_cache', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        const cachedData = await AsyncStorage.getItem('inventory_cache');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        throw error;
    }
};

export const addInventoryItem = async (itemData) => {
    const response = await api.post('/inventory', itemData);
    return response.data;
};

export const updateInventoryItem = async (id, updateData) => {
    const response = await api.put(`/inventory/${id}`, updateData);
    return response.data;
};

export const deleteInventoryItem = async (id) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
};
