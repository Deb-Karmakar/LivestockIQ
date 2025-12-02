// Backend/models/mrl.model.js

import mongoose from 'mongoose';

const mrlSchema = new mongoose.Schema({
    drugName: {
        type: String,
        required: true,
        trim: true
    },
    species: {
        type: String,
        required: true,
        enum: ['Cattle', 'Goat', 'Sheep', 'Pig', 'Poultry', 'Buffalo', 'All Species']
    },
    productType: {
        type: String,
        required: true,
        enum: ['Milk', 'Meat', 'Eggs', 'Honey', 'Fish', 'All Products']
    },
    mrlLimit: {
        type: Number,
        required: true,
        // Value in µg/kg (micrograms per kilogram) or ppb (parts per billion)
    },
    unit: {
        type: String,
        enum: ['µg/kg', 'ppb', 'mg/kg', 'ppm'],
        default: 'µg/kg'
    },
    withdrawalPeriodDays: {
        type: Number,
        required: true,
        // Recommended minimum withdrawal period in days
    },
    whoAWaReClass: {
        type: String,
        enum: ['Access', 'Watch', 'Reserve', 'Unclassified'],
        default: 'Unclassified',
        // WHO AWaRe Classification for antimicrobial stewardship
        // Access: First-line, lower resistance risk
        // Watch: Second-line, higher resistance potential
        // Reserve: Last resort, critically important for human medicine
    },
    regulatoryAuthority: {
        type: String,
        enum: ['FSSAI', 'Codex Alimentarius', 'EU', 'USDA', 'WHO', 'Custom'],
        default: 'FSSAI'
    },
    referenceDocument: {
        type: String,
        // URL or document reference for the MRL limit
    },
    notes: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster lookups
mrlSchema.index({ drugName: 1, species: 1, productType: 1 });

// Method to check if a residue level is compliant
mrlSchema.methods.isCompliant = function (residueLevel) {
    return residueLevel <= this.mrlLimit;
};

// Static method to find MRL limit for specific drug and product (CASE-INSENSITIVE)
mrlSchema.statics.findMRLLimit = async function (drugName, species, productType) {
    // Try exact match first (case-insensitive for all fields)
    let mrl = await this.findOne({
        drugName: new RegExp(`^${drugName}$`, 'i'),
        species: new RegExp(`^${species}$`, 'i'),
        productType: new RegExp(`^${productType}$`, 'i'),
        isActive: true
    });

    // If no exact match, try "All Species" or "All Products"
    if (!mrl) {
        mrl = await this.findOne({
            drugName: new RegExp(`^${drugName}$`, 'i'),
            $or: [
                { species: /^All Species$/i, productType: new RegExp(`^${productType}$`, 'i') },
                { species: new RegExp(`^${species}$`, 'i'), productType: /^All Products$/i },
                { species: /^All Species$/i, productType: /^All Products$/i }
            ],
            isActive: true
        });
    }

    return mrl;
};

const MRL = mongoose.model('MRL', mrlSchema);

export default MRL;
