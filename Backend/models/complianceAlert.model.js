// backend/models/complianceAlert.model.js

import mongoose from 'mongoose';

const complianceAlertSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Farmer'
    },
    vetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Veterinarian'
    },
    reason: {
        type: String,
        required: true,
        enum: [
            'Suspected Overuse of Antibiotics',
            'Poor Record-Keeping',
            'Failure to Follow Withdrawal Periods',
            'Other'
        ]
    },
    details: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Open', 'Under Review', 'Resolved'],
        default: 'Open'
    }
}, { timestamps: true });

const ComplianceAlert = mongoose.model('ComplianceAlert', complianceAlertSchema);

export default ComplianceAlert;