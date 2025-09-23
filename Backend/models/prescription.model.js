// backend/models/prescription.model.js

import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
    treatmentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Treatment'
    },
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Farmer'
    },
    vetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Veterinarian'
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    // You can add more prescription-specific fields here if needed in the future
}, {
    timestamps: true
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;