// Script to check and optionally remove duplicate lab technician entries
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LabTechnician from './models/labTechnician.model.js';

dotenv.config();

const checkDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB\n');

        // Find all lab technicians ordered by ID
        const allLabTechs = await LabTechnician.find({}).sort({ labTechId: 1 });

        console.log(`Found ${allLabTechs.length} lab technician(s):\n`);

        allLabTechs.forEach((tech, index) => {
            console.log(`${index + 1}. ${tech.labTechId} - ${tech.fullName} (${tech.email})`);
        });

        // Find duplicates by labTechId
        const duplicates = await LabTechnician.aggregate([
            {
                $group: {
                    _id: '$labTechId',
                    count: { $sum: 1 },
                    docs: { $push: { _id: '$_id', email: '$email', fullName: '$fullName' } }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            }
        ]);

        if (duplicates.length > 0) {
            console.log('\n⚠️  Found duplicate labTechId(s):');
            duplicates.forEach(dup => {
                console.log(`\n  labTechId: ${dup._id} (${dup.count} entries)`);
                dup.docs.forEach((doc, i) => {
                    console.log(`    ${i + 1}. ${doc.fullName} (${doc.email}) - ID: ${doc._id}`);
                });
            });
        } else {
            console.log('\n✓ No duplicates found!');
        }

        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
    } catch (error) {
        console.error('Error:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
};

checkDuplicates();
