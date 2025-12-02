import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AmuConfig from '../models/amuConfig.model.js';
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

const initializeAmuConfig = async () => {
    try {
        // Check if configuration already exists
        const existingConfig = await AmuConfig.findOne({ isActive: true });

        if (existingConfig) {
            console.log('✅ AMU Configuration already exists:');
            console.log(JSON.stringify(existingConfig, null, 2));
            return;
        }

        // Create default configuration based on veterinary best practices
        const defaultConfig = await AmuConfig.create({
            historicalSpikeThreshold: 2.0,  // 200% spike from farm's historical average
            peerComparisonThreshold: 1.5,   // 150% higher than peer farms
            absoluteIntensityThreshold: 0.5, // 0.5 treatments per animal per month
            trendIncreaseThreshold: 0.30,   // 30% increase over 3 months
            criticalDrugThreshold: 0.40,    // 40% critical (Watch/Reserve) drugs
            sustainedHighUsageDuration: 4,  // 4 consecutive weeks
            minimumEventsThreshold: 5,      // Minimum 5 events to avoid noise
            isActive: true
        });

        console.log('✅ Default AMU Configuration created successfully:');
        console.log(JSON.stringify(defaultConfig, null, 2));
        console.log('\n📊 Threshold Explanations:');
        console.log('   - Historical Spike: Alerts when current week > 2.0x farm\'s 6-month average');
        console.log('   - Peer Comparison: Alerts when farm > 1.5x similar farms\' average');
        console.log('   - Absolute Intensity: Alerts when > 0.5 treatments/animal/month');
        console.log('   - Trend Increase: Alerts when AMU increases > 30% over 3 months');
        console.log('   - Critical Drugs: Alerts when >40% of AMU uses Watch/Reserve antibiotics');
        console.log('   - Sustained High: Alerts when high usage persists for 4+ weeks');

    } catch (error) {
        console.error('❌ Error initializing AMU configuration:', error);
        throw error;
    }
};

const run = async () => {
    await connectDB();
    await initializeAmuConfig();
    console.log('\n✅ Initialization complete!');
    process.exit(0);
};

run();
