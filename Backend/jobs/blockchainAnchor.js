import cron from 'node-cron';
import Farmer from '../models/farmer.model.js';
import { generateAndAnchorFarmSnapshot } from '../services/merkleTree.service.js';

/**
 * Scheduled job to automatically anchor all farms to blockchain
 * Runs every 6 hours by default
 */
export const startBlockchainAnchorJob = () => {
    // Schedule: Run every 6 hours (0 */6 * * *)
    // You can change this to:
    // - Every hour: '0 * * * *'
    // - Every day at midnight: '0 0 * * *'
    // - Every 12 hours: '0 */12 * * *'

    const schedule = '0 */6 * * *'; // Every 6 hours

    cron.schedule(schedule, async () => {
        console.log('\n🔗 ========================================');
        console.log('🔗 Starting scheduled blockchain anchoring...');
        console.log('🔗 ========================================\n');

        try {
            // Get all farmers (isActive defaults to true if not set)
            const farmers = await Farmer.find({ isActive: { $ne: false } }).select('_id farmOwner email');

            if (farmers.length === 0) {
                console.log('⚠️  No active farmers found. Skipping anchoring.');
                return;
            }

            console.log(`📊 Found ${farmers.length} active farmers to anchor\n`);

            let successCount = 0;
            let skipCount = 0;
            let errorCount = 0;

            // Anchor each farm's data
            for (const farmer of farmers) {
                try {
                    console.log(`📍 Processing farm: ${farmer.farmOwner || farmer.email} (${farmer._id})`);

                    const result = await generateAndAnchorFarmSnapshot(farmer._id);

                    if (!result.merkleRoot) {
                        console.log(`   ⏭️  Skipped: No audit logs found`);
                        skipCount++;
                    } else if (result.blockchain) {
                        console.log(`   ✅ Anchored: ${result.totalLogs} logs`);
                        console.log(`   📍 TX: ${result.blockchain.transactionHash.substring(0, 20)}...`);
                        console.log(`   🔗 Block: ${result.blockchain.blockNumber}`);
                        successCount++;
                    } else {
                        console.log(`   ⚠️  Generated Merkle root but blockchain not configured`);
                        skipCount++;
                    }

                    console.log(''); // Empty line for readability

                } catch (error) {
                    console.error(`   ❌ Error anchoring farm ${farmer.farmOwner || farmer.email}:`, error.message);
                    errorCount++;
                }
            }

            // Summary
            console.log('🔗 ========================================');
            console.log('🔗 Blockchain Anchoring Summary:');
            console.log(`   ✅ Successful: ${successCount}`);
            console.log(`   ⏭️  Skipped: ${skipCount}`);
            console.log(`   ❌ Errors: ${errorCount}`);
            console.log(`   📊 Total: ${farmers.length}`);
            console.log('🔗 ========================================\n');

        } catch (error) {
            console.error('❌ Blockchain anchoring job failed:', error);
        }
    });

    console.log(`✅ Blockchain anchoring job scheduled (${schedule})`);
    console.log('   Next run: Every 6 hours');
};

/**
 * Manual trigger for blockchain anchoring (for testing or admin panel)
 */
export const triggerManualAnchoring = async () => {
    console.log('🔗 Manual blockchain anchoring triggered...');

    try {
        const farmers = await Farmer.find({ isActive: { $ne: false } }).select('_id farmOwner');

        const results = [];
        for (const farmer of farmers) {
            try {
                const result = await generateAndAnchorFarmSnapshot(farmer._id);
                results.push({
                    farmerId: farmer._id,
                    farmerName: farmer.farmOwner,
                    success: !!result.blockchain,
                    merkleRoot: result.merkleRoot,
                    totalLogs: result.totalLogs,
                    blockchain: result.blockchain
                });
            } catch (error) {
                results.push({
                    farmerId: farmer._id,
                    farmerName: farmer.farmOwner,
                    success: false,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            totalFarms: farmers.length,
            results
        };
    } catch (error) {
        console.error('Error in manual anchoring:', error);
        throw error;
    }
};
