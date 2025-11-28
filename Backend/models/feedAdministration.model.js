// Backend/models/feedAdministration.model.js

import mongoose from 'mongoose';

const feedAdministrationSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Farmer'
    },
    feedId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Feed'
    },
    animalIds: [{
        type: String,
        required: true
        // Array of 12-digit animal tag IDs
    }],
    groupName: {
        type: String,
        trim: true
        // Optional: "Pen 1", "Flock A", "Herd B", etc.
    },
    feedQuantityUsed: {
        type: Number,
        required: [true, 'Feed quantity used is required'],
        min: [0, 'Quantity cannot be negative']
        // In kg
    },
    antimicrobialDoseTotal: {
        type: Number
        // Total antimicrobial administered in mg (calculated from feed quantity in pre-save hook)
    },
    administrationDate: {
        type: Date,
        default: Date.now
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date
        // Optional: for ongoing feeding programs, set when completed
    },
    withdrawalEndDate: {
        type: Date
        // Calculated: endDate + withdrawalPeriodDays from Feed in pre-save hook
    },
    feedConsumptionRate: {
        type: Number,
        // kg per animal per day (optional, for tracking)
    },
    numberOfAnimals: {
        type: Number,
        min: [1, 'Must have at least one animal']
        // Calculated from animalIds.length in pre-save hook
    },
    vetId: {
        type: String
        // Vet's unique code who prescribed/approved
    },
    vetApproved: {
        type: Boolean,
        default: false
    },
    vetApprovalDate: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Active', 'Completed', 'Withdrawn', 'Pending Approval'],
        default: 'Pending Approval'
    },

    // MRL Compliance fields (consistent with Treatment model)
    requiresMrlTest: {
        type: Boolean,
        default: true
    },
    mrlCompliant: {
        type: Boolean,
        default: null
        // null = not tested, true = passed, false = failed
    },
    lastMrlTestDate: {
        type: Date
    },
    expectedMrlClearanceDate: {
        type: Date
        // Same as withdrawalEndDate, but can be updated based on test results
    },
    mrlTestResults: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LabTest'
    }],

    // Audit trail
    createdBy: {
        type: String
        // User who created this record
    },
    approvedBy: {
        type: String
        // Vet who approved
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
feedAdministrationSchema.index({ farmerId: 1, status: 1 });
feedAdministrationSchema.index({ farmerId: 1, administrationDate: -1 });
feedAdministrationSchema.index({ animalIds: 1 });
feedAdministrationSchema.index({ withdrawalEndDate: 1 });
feedAdministrationSchema.index({ vetId: 1, status: 1 });

// Virtual to check if withdrawal period is active
feedAdministrationSchema.virtual('isWithdrawalActive').get(function () {
    return this.withdrawalEndDate > new Date();
});

// Virtual to check if safe for sale (withdrawal period ended and MRL compliant)
feedAdministrationSchema.virtual('isSafeForSale').get(function () {
    const withdrawalEnded = this.withdrawalEndDate <= new Date();
    const mrlOk = this.mrlCompliant === true || this.mrlCompliant === null;
    return withdrawalEnded && mrlOk && this.status === 'Completed';
});

// Virtual to get days until withdrawal end
feedAdministrationSchema.virtual('daysUntilWithdrawalEnd').get(function () {
    if (!this.isWithdrawalActive) return 0;
    const now = new Date();
    const diffTime = this.withdrawalEndDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Method to calculate antimicrobial dose per animal
feedAdministrationSchema.methods.getDosePerAnimal = function () {
    return this.antimicrobialDoseTotal / this.numberOfAnimals;
};

// Method to complete feeding program
feedAdministrationSchema.methods.completeFeedingProgram = async function (endDate) {
    this.endDate = endDate || new Date();
    this.status = 'Completed';

    // Recalculate withdrawal end date based on actual end date
    const feed = await mongoose.model('Feed').findById(this.feedId);
    if (feed) {
        const withdrawalEnd = new Date(this.endDate);
        withdrawalEnd.setDate(withdrawalEnd.getDate() + feed.withdrawalPeriodDays);
        this.withdrawalEndDate = withdrawalEnd;
        this.expectedMrlClearanceDate = withdrawalEnd;
    }

    return await this.save();
};

// Static method to find active feeding programs for a farmer
feedAdministrationSchema.statics.findActivePrograms = async function (farmerId) {
    return await this.find({
        farmerId,
        status: 'Active'
    }).populate('feedId').sort({ startDate: -1 });
};

// Static method to find feeding programs for specific animal
feedAdministrationSchema.statics.findByAnimal = async function (animalId) {
    return await this.find({
        animalIds: animalId
    }).populate('feedId').sort({ administrationDate: -1 });
};

// Static method to find animals in active withdrawal period
feedAdministrationSchema.statics.findAnimalsInWithdrawal = async function (farmerId) {
    const now = new Date();
    return await this.find({
        farmerId,
        withdrawalEndDate: { $gt: now },
        status: { $in: ['Active', 'Completed'] }
    }).populate('feedId');
};

// Static method to calculate total AMU from feed for a period
feedAdministrationSchema.statics.calculateFeedAMU = async function (farmerId, startDate, endDate) {
    const administrations = await this.find({
        farmerId,
        administrationDate: { $gte: startDate, $lte: endDate }
    }).populate('feedId');

    let totalAMU = 0;
    const byDrug = {};

    administrations.forEach(admin => {
        totalAMU += admin.antimicrobialDoseTotal;

        if (admin.feedId && admin.feedId.antimicrobialName) {
            const drugName = admin.feedId.antimicrobialName;
            byDrug[drugName] = (byDrug[drugName] || 0) + admin.antimicrobialDoseTotal;
        }
    });

    return {
        totalAMU,
        byDrug,
        administrationCount: administrations.length
    };
};

// Pre-save hook to calculate antimicrobial dose total
feedAdministrationSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('feedQuantityUsed') || this.isModified('feedId')) {
        // Fetch feed to get antimicrobial concentration
        const feed = await mongoose.model('Feed').findById(this.feedId);
        if (feed) {
            // Calculate total antimicrobial: feedQuantity (kg) * concentration (mg/kg)
            this.antimicrobialDoseTotal = this.feedQuantityUsed * feed.antimicrobialConcentration;

            // Set withdrawal end date if not already set
            if (!this.withdrawalEndDate || this.isModified('endDate')) {
                const endDateToUse = this.endDate || this.startDate;
                const withdrawalEnd = new Date(endDateToUse);
                withdrawalEnd.setDate(withdrawalEnd.getDate() + feed.withdrawalPeriodDays);
                this.withdrawalEndDate = withdrawalEnd;
                this.expectedMrlClearanceDate = withdrawalEnd;
            }
        }
    }

    // Set number of animals from animalIds array
    if (this.isModified('animalIds')) {
        this.numberOfAnimals = this.animalIds.length;
    }

    next();
});

const FeedAdministration = mongoose.model('FeedAdministration', feedAdministrationSchema);

export default FeedAdministration;
