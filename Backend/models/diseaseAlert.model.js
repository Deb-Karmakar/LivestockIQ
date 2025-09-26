// backend/models/diseaseAlert.model.js

import mongoose from 'mongoose';

const diseaseAlertSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Farmer'
    },
    diseaseName: {
        type: String,
        required: true
    },
    riskLevel: {
        type: String,
        required: true,
        enum: ['High', 'Moderate', 'Low']
    },
    message: {
        type: String,
        required: true,
    },
    preventiveMeasures: {
        type: [String], // An array of tips
        required: true
    },
    status: {
        type: String,
        enum: ['New', 'Acknowledged'],
        default: 'New'
    }
}, { timestamps: true });

const DiseaseAlert = mongoose.model('DiseaseAlert', diseaseAlertSchema);

export default DiseaseAlert;