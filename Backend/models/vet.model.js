import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const vetSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    licenseNumber: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phoneNumber: { type: String },
    university: { type: String },
    degree: { type: String },
    specialization: { type: String },
    // UPDATED: Changed the default function to generate a "Google Classroom-style" ID
    vetId: {
        type: String,
        required: true,
        unique: true,
        // Generates a random 7-character string like 'x7b2k1j'
        default: () => Math.random().toString(36).substring(2, 9)
    },
    // Cryptographic keys for digital signatures
    cryptoKeys: {
        publicKey: {
            type: String,
            // Will be auto-generated on first login or manually generated
        },
        privateKey: {
            type: String,
            // Encrypted private key (in production, use proper key management)
        },
        keyGeneratedAt: {
            type: Date,
        },
    },
    notificationPrefs: {
        newRequests: { type: Boolean, default: true },
        complianceAlerts: { type: Boolean, default: true },
        weeklySummary: { type: Boolean, default: false },
    },
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
    },
}, { timestamps: true });

// Hash password before saving
vetSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const Veterinarian = mongoose.model('Veterinarian', vetSchema);
export default Veterinarian;