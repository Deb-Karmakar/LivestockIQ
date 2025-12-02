// Backend/scripts/seedDemoAmuAlerts.js

/**
 * Demo Script: Seed AMU Alerts for Hackathon Demo
 * Creates sample alerts for all 6 AMU alert types
 * Run with: node Backend/scripts/seedDemoAmuAlerts.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import HighAmuAlert from '../models/highAmuAlert.model.js';
import Farmer from '../models/farmer.model.js';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from Backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedDemoAlerts = async () => {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find a farmer to associate alerts with (use the first one)
        const farmer = await Farmer.findOne();
        if (!farmer) {
            console.log('❌ No farmer found in database. Please create a farmer first.');
            process.exit(1);
        }

        console.log(`📌 Using farmer: ${farmer.farmName} (${farmer._id})`);

        // Clear existing alerts for this farmer (optional - comment out to keep existing)
        console.log('🗑️  Clearing existing demo alerts...');
        await HighAmuAlert.deleteMany({ farmerId: farmer._id });

        // Create demo alerts for all 6 types
        const demoAlerts = [
            // 1. HISTORICAL_SPIKE
            {
                farmerId: farmer._id,
                alertType: 'HISTORICAL_SPIKE',
                severity: 'High',
                message: 'AMU spike detected: 2.25x higher than farm\'s 6-month average (0.18)',
                details: {
                    currentWeekCount: 45,
                    historicalWeeklyAverage: 20,
                    threshold: '>200%',
                    breakdown: 'Treatments: 30, Feed: 15',
                    drugClassBreakdown: {
                        access: 25,
                        watch: 15,
                        reserve: 5,
                        unclassified: 0
                    }
                },
                status: 'New'
            },

            // 2. PEER_COMPARISON_SPIKE
            {
                farmerId: farmer._id,
                alertType: 'PEER_COMPARISON_SPIKE',
                severity: 'Medium',
                message: 'AMU usage 1.6x higher than similar farms (medium cattle operations)',
                details: {
                    farmAmuIntensity: 0.40,
                    peerGroupAverage: 0.25,
                    peerGroupSize: 'Medium',
                    speciesType: 'Cattle',
                    drugClassBreakdown: {
                        access: 30,
                        watch: 12,
                        reserve: 3,
                        unclassified: 5
                    }
                },
                status: 'New'
            },

            // 3. ABSOLUTE_THRESHOLD
            {
                farmerId: farmer._id,
                alertType: 'ABSOLUTE_THRESHOLD',
                severity: 'Critical',
                message: 'Absolute AMU threshold exceeded: 0.65 (limit: 0.5)',
                details: {
                    currentIntensity: 0.65,
                    threshold: 0.5,
                    exceedancePercentage: '30%',
                    drugClassBreakdown: {
                        access: 35,
                        watch: 20,
                        reserve: 10,
                        unclassified: 0
                    }
                },
                status: 'New'
            },

            // 4. TREND_INCREASE
            {
                farmerId: farmer._id,
                alertType: 'TREND_INCREASE',
                severity: 'Low',
                message: 'AMU trending upward: +40% over last 3 months',
                details: {
                    month1Intensity: 0.20,
                    month2Intensity: 0.24,
                    month3Intensity: 0.28,
                    percentageIncrease: 40,
                    threshold: '30%',
                    drugClassBreakdown: {
                        access: 40,
                        watch: 10,
                        reserve: 2,
                        unclassified: 3
                    }
                },
                status: 'New'
            },

            // 5. CRITICAL_DRUG_USAGE
            {
                farmerId: farmer._id,
                alertType: 'CRITICAL_DRUG_USAGE',
                severity: 'High',
                message: 'Critical antibiotic usage: 50% of AMU uses Watch/Reserve drugs (limit: 40%)',
                details: {
                    totalEvents: 80,
                    criticalDrugCount: 40,
                    criticalPercentage: 50,
                    threshold: 40,
                    drugClassBreakdown: {
                        access: 40,
                        watch: 28,
                        reserve: 12,
                        unclassified: 0
                    }
                },
                status: 'New'
            },

            // 6. SUSTAINED_HIGH_USAGE
            {
                farmerId: farmer._id,
                alertType: 'SUSTAINED_HIGH_USAGE',
                severity: 'Critical',
                message: 'Sustained high AMU: 4 consecutive weeks above 2x farm average',
                details: {
                    consecutiveWeeks: 4,
                    threshold: 4,
                    farmAverage: 0.25,
                    weeklyIntensities: [0.52, 0.48, 0.55, 0.50],
                    drugClassBreakdown: {
                        access: 50,
                        watch: 30,
                        reserve: 8,
                        unclassified: 2
                    }
                },
                status: 'New'
            }
        ];

        // Insert demo alerts
        console.log('📥 Creating demo AMU alerts...');
        const insertedAlerts = await HighAmuAlert.insertMany(demoAlerts);
        console.log(`✅ Successfully created ${insertedAlerts.length} demo alerts!`);

        // Display summary
        console.log('\n📊 Demo Alerts Summary:');
        console.log('┌─────────────────────────────┬──────────┬────────────┐');
        console.log('│ Alert Type                  │ Severity │ Status     │');
        console.log('├─────────────────────────────┼──────────┼────────────┤');

        insertedAlerts.forEach(alert => {
            const type = alert.alertType.padEnd(27);
            const severity = alert.severity.padEnd(8);
            const status = alert.status.padEnd(10);
            console.log(`│ ${type} │ ${severity} │ ${status} │`);
        });

        console.log('└─────────────────────────────┴──────────┴────────────┘');

        console.log('\n🎯 Demo Ready!');
        console.log(`\n📍 Login as farmer: ${farmer.email}`);
        console.log('📍 Navigate to: /farmer/alerts');
        console.log('📍 You should see all 6 alert types displayed!\n');

        console.log('💡 Tips for Demo:');
        console.log('   1. Show the different severity badges (Critical, High, Medium, Low)');
        console.log('   2. Highlight the drug class breakdown for each alert');
        console.log('   3. Explain what each alert type means');
        console.log('   4. Click on alerts to show details');
        console.log('   5. Show the AMU Management page for regulators\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding demo alerts:', error);
        process.exit(1);
    }
};

// Run the seeding script
seedDemoAlerts();
