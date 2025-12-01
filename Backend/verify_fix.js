// Backend/verify_fix.js
import mongoose from 'mongoose';
import Prescription from './models/prescription.model.js';
import Treatment from './models/treatment.model.js';
import dotenv from 'dotenv';

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const prescriptions = await Prescription.find({})
            .populate({
                path: 'treatmentId',
                select: 'drugName animalId vetSigned updatedAt'
            })
            .limit(5)
            .lean();

        console.log('Found', prescriptions.length, 'prescriptions');

        prescriptions.forEach(p => {
            console.log('--------------------------------------------------');
            console.log('Prescription ID:', p._id);
            console.log('Treatment ID:', p.treatmentId?._id);
            console.log('Drug Name (from Treatment):', p.treatmentId?.drugName);
            console.log('Animal ID (from Treatment):', p.treatmentId?.animalId);
            console.log('Vet Signed (from Treatment):', p.treatmentId?.vetSigned);

            const mappedDrugName = p.treatmentId?.drugName || p.drugName || 'Unknown Drug';
            const mappedAnimalId = p.treatmentId?.animalId ? { tagId: p.treatmentId.animalId } : p.animalId;

            console.log('Mapped Drug Name:', mappedDrugName);
            console.log('Mapped Animal ID:', mappedAnimalId);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

verify();
