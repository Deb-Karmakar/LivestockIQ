// Manual script to anchor a specific farm's audit logs to blockchain
// Usage: node jobs/manualAnchor.js <farmerId>

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateAndAnchorFarmSnapshot } from '../services/merkleTree.service.js';
import Farmer from '../models/farmer.model.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/livestockiq';

async function manualAnchor(farmerId) {
    try {
        // Connect to MongoDB
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Verify farmer exists
        const farmer = await Farmer.findById(farmerId);
        if (!farmer) {
            console.error(`❌ Farmer not found with ID: ${farmerId}`);
            process.exit(1);
        }

        console.log(`📍 Farmer: ${farmer.farmOwner || farmer.email}`);
        console.log(`📍 Farm ID: ${farmerId}\n`);

        // Generate and anchor snapshot
        console.log('🔗 Generating Merkle snapshot and anchoring to blockchain...\n');
        const result = await generateAndAnchorFarmSnapshot(farmerId);

        if (!result.merkleRoot) {
            console.log('⚠️  No audit logs found for this farm');
            console.log('   Create some audit logs first, then try again.');
        } else if (result.blockchain) {
            console.log('\n✅ SUCCESS! Blockchain Anchor Created\n');
            console.log('📊 Snapshot Details:');
            console.log(`   • Total Logs: ${result.totalLogs}`);
            console.log(`   • Merkle Root: ${result.merkleRoot.substring(0, 32)}...`);
            console.log(`   • Included Log IDs: ${result.includedLogIds?.length || 0}`);

            console.log('\n🔗 Blockchain Details:');
            console.log(`   • Network: Polygon Amoy Testnet`);
            console.log(`   • Transaction Hash: ${result.blockchain.transactionHash}`);
            console.log(`   • Block Number: ${result.blockchain.blockNumber}`);
            console.log(`   • Snapshot ID: ${result.blockchain.snapshotId}`);

            console.log('\n🌐 View on Explorer:');
            console.log(`   ${result.blockchain.explorerUrl}`);

            console.log('\n✨ All audit logs for this farm are now verifiable on blockchain!\n');
        } else {
            console.log('⚠️  Blockchain anchoring was skipped (blockchain may be unavailable)');
            console.log(`   Merkle root generated: ${result.merkleRoot.substring(0, 32)}...`);
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('\n👋 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Get farmerId from command line argument
const farmerId = process.argv[2];

if (!farmerId) {
    console.error('❌ Usage: node jobs/manualAnchor.js <farmerId>');
    console.error('   Example: node jobs/manualAnchor.js 68d3a1770793abb15993995b');
    process.exit(1);
}

// Run the manual anchor
manualAnchor(farmerId);
