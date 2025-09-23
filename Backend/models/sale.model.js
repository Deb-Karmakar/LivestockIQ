// backend/models/sale.model.js

import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
    animalId: {
        type: String, // The 12-digit Tag ID
        required: true,
    },
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Farmer'
    },
    productType: {
        type: String,
        required: true,
        enum: ['Milk', 'Meat', 'Other'] // Restrict to specific product types
    },
    quantity: {
        type: Number,
        required: true
    },
    unit: {
        type: String, // e.g., 'Liters', 'kg'
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    saleDate: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;