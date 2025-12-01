import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models and utils using relative paths from Backend/scripts/
import Animal from '../models/animal.model.js';
import Treatment from '../models/treatment.model.js';
import FeedAdministration from '../models/feedAdministration.model.js';
import LabTest from '../models/labTest.model.js';
import { calculateAnimalMRLStatus } from '../utils/mrlStatusCalculator.js';

// Load env vars from Backend root (one level up)
dotenv.config({ path: path.join(__dirname, '../.env') });

const migrate = async () => {
    try {
        console.log('Connecting to MongoDB...', process.env.MONGO_URI ? 'URI found' : 'URI missing');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const animals = await Animal.find({});
        console.log(`Found ${animals.length} animals to migrate.`);

        let updatedCount = 0;
        for (const animal of animals) {
            // calculateAnimalMRLStatus expects (animal, farmerId)
            const result = await calculateAnimalMRLStatus(animal, animal.farmerId);

            // Update if different or if mrlStatus is missing
            if (result.mrlStatus !== animal.mrlStatus) {
                // console.log(`Updating Animal ${animal.tagId}: ${animal.mrlStatus || 'N/A'} -> ${result.mrlStatus}`);
                animal.mrlStatus = result.mrlStatus;
                await animal.save();
                updatedCount++;
            }
        }

        console.log(`Migration completed. Updated ${updatedCount} animals.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
