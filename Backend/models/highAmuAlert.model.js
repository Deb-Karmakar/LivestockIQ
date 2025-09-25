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
        // UPDATED: Added the new alert type to the enum list
        enum: ['HISTORICAL_SPIKE', 'PEER_COMPARISON_SPIKE'] 
    },
    message: {
        type: String,
        required: true,
    },
    details: { // This object now holds details for either alert type
        // Fields for HISTORICAL_SPIKE
        currentWeekCount: Number,
        historicalWeeklyAverage: Number,

        // NEW: Fields for PEER_COMPARISON_SPIKE
        farmMonthlyUsage: Number,
        peerMonthlyAverage: Number,

        // Common field
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