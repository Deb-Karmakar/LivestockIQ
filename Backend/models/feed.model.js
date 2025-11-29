// Backend/models/feed.model.js

import mongoose from 'mongoose';

const feedSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Farmer'
    },
    feedName: {
        type: String,
        required: [true, 'Feed name is required'],
        trim: true
    },
    feedType: {
        type: String,
        required: true,
        enum: ['Starter', 'Grower', 'Finisher', 'Layer', 'Breeder', 'Medicated', 'Custom'],
        default: 'Medicated'
    },
    antimicrobialName: {
        type: String,
        trim: true,
        validate: {
            validator: function (value) {
                // Required only if prescriptionRequired is true
                if (this.prescriptionRequired === true) {
                    return value && value.trim().length > 0;
                }
                return true;
            },
            message: 'Antimicrobial name is required for medicated feeds'
        }
    },
    antimicrobialConcentration: {
        type: Number,
        min: [0, 'Concentration cannot be negative'],
        default: 0,
        validate: {
            validator: function (value) {
                // Required only if prescriptionRequired is true
                if (this.prescriptionRequired === true) {
                    return value != null && value >= 0;
                }
                return true;
            },
            message: 'Antimicrobial concentration is required for medicated feeds'
        }
        // Stored in mg/kg of feed
    },
    concentrationUnit: {
        type: String,
        enum: ['mg/kg', 'g/kg', 'ppm'],
        default: 'mg/kg'
    },
    totalQuantity: {
        type: Number,
        required: [true, 'Total quantity is required'],
        min: [0, 'Quantity cannot be negative']
    },
    remainingQuantity: {
        type: Number,
        required: true,
        min: [0, 'Remaining quantity cannot be negative']
    },
    unit: {
        type: String,
        enum: ['kg', 'tons', 'lbs'],
        default: 'kg'
    },
    batchNumber: {
        type: String,
        trim: true
    },
    manufacturer: {
        type: String,
        required: [true, 'Manufacturer is required'],
        trim: true
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        required: [true, 'Expiry date is required']
    },
    withdrawalPeriodDays: {
        type: Number,
        min: [0, 'Withdrawal period cannot be negative'],
        default: 0,
        validate: {
            validator: function (value) {
                // Required only if prescriptionRequired is true
                if (this.prescriptionRequired === true) {
                    return value != null && value >= 0;
                }
                return true;
            },
            message: 'Withdrawal period is required for medicated feeds'
        }
    },
    targetSpecies: [{
        type: String,
        enum: ['Cattle', 'Goat', 'Sheep', 'Pig', 'Poultry', 'Buffalo', 'Fish']
    }],
    prescriptionRequired: {
        type: Boolean,
        default: true
    },
    vetPrescriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription'
    },
    supplier: {
        type: String,
        trim: true
    },
    costPerUnit: {
        type: Number,
        min: [0, 'Cost cannot be negative']
    },
    notes: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
feedSchema.index({ farmerId: 1, isActive: 1 });
feedSchema.index({ farmerId: 1, antimicrobialName: 1 });
feedSchema.index({ expiryDate: 1 });

// Virtual to check if feed is expired
feedSchema.virtual('isExpired').get(function () {
    return this.expiryDate < new Date();
});

// Virtual to check if feed is expiring soon (within 30 days)
feedSchema.virtual('isExpiringSoon').get(function () {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return this.expiryDate <= thirtyDaysFromNow && this.expiryDate > new Date();
});

// Virtual to check if stock is low (less than 10% remaining)
feedSchema.virtual('isLowStock').get(function () {
    return (this.remainingQuantity / this.totalQuantity) < 0.1;
});

// Method to calculate total antimicrobial content in remaining feed
feedSchema.methods.getTotalAntimicrobialContent = function () {
    // Returns total mg of antimicrobial in remaining feed
    return this.remainingQuantity * this.antimicrobialConcentration;
};

// Method to update remaining quantity after use
feedSchema.methods.consumeFeed = async function (quantityUsed) {
    if (quantityUsed > this.remainingQuantity) {
        throw new Error('Cannot consume more feed than available');
    }
    this.remainingQuantity -= quantityUsed;
    if (this.remainingQuantity === 0) {
        this.isActive = false;
    }
    return await this.save();
};

// Static method to find active medicated feed for a farmer
feedSchema.statics.findActiveFeed = async function (farmerId) {
    return await this.find({
        farmerId,
        isActive: true,
        remainingQuantity: { $gt: 0 },
        expiryDate: { $gt: new Date() }
    }).sort({ expiryDate: 'asc' });
};

// Static method to find expiring feed
feedSchema.statics.findExpiringFeed = async function (farmerId, daysThreshold = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return await this.find({
        farmerId,
        isActive: true,
        expiryDate: { $lte: thresholdDate, $gt: new Date() }
    }).sort({ expiryDate: 'asc' });
};

const Feed = mongoose.model('Feed', feedSchema);

export default Feed;
