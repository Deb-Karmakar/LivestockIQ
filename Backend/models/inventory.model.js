// backend/models/inventory.model.js

import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Farmer'
    },
    drugName: {
        type: String,
        required: [true, 'Drug name is required.'],
        trim: true,
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required.'],
        min: [0, 'Quantity cannot be negative.']
    },
    unit: {
        type: String, // e.g., 'ml', 'bottles', 'tablets'
        required: [true, 'Unit is required.'],
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        required: [true, 'Expiry date is required.'],
    },
    supplier: {
        type: String,
        trim: true,
    },
    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true
});

// Ensure a farmer cannot have two inventory items with the same drug name
inventorySchema.index({ farmerId: 1, drugName: 1 }, { unique: true });

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;