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
        enum: [
            'HISTORICAL_SPIKE',      // Spike compared to farm's own history
            'PEER_COMPARISON_SPIKE', // High compared to similar farms
            'ABSOLUTE_THRESHOLD',    // Exceeds absolute threshold
            'TREND_INCREASE',        // Increasing pattern over 3 months
            'CRITICAL_DRUG_USAGE',   // High usage of Watch/Reserve drugs
            'SUSTAINED_HIGH_USAGE'   // Consistently high for extended period
        ]
    },

    // Risk severity scoring
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },

    message: {
        type: String,
        required: true,
    },

    details: {
        // Fields for HISTORICAL_SPIKE
        currentWeekCount: Number,
        historicalWeeklyAverage: Number,

        // Fields for PEER_COMPARISON_SPIKE
        farmMonthlyUsage: Number,
        farmIntensity: Number,
        peerAverageIntensity: Number,

        // Fields for ABSOLUTE_THRESHOLD
        currentIntensity: Number,
        thresholdIntensity: Number,

        // Fields for TREND_INCREASE
        currentMonthUsage: Number,
        previousMonthUsage: Number,
        threeMonthsAgoUsage: Number,
        percentageIncrease: Number,

        // Fields for CRITICAL_DRUG_USAGE
        totalAmuEvents: Number,
        criticalDrugEvents: Number,
        criticalDrugPercentage: Number,
        watchDrugCount: Number,
        reserveDrugCount: Number,

        // Fields for SUSTAINED_HIGH_USAGE
        weeksAboveThreshold: Number,
        averageIntensity: Number,

        // Common fields
        threshold: String,
        breakdown: String, // Treatments vs Feed breakdown

        // Drug class breakdown
        drugClassBreakdown: {
            access: Number,    // WHO Access category
            watch: Number,     // WHO Watch category
            reserve: Number,   // WHO Reserve category
            unclassified: Number
        }
    },

    status: {
        type: String,
        enum: ['New', 'Acknowledged', 'Resolved'],
        default: 'New'
    },

    // Actions taken
    acknowledgedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Regulator'
    },
    acknowledgedAt: Date,
    notes: String

}, { timestamps: true });

// Index for efficient querying
highAmuAlertSchema.index({ farmerId: 1, status: 1, alertType: 1 });
highAmuAlertSchema.index({ createdAt: -1 });
highAmuAlertSchema.index({ severity: 1 });

const HighAmuAlert = mongoose.model('HighAmuAlert', highAmuAlertSchema);

export default HighAmuAlert;