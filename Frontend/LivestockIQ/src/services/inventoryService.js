// frontend/src/services/inventoryService.js

import { axiosInstance } from '../contexts/AuthContext';
import {
    getOfflineInventory,
    saveOfflineInventory,
    updateOfflineInventory,
    cacheInventory
} from './offlineService';

export const getInventory = async () => {
    if (!navigator.onLine) {
        return await getOfflineInventory();
    }
    try {
        const { data } = await axiosInstance.get('/inventory');
        await cacheInventory(data);
        return data;
    } catch (error) {
        console.error("Error fetching inventory:", error);
        return await getOfflineInventory();
    }
};

export const addInventoryItem = async (itemData) => {
    if (!navigator.onLine) {
        return await saveOfflineInventory(itemData);
    }
    const { data } = await axiosInstance.post('/inventory', itemData);
    return data;
};

export const updateInventoryItem = async (id, updateData) => {
    if (!navigator.onLine) {
        return await updateOfflineInventory(id, updateData);
    }
    const { data } = await axiosInstance.put(`/inventory/${id}`, updateData);
    return data;
};

export const deleteInventoryItem = async (id) => {
    const { data } = await axiosInstance.delete(`/inventory/${id}`);
    return data;
};