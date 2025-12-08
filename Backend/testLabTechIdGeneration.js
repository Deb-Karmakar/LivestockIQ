// Test script to verify labTechId generation fix
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import the model with the fix
const labTechnicianSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    labTechId: { type: String, unique: true },
    labName: { type: String, required: true },
    labCertificationNumber: { type: String, required: true },
    labLocation: { type: String },
    phoneNumber: { type: String },
    specialization: {
        type: String,
        enum: ['MRL Testing', 'Pathology', 'Microbiology', 'General', 'Other'],
        default: 'MRL Testing',
    },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Apply the FIXED pre-save hook
labTechnicianSchema.pre('save', async function (next) {
    if (!this.labTechId) {
        const lastLabTech = await mongoose.model('LabTechnician')
            .findOne({}, { labTechId: 1 })
            .sort({ labTechId: -1 });

        let nextId = 1001;
        if (lastLabTech && lastLabTech.labTechId) {
            const lastIdNum = parseInt(lastLabTech.labTechId.replace('LAB', ''));
            nextId = lastIdNum + 1;
        }

        this.labTechId = `LAB${String(nextId).padStart(5, '0')}`;
    }
    next();
});

const TestLabTechnician = mongoose.model('TestLabTechnician', labTechnicianSchema, 'labtechnicians');

const testIdGeneration = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB\n');

        // Check what ID would be generated for the next lab tech
        const lastLabTech = await TestLabTechnician
            .findOne({}, { labTechId: 1 })
            .sort({ labTechId: -1 });

        console.log('Last lab technician:', lastLabTech ? `${lastLabTech.labTechId}` : 'None found');

        if (lastLabTech && lastLabTech.labTechId) {
            const lastIdNum = parseInt(lastLabTech.labTechId.replace('LAB', ''));
            const nextId = lastIdNum + 1;
            const nextLabTechId = `LAB${String(nextId).padStart(5, '0')}`;
            console.log(`Next ID will be: ${nextLabTechId}`);
        }

        await mongoose.connection.close();
        console.log('\n✓ Test complete');
    } catch (error) {
        console.error('Error:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
};

testIdGeneration();
