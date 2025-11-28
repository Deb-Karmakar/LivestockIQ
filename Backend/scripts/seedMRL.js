// Backend/scripts/seedMRL.js

/**
 * Script to seed MRL (Maximum Residue Limit) data into the database
 * Run with: node Backend/scripts/seedMRL.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MRL from '../models/mrl.model.js';
import mrlSeedData from '../seedData/mrlData.js';

// Load environment variables
dotenv.config();

const seedMRL = async () => {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing MRL data
        console.log('🗑️  Clearing existing MRL data...');
        const deleteResult = await MRL.deleteMany({});
        console.log(`   Deleted ${deleteResult.deletedCount} existing records`);

        // Insert new MRL data
        console.log('📥 Inserting MRL seed data...');
        const insertedRecords = await MRL.insertMany(mrlSeedData);
        console.log(`✅ Successfully inserted ${insertedRecords.length} MRL records`);

        // Display summary
        console.log('\n📊 MRL Data Summary:');
        const stats = await MRL.aggregate([
            {
                $group: {
                    _id: '$regulatoryAuthority',
                    count: { $sum: 1 },
                    drugs: { $addToSet: '$drugName' }
                }
            }
        ]);

        stats.forEach(stat => {
            console.log(`   ${stat._id}: ${stat.count} limits for ${stat.drugs.length} unique drugs`);
        });

        // Test the lookup function
        console.log('\n🧪 Testing MRL lookup function...');
        const testLookup = await MRL.findMRLLimit('Oxytetracycline', 'Cattle', 'Milk');
        if (testLookup) {
            console.log(`   ✓ Found MRL for Oxytetracycline in Cattle Milk: ${testLookup.mrlLimit} ${testLookup.unit}`);
            console.log(`   ✓ Withdrawal period: ${testLookup.withdrawalPeriodDays} days`);
        } else {
            console.log('   ✗ Test lookup failed');
        }

        console.log('\n✅ MRL seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding MRL data:', error);
        process.exit(1);
    }
};

// Run the seeding script
seedMRL();
