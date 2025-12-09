import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    // Type of event that occurred
    eventType: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SIGN', 'BLOCKCHAIN_ANCHOR'],
    },

    // Type of entity being audited
    entityType: {
        type: String,
        required: true,
        enum: ['Animal', 'Treatment', 'Sale', 'Prescription', 'Inventory', 'Farmer', 'Veterinarian', 'MerkleSnapshot', 'Feed', 'FeedAdministration', 'OfflineTreatment', 'LabTest'],
    },

    // Reference to the actual entity (optional for system events like blockchain anchors)
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
    },

    // Farm that owns the entity
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Farmer',
    },

    // User who performed the action (optional for system events)
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        refPath: 'performedByModel',
    },

    // Model name for performedBy reference
    performedByModel: {
        type: String,
        required: false,
        enum: ['Farmer', 'Veterinarian', 'Regulator', 'Admin', 'System', 'LabTechnician'],
    },

    // Role of the user who performed the action
    performedByRole: {
        type: String,
        required: false,
        enum: ['Farmer', 'Vet', 'Veterinarian', 'Regulator', 'Admin', 'System', 'Lab Technician'],
    },

    // When the action occurred
    timestamp: {
        type: Date,
        required: true,
        default: Date.now,
        immutable: true, // Cannot be changed once set
    },

    // Hash of the previous audit log entry (for hash chain)
    previousHash: {
        type: String,
        required: true,
        default: '0', // Genesis entry uses '0'
        immutable: true,
    },

    // SHA-256 hash of this entry (for integrity verification)
    currentHash: {
        type: String,
        required: true,
        unique: true,
        immutable: true,
    },

    // Complete snapshot of the entity after the action
    dataSnapshot: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },

    // What changed (for UPDATE events)
    changes: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },

    // Additional metadata
    metadata: {
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
        // Digital signature for critical operations (vet approvals, prescriptions)
        signature: {
            type: String,
        },
        // Public key used for signature verification
        publicKey: {
            type: String,
        },
        // Additional notes or context
        notes: {
            type: String,
        },
        // Blockchain verification data for immediately-anchored entities
        blockchain: {
            verified: {
                type: Boolean,
            },
            transactionHash: {
                type: String,
            },
            blockNumber: {
                type: Number,
            },
            explorerUrl: {
                type: String,
            },
            reason: {
                type: String,
            },
        },
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt
    // Make the entire document immutable after creation
    strict: true,
});

// Indexes for performance
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ farmerId: 1, timestamp: -1 });
auditLogSchema.index({ performedBy: 1, timestamp: -1 });

auditLogSchema.index({ eventType: 1, timestamp: -1 });

// Prevent updates to audit logs (immutability)
auditLogSchema.pre('findOneAndUpdate', function (next) {
    const error = new Error('Audit logs are immutable and cannot be updated');
    next(error);
});

auditLogSchema.pre('updateOne', function (next) {
    const error = new Error('Audit logs are immutable and cannot be updated');
    next(error);
});

auditLogSchema.pre('updateMany', function (next) {
    const error = new Error('Audit logs are immutable and cannot be updated');
    next(error);
});

// Prevent deletion of audit logs
auditLogSchema.pre('deleteOne', function (next) {
    const error = new Error('Audit logs are immutable and cannot be deleted');
    next(error);
});

auditLogSchema.pre('deleteMany', function (next) {
    const error = new Error('Audit logs are immutable and cannot be deleted');
    next(error);
});

// Virtual for verification status
auditLogSchema.virtual('isVerified').get(function () {
    // This will be computed by the service layer
    return true;
});

// Include virtuals when converting to JSON
auditLogSchema.set('toJSON', { virtuals: true });
auditLogSchema.set('toObject', { virtuals: true });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
