import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
    runHistoricalSpikeAnalysis,
    runPeerComparisonAnalysis,
    runAbsoluteThresholdAnalysis,
    runTrendAnalysis,
    runCriticalDrugMonitoring,
    runSustainedHighUsageAnalysis,
    runAllAmuAnalysis
} from '../jobs/amuAnalysis.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

const runTests = async () => {
    await connectDB();

    console.log('\n🔬 === ENHANCED AMU ANALYSIS TEST SUITE ===\n');

    console.log('--- Test 1: Historical Spike Analysis ---');
    await runHistoricalSpikeAnalysis();

    console.log('\n--- Test 2: Peer Comparison Analysis ---');
    await runPeerComparisonAnalysis();

    console.log('\n--- Test 3: Absolute Threshold Analysis ---');
    await runAbsoluteThresholdAnalysis();

    console.log('\n--- Test 4: Trend Analysis ---');
    await runTrendAnalysis();

    console.log('\n--- Test 5: Critical Drug Monitoring ---');
    await runCriticalDrugMonitoring();

    console.log('\n--- Test 6: Sustained High Usage Analysis ---');
    await runSustainedHighUsageAnalysis();

    console.log('\n✅ === ALL TESTS COMPLETED ===\n');
    process.exit(0);
};

runTests();
