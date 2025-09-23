// frontend/src/services/inventoryService.js

import { axiosInstance } from '../contexts/AuthContext';

export const getInventory = async () => {
    const { data } = await axiosInstance.get('/inventory');
    return data;
};

export const addInventoryItem = async (itemData) => {
    const { data } = await axiosInstance.post('/inventory', itemData);
    return data;
};

export const updateInventoryItem = async (id, updateData) => {
    const { data } = await axiosInstance.put(`/inventory/${id}`, updateData);
    return data;
};

export const deleteInventoryItem = async (id) => {
    const { data } = await axiosInstance.delete(`/inventory/${id}`);
    return data;
};