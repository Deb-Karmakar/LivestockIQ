import api from './api';

export const getInventory = async () => {
    const response = await api.get('/inventory');
    return response.data;
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
