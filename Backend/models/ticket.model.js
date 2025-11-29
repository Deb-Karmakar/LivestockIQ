import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
    {
        ticketId: {
            type: String,
            unique: true,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            required: true,
            maxlength: 2000,
        },
        category: {
            type: String,
            required: true,
            enum: [
                'Technical Issue',
                'Account Problem',
                'Feature Request',
                'Bug Report',
                'General Inquiry',
                'Other',
            ],
        },
        priority: {
            type: String,
            required: true,
            enum: ['Low', 'Medium', 'High', 'Urgent'],
            default: 'Medium',
        },
        status: {
            type: String,
            required: true,
            enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
            default: 'Open',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'createdByModel',
        },
        createdByModel: {
            type: String,
            required: true,
            enum: ['Farmer', 'Vet', 'Regulator'],
        },
        createdByRole: {
            type: String,
            required: true,
            enum: ['farmer', 'vet', 'veterinarian', 'regulator'],
        },
        createdByName: {
            type: String,
            required: true,
        },
        createdByEmail: {
            type: String,
            required: true,
        },
        adminResponse: {
            type: String,
            maxlength: 2000,
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
        resolvedAt: {
            type: Date,
        },
        statusHistory: [
            {
                status: {
                    type: String,
                    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
                },
                changedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Admin',
                },
                changedAt: {
                    type: Date,
                    default: Date.now,
                },
                note: String,
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Generate unique ticket ID before saving
ticketSchema.pre('save', async function (next) {
    if (!this.ticketId) {
        const count = await mongoose.model('Ticket').countDocuments();
        this.ticketId = `TKT-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

// Index for faster queries
ticketSchema.index({ createdBy: 1, createdByModel: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ createdAt: -1 });

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
