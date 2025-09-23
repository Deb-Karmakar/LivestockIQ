// backend/models/treatment.model.js

import mongoose from 'mongoose';

const treatmentSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Farmer'
    },
    animalId: {
        type: String, // The 12-digit Tag ID
        required: true,
    },
    drugName: {
        type: String,
        required: true,
    },
    dose: { type: String },
    route: { type: String },
    startDate: {
        type: Date,
        required: true,
    },
    withdrawalEndDate: {
        type: Date,
    },
    vetId: {
        type: String, // The Vet's unique code
    },
    vetSigned: {
        type: Boolean,
        default: false,
    },
    notes: { type: String },
    vetNotes: { type: String },
    attachment: { type: String },
    
    // --- NEW FIELD ---
    // Add the status field so Mongoose can save it
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },

}, {
    timestamps: true // Essential for offline sync
});

const Treatment = mongoose.model('Treatment', treatmentSchema);
export default Treatment;