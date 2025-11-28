// Backend/models/labTest.model.js

import mongoose from 'mongoose';

const labTestSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Farmer'
    },
    animalId: {
        type: String,
        required: true,
        // The 12-digit Tag ID
    },
    treatmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Treatment',
        // Optional: Link to specific treatment if applicable
    },
    drugName: {
        type: String,
        required: true,
        // Name of the drug being tested for
    },
    sampleType: {
        type: String,
        required: true,
        enum: ['Milk', 'Blood', 'Meat', 'Tissue', 'Urine', 'Eggs', 'Other']
    },
    productType: {
        type: String,
        required: true,
        enum: ['Milk', 'Meat', 'Eggs', 'Honey', 'Fish']
    },
    residueLevelDetected: {
        type: Number,
        required: true,
        // Actual residue level found in µg/kg or ppb
    },
    unit: {
        type: String,
        enum: ['µg/kg', 'ppb', 'mg/kg', 'ppm'],
        default: 'µg/kg'
    },
    mrlThreshold: {
        type: Number,
        required: true,
        // The applicable MRL limit at the time of testing
    },
    testDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    labName: {
        type: String,
        required: true,
        // Name of certified testing laboratory
    },
    labLocation: {
        type: String
    },
    labCertificationNumber: {
        type: String,
        // Lab's accreditation/certification number
    },
    testReportNumber: {
        type: String,
        required: true,
        // Unique test report ID from lab
    },
    certificateUrl: {
        type: String,
        required: true,
        // URL to uploaded lab certificate/report
    },
    isPassed: {
        type: Boolean,
        required: true,
        // true if residueLevelDetected <= mrlThreshold
    },
    testedBy: {
        type: String,
        // Name of lab technician/veterinarian
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Veterinarian',
        // Vet who verified the test results
    },
    verifiedDate: {
        type: Date
    },
    regulatorApproved: {
        type: Boolean,
        default: false
    },
    regulatorApprovedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Regulator'
    },
    regulatorApprovedDate: {
        type: Date
    },
    notes: {
        type: String
    },
    status: {
        type: String,
        enum: ['Pending Verification', 'Verified', 'Approved', 'Rejected'],
        default: 'Pending Verification'
    },
    violationResolved: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient queries
labTestSchema.index({ farmerId: 1, testDate: -1 });
labTestSchema.index({ animalId: 1, testDate: -1 });
labTestSchema.index({ isPassed: 1 });

// Virtual field to determine if test is recent (within 30 days)
labTestSchema.virtual('isRecent').get(function () {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.testDate >= thirtyDaysAgo;
});

// Method to check if animal/product is safe for sale based on this test
labTestSchema.methods.isSafeForSale = function () {
    return this.isPassed && this.isRecent && (this.status === 'Verified' || this.status === 'Approved');
};

const LabTest = mongoose.model('LabTest', labTestSchema);

export default LabTest;
