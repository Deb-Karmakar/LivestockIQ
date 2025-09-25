// backend/models/highAmuAlert.model.js

import mongoose from 'mongoose';

const highAmuAlertSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Farmer'
    },
    alertType: {
        type: String,
        required: true,
        enum: ['HISTORICAL_SPIKE'] // Can add 'PEER_COMPARISON_SPIKE' later
    },
    message: {
        type: String,
        required: true,
    },
    details: { // To store the data that triggered the alert
        currentWeekCount: Number,
        historicalWeeklyAverage: Number,
        threshold: String,
    },
    status: {
        type: String,
        enum: ['New', 'Acknowledged'],
        default: 'New'
    }
}, { timestamps: true });

const HighAmuAlert = mongoose.model('HighAmuAlert', highAmuAlertSchema);

export default HighAmuAlert;