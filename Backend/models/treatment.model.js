// backend/models/treatment.model.js

import mongoose from 'mongoose';

const treatmentSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Farmer'
    },
    animalId: {
        type: String, // The 12-digit Tag ID
        required: true,
    },
    drugName: {
        type: String,
        required: true,
    },
    // WHO AWaRe classification for antimicrobial stewardship
    drugClass: {
        type: String,
        enum: ['Access', 'Watch', 'Reserve', 'Unclassified'],
        default: 'Unclassified',
        // Access: First-line antibiotics with low resistance potential
        // Watch: Second-line antibiotics, higher resistance risk
        // Reserve: Last-resort antibiotics for multi-drug resistant infections
    },
    dose: { type: String },
    route: { type: String },
    startDate: {
        type: Date,
        required: true,
    },
    withdrawalEndDate: {
        type: Date,
    },
    vetId: {
        type: String, // The Vet's unique code
    },
    vetSigned: {
        type: Boolean,
        default: false,
    },
    notes: { type: String },
    vetNotes: { type: String },
    attachment: { type: String },

    // --- NEW FIELD ---
    // Add the status field so Mongoose can save it
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },

    // --- MRL COMPLIANCE FIELDS ---
    mrlCompliant: {
        type: Boolean,
        default: null,
        // null = not tested yet, true = passed MRL test, false = failed MRL test
    },
    lastMrlTestDate: {
        type: Date,
        // Date of most recent MRL test for this treatment
    },
    expectedMrlClearanceDate: {
        type: Date,
        // Calculated based on drug MRL data and withdrawal period
    },
    requiresMrlTest: {
        type: Boolean,
        default: true,
        // Whether this treatment requires MRL testing before product sale
    },
    mrlTestResults: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LabTest'
        // Reference to lab test results for this treatment
    }],

}, {
    timestamps: true // Essential for offline sync
});

const Treatment = mongoose.model('Treatment', treatmentSchema);
export default Treatment;