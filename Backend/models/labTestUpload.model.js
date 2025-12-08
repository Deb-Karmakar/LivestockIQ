// Backend/models/labTestUpload.model.js
// Model for lab tests uploaded by lab technicians

import mongoose from 'mongoose';

const labTestUploadSchema = new mongoose.Schema({
    // Lab Technician Information
    labTechnicianId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'LabTechnician'
    },
    labTechnicianName: {
        type: String,
        required: true,
    },
    labName: {
        type: String,
        required: true,
    },
    labCertificationNumber: {
        type: String,
    },

    // Animal Information
    animalTagId: {
        type: String,
        required: true,
        // The 12-digit animal Tag ID
    },
    animalName: {
        type: String,
    },
    animalSpecies: {
        type: String,
        enum: ['Cattle', 'Cow', 'Buffalo', 'Goat', 'Sheep', 'Pig', 'Poultry', 'Chicken', 'Duck', 'Turkey', 'Fish', 'Horse', 'Other'],
    },

    // Farm Information
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer'
    },
    farmerName: {
        type: String,
    },
    farmName: {
        type: String,
    },

    // Test Details
    testType: {
        type: String,
        required: true,
        enum: ['MRL', 'Pathology', 'Microbiology', 'Blood Panel', 'Hormone', 'Genetic', 'Other'],
        default: 'MRL'
    },
    drugOrSubstanceTested: {
        type: String,
        required: true,
        // Name of the drug/antibiotic/substance tested
    },
    sampleType: {
        type: String,
        required: true,
        enum: ['Milk', 'Blood', 'Meat', 'Tissue', 'Urine', 'Eggs', 'Honey', 'Swab', 'Other'],
    },
    productType: {
        type: String,
        required: true,
        enum: ['Milk', 'Meat', 'Eggs', 'Honey', 'Fish', 'Other'],
    },

    // Test Results
    residueLevelDetected: {
        type: Number,
        required: true,
        // Actual residue level found in the sample
    },
    unit: {
        type: String,
        enum: ['µg/kg', 'ppb', 'mg/kg', 'ppm', 'ng/mL', 'IU/mL'],
        default: 'µg/kg'
    },
    mrlThreshold: {
        type: Number,
        required: true,
        // The applicable MRL/safe limit
    },
    isPassed: {
        type: Boolean,
        required: true,
        // true if residueLevelDetected <= mrlThreshold
    },

    // Test Metadata
    testDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    sampleCollectionDate: {
        type: Date,
    },
    testReportNumber: {
        type: String,
        required: true,
        unique: true,
        // Unique report ID from lab - index created via unique: true
    },
    certificateUrl: {
        type: String,
        // URL to uploaded lab certificate/report PDF
    },

    // Quality Control
    testMethod: {
        type: String,
        // e.g., "HPLC", "ELISA", "GC-MS", "LC-MS/MS"
    },
    detectionLimit: {
        type: Number,
        // Minimum detectable quantity
    },

    // Status Tracking
    status: {
        type: String,
        enum: ['Pending Review', 'Verified', 'Approved', 'Rejected', 'Flagged'],
        default: 'Pending Review'
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Veterinarian',
    },
    verifiedDate: {
        type: Date,
    },
    regulatorReviewed: {
        type: Boolean,
        default: false,
    },
    regulatorReviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Regulator',
    },
    regulatorReviewDate: {
        type: Date,
    },

    // Additional Information
    notes: {
        type: String,
    },
    flags: [{
        reason: String,
        flaggedBy: mongoose.Schema.Types.ObjectId,
        flaggedDate: Date,
    }],

    // Notification Tracking
    farmerNotified: {
        type: Boolean,
        default: false,
    },
    farmerNotifiedDate: {
        type: Date,
    },
}, {
    timestamps: true,
});

// Indexes for efficient querying
labTestUploadSchema.index({ labTechnicianId: 1, testDate: -1 });
labTestUploadSchema.index({ animalTagId: 1, testDate: -1 });
labTestUploadSchema.index({ farmerId: 1, testDate: -1 });
labTestUploadSchema.index({ isPassed: 1 });
labTestUploadSchema.index({ status: 1 });
// Note: testReportNumber index is created via unique: true in schema

// Virtual: Check if test is recent (within 30 days)
labTestUploadSchema.virtual('isRecent').get(function () {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.testDate >= thirtyDaysAgo;
});

// Method: Check if safe for sale based on this test
labTestUploadSchema.methods.isSafeForSale = function () {
    return this.isPassed && this.status === 'Approved';
};

const LabTestUpload = mongoose.model('LabTestUpload', labTestUploadSchema);

export default LabTestUpload;
