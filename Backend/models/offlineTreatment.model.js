// Backend/models/offlineTreatment.model.js
// Model for treatment records of non-registered farmers

import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
    drugName: {
        type: String,
        required: [true, 'Drug name is required']
    },
    dosage: {
        type: String,
        required: [true, 'Dosage is required']
    },
    frequency: {
        type: String,
        default: 'Once daily'
    },
    duration: {
        type: String, // e.g., "5 days", "2 weeks"
    },
    withdrawalPeriod: {
        type: Number, // in days
        min: 0,
    },
    route: {
        type: String,
        enum: ['Oral', 'Injection', 'Topical', 'IV', 'IM', 'SC', 'Other'],
        default: 'Oral'
    },
    notes: String,
}, { _id: true });

const offlineTreatmentSchema = new mongoose.Schema({
    // Vet Information
    vetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Veterinarian',
        required: true,
        index: true
    },
    vetEmail: String,
    vetName: String,

    // Farmer Information (Non-registered)
    farmerName: {
        type: String,
        required: [true, 'Farmer name is required'],
        trim: true
    },
    farmerPhone: {
        type: String,
        trim: true
    },
    farmerAddress: {
        type: String,
        trim: true
    },
    farmName: {
        type: String,
        trim: true
    },

    // Animal Information
    animalTagId: {
        type: String,
        trim: true
    },
    animalSpecies: {
        type: String,
        required: [true, 'Animal species is required'],
        enum: ['Cattle', 'Buffalo', 'Sheep', 'Goat', 'Pig', 'Poultry', 'Other']
    },
    animalBreed: {
        type: String,
        trim: true
    },
    animalAge: {
        type: String, // e.g., "2 years", "6 months"
        trim: true
    },
    animalWeight: {
        type: Number, // in kg
        min: 0
    },

    // Treatment Details
    diagnosis: {
        type: String,
        required: [true, 'Diagnosis is required'],
        trim: true
    },
    symptoms: {
        type: String,
        trim: true
    },
    treatmentDate: {
        type: Date,
        default: Date.now,
        index: true
    },

    // Prescription Details
    prescriptions: {
        type: [prescriptionSchema],
        validate: {
            validator: function (arr) {
                return arr && arr.length > 0;
            },
            message: 'At least one prescription is required'
        }
    },

    // Additional Information
    generalNotes: String,
    followUpDate: Date,
    totalCost: {
        type: Number,
        min: 0
    },

    // Email Status
    emailSent: {
        type: Boolean,
        default: false
    },
    emailSentAt: Date,
    emailError: String,

    // Blockchain Integration
    blockchainAnchored: {
        type: Boolean,
        default: false
    },
    blockchainTransactionHash: String,
    blockchainSnapshotId: Number,

}, {
    timestamps: true
});

// Indexes for better query performance
offlineTreatmentSchema.index({ vetId: 1, treatmentDate: -1 });
offlineTreatmentSchema.index({ farmerPhone: 1 });
offlineTreatmentSchema.index({ animalTagId: 1 });
offlineTreatmentSchema.index({ createdAt: -1 });

const OfflineTreatment = mongoose.model('OfflineTreatment', offlineTreatmentSchema);

export default OfflineTreatment;
