// Backend/models/regulatorAlert.model.js

import mongoose from 'mongoose';

const regulatorAlertSchema = new mongoose.Schema({
    // Alert Type
    alertType: {
        type: String,
        enum: [
            'MRL_VIOLATION',           // Critical MRL test failure
            'REPEATED_VIOLATION',      // Multiple violations by same farm
            'BLOCKED_SALE_ATTEMPT',    // Farmer attempted non-compliant sale
            'MISSING_MRL_TEST',        // Animal past withdrawal without test
            'EXPIRED_TEST_DETECTED',   // Using outdated MRL test results
            'COMPLIANCE_PATTERN'       // Pattern of non-compliance detected
        ],
        required: true
    },

    // Severity Level
    severity: {
        type: String,
        enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
        default: 'MEDIUM'
    },

    // Farm Information
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true
    },
    farmName: String,
    farmLocation: String,

    // Violation Details
    violationDetails: {
        animalId: String,
        animalName: String,
        drugName: String,
        productType: String,

        // For MRL violations
        residueLevel: Number,
        mrlLimit: Number,
        exceededBy: Number,
        percentageOver: Number,

        // For repeated violations
        violationCount: Number,
        timeWindow: String,  // e.g., "last 30 days"

        // Test information
        labTestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LabTest'
        },
        testDate: Date,

        // Sale attempt information
        attemptedSaleDate: Date,
        productQuantity: Number
    },

    // Alert Status
    status: {
        type: String,
        enum: ['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'ESCALATED'],
        default: 'NEW'
    },

    // Regulator Actions
    acknowledgedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Regulator'
    },
    acknowledgedAt: Date,

    investigationNotes: String,
    actionTaken: String,

    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Regulator'
    },
    resolvedAt: Date,
    resolutionNotes: String,

    // Risk Assessment
    riskLevel: {
        type: String,
        enum: ['IMMEDIATE_ACTION', 'HIGH_PRIORITY', 'MONITOR', 'LOW_RISK'],
        default: 'MONITOR'
    },

    // Auto-generated message
    message: {
        type: String,
        required: true
    },

    // Additional metadata
    metadata: {
        ipAddress: String,
        userAgent: String,
        relatedAlerts: [mongoose.Schema.Types.ObjectId],  // Related regulator alerts
        auditLogId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AuditLog'
        }
    },

    // Email notification tracking
    emailSent: {
        type: Boolean,
        default: false
    },
    emailSentAt: Date,
    emailRecipients: [String]

}, {
    timestamps: true
});

// Indexes for efficient querying
regulatorAlertSchema.index({ farmerId: 1, createdAt: -1 });
regulatorAlertSchema.index({ status: 1, severity: -1 });
regulatorAlertSchema.index({ alertType: 1, createdAt: -1 });
regulatorAlertSchema.index({ riskLevel: 1 });

// Virtual for age of alert
regulatorAlertSchema.virtual('alertAge').get(function () {
    return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60)); // hours
});

// Method to escalate alert
regulatorAlertSchema.methods.escalate = function () {
    this.status = 'ESCALATED';
    this.riskLevel = 'IMMEDIATE_ACTION';
    if (this.severity !== 'CRITICAL') {
        this.severity = 'HIGH';
    }
    return this.save();
};

const RegulatorAlert = mongoose.model('RegulatorAlert', regulatorAlertSchema);

export default RegulatorAlert;
