// backend/controllers/inventory.controller.js

import Inventory from '../models/inventory.model.js';

// @desc    Get all inventory items for a farmer
// @route   GET /api/inventory
export const getInventory = async (req, res) => {
    try {
        const inventory = await Inventory.find({ farmerId: req.user._id }).sort({ expiryDate: 'asc' });
        res.json(inventory);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Add a new item to inventory
// @route   POST /api/inventory
export const addInventoryItem = async (req, res) => {
    try {
        const item = new Inventory({
            ...req.body,
            farmerId: req.user._id,
        });
        const createdItem = await item.save();
        res.status(201).json(createdItem);
    } catch (error) {
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ message: 'An inventory item with this drug name already exists.' });
        }
        res.status(400).json({ message: `Error adding item: ${error.message}` });
    }
};

// @desc    Update an inventory item
// @route   PUT /api/inventory/:id
export const updateInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);

        if (item && item.farmerId.toString() === req.user._id.toString()) {
            const updatedItem = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(updatedItem);
        } else {
            res.status(404).json({ message: 'Item not found or user not authorized.' });
        }
    } catch (error) {
        res.status(400).json({ message: `Error updating item: ${error.message}` });
    }
};

// @desc    Delete an inventory item
// @route   DELETE /api/inventory/:id
export const deleteInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);

        if (item && item.farmerId.toString() === req.user._id.toString()) {
            await item.deleteOne();
            res.json({ message: 'Inventory item removed.' });
        } else {
            res.status(404).json({ message: 'Item not found or user not authorized.' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};