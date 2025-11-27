// backend/models/regulator.model.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const regulatorSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phoneNumber: { type: String },
    agencyName: { type: String, required: true },
    regulatorId: { type: String, required: true, unique: true },
    jurisdiction: { type: String, required: true },
    notificationPrefs: {
        highAmuAlerts: { type: Boolean, default: true },
        vetComplianceReports: { type: Boolean, default: true },
        monthlySummary: { type: Boolean, default: false },
    },
    status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
}, { timestamps: true });

// Hash password before saving
regulatorSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const Regulator = mongoose.model('Regulator', regulatorSchema);

export default Regulator;