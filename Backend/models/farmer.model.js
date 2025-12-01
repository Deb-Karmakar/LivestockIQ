import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const farmerSchema = new mongoose.Schema({
    farmName: { type: String, required: true },
    farmOwner: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true },
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
        state: { type: String },
        district: { type: String }
    },
    speciesReared: { type: String },
    herdSize: { type: Number },
    vetId: { type: String, required: true }, // Links to a Veterinarian
    status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
}, { timestamps: true });

// Hash password before saving
farmerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const Farmer = mongoose.model('Farmer', farmerSchema);
export default Farmer;