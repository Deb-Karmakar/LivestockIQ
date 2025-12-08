// Backend/models/labTechnician.model.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const labTechnicianSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
    },
    labTechId: {
        type: String,
        unique: true,
        trim: true,
    },
    labName: {
        type: String,
        required: [true, 'Lab name is required'],
        trim: true,
    },
    labCertificationNumber: {
        type: String,
        required: [true, 'Lab certification number is required'],
        trim: true,
    },
    labLocation: {
        type: String,
        trim: true,
    },
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
        state: { type: String },
        district: { type: String }
    },
    phoneNumber: {
        type: String,
        trim: true,
    },
    specialization: {
        type: String,
        enum: ['MRL Testing', 'Pathology', 'Microbiology', 'General', 'Other'],
        default: 'MRL Testing',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Generate unique Lab Tech ID before saving
labTechnicianSchema.pre('save', async function (next) {
    // Generate labTechId if not present
    if (!this.labTechId) {
        // Find the highest existing labTechId to avoid duplicates
        const lastLabTech = await mongoose.model('LabTechnician')
            .findOne({}, { labTechId: 1 })
            .sort({ labTechId: -1 });

        let nextId = 1001; // Start from LAB01001
        if (lastLabTech && lastLabTech.labTechId) {
            // Extract the numeric part and increment
            const lastIdNum = parseInt(lastLabTech.labTechId.replace('LAB', ''));
            nextId = lastIdNum + 1;
        }

        this.labTechId = `LAB${String(nextId).padStart(5, '0')}`;
    }

    // Hash password if modified
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
labTechnicianSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const LabTechnician = mongoose.model('LabTechnician', labTechnicianSchema);

export default LabTechnician;
