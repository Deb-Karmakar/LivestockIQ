import mongoose from 'mongoose';

const amuConfigSchema = new mongoose.Schema({
    // Historical spike detection threshold
    historicalSpikeThreshold: {
        type: Number,
        default: 2.0, // 200% of historical average
        min: 1.0,
        max: 5.0,
        description: 'Multiplier for historical weekly average to trigger spike alert'
    },

    // Peer comparison threshold
    peerComparisonThreshold: {
        type: Number,
        default: 1.5, // 150% of peer average
        min: 1.0,
        max: 3.0,
        description: 'Multiplier for peer group average to trigger comparison alert'
    },

    // Absolute intensity threshold (treatments per animal per month)
    absoluteIntensityThreshold: {
        type: Number,
        default: 0.5, // 0.5 treatments per animal per month
        min: 0.1,
        max: 2.0,
        description: 'Absolute AMU intensity threshold regardless of history or peers'
    },

    // Trend increase threshold
    trendIncreaseThreshold: {
        type: Number,
        default: 0.30, // 30% increase over 3 months
        min: 0.10,
        max: 1.0,
        description: 'Percentage increase in AMU over 3 months to trigger trend alert'
    },

    // Critical drug usage percentage threshold
    criticalDrugThreshold: {
        type: Number,
        default: 0.40, // 40% of total AMU
        min: 0.20,
        max: 0.80,
        description: 'Percentage of Watch/Reserve drugs in total AMU to trigger alert'
    },

    // Sustained high usage duration (in weeks)
    sustainedHighUsageDuration: {
        type: Number,
        default: 4, // 4 consecutive weeks
        min: 2,
        max: 12,
        description: 'Number of consecutive weeks of high usage to trigger alert'
    },

    // Minimum events threshold to avoid noise
    minimumEventsThreshold: {
        type: Number,
        default: 5,
        min: 1,
        max: 20,
        description: 'Minimum number of AMU events to trigger any alert'
    },

    // Active status
    isActive: {
        type: Boolean,
        default: true
    },

    // Last updated by
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Regulator'
    }
}, {
    timestamps: true
});

// Ensure only one configuration exists (singleton pattern)
amuConfigSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

const AmuConfig = mongoose.model('AmuConfig', amuConfigSchema);

export default AmuConfig;
