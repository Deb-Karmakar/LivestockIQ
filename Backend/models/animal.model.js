import mongoose from 'mongoose';

const animalSchema = new mongoose.Schema({
    // Link to the farmer who owns this animal
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Farmer' // This creates a reference to your Farmer model
    },
    tagId: {
        type: String,
        required: [true, 'Please provide the 12-digit official ear tag ID'],
        unique: true, // Each tag ID must be unique
        trim: true,
    },
    name: {
        type: String,
        trim: true,
    },
    species: {
        type: String,
        required: true,
    },
    gender: { // Add this new field
        type: String,
        enum: ['Male', 'Female'],
    },
    dob: {
        type: Date,
    },
    weight: {
        type: String, // Storing as a string like "550 kg" for simplicity
    },
    status: {
        type: String,
        default: 'Active', // e.g., Active, Sold, Culled
    },
    notes: {
        type: String,
        trim: true,
    }
}, {
    timestamps: true // CRITICAL for offline sync
});

const Animal = mongoose.model('Animal', animalSchema);
export default Animal;