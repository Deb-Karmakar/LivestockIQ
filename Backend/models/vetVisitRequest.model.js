import mongoose from 'mongoose';

const vetVisitRequestSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true
    },
    vetId: {
        type: String,
        required: true
    },
    animalId: {
        type: String,
        required: true // Animal tagId
    },
    animalName: {
        type: String
    },
    reason: {
        type: String,
        required: true
    },
    notes: {
        type: String // Optional farmer notes
    },
    urgency: {
        type: String,
        enum: ['Normal', 'Urgent', 'Emergency'],
        default: 'Normal'
    },
    status: {
        type: String,
        enum: ['Requested', 'Accepted', 'Declined', 'Completed'],
        default: 'Requested'
    },
    scheduledDate: {
        type: Date // Date vet will visit (set by vet on accept)
    },
    vetNotes: {
        type: String // Vet's response notes
    },
    completedAt: {
        type: Date
    },
    treatmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Treatment'
    }
}, { timestamps: true });

// Index for efficient queries
vetVisitRequestSchema.index({ farmerId: 1, status: 1 });
vetVisitRequestSchema.index({ vetId: 1, status: 1 });
vetVisitRequestSchema.index({ createdAt: -1 });

const VetVisitRequest = mongoose.model('VetVisitRequest', vetVisitRequestSchema);
export default VetVisitRequest;
