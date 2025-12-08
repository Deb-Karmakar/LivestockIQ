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
        const count = await mongoose.model('LabTechnician').countDocuments();
        this.labTechId = `LAB${String(count + 1001).padStart(5, '0')}`;
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
