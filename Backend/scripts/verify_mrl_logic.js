import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Farmer from '../models/farmer.model.js';
import Animal from '../models/animal.model.js';
import ComplianceAlert from '../models/complianceAlert.model.js';

dotenv.config();

const verifyMrlLogic = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Fetch all animals with MRL Violation
        const mrlViolations = await Animal.find({ mrlStatus: 'VIOLATION' }).select('farmerId tagId');
        console.log(`Found ${mrlViolations.length} animals with MRL Violations.`);

        if (mrlViolations.length === 0) {
            console.log("No MRL violations found. Creating a dummy violation for testing...");
            // Find a random farmer
            const farmer = await Farmer.findOne();
            if (farmer) {
                // Find an animal belonging to this farmer
                const animal = await Animal.findOne({ farmerId: farmer._id });
                if (animal) {
                    console.log(`Updating animal ${animal.tagId} to VIOLATION status.`);
                    await Animal.updateOne({ _id: animal._id }, { mrlStatus: 'VIOLATION' });
                    // Re-fetch
                    const newViolations = await Animal.find({ mrlStatus: 'VIOLATION' });
                    console.log(`Now found ${newViolations.length} animals with MRL Violations.`);
                } else {
                    console.log("No animals found for this farmer.");
                }
            } else {
                console.log("No farmers found.");
            }
        }

        // 2. Simulate the Map Data Logic
        const farms = await Farmer.find({
            'location.latitude': { $exists: true, $ne: null },
            'location.longitude': { $exists: true, $ne: null }
        }).select('farmName _id');

        const currentViolations = await Animal.find({ mrlStatus: 'VIOLATION' }).select('farmerId tagId');
        const openComplianceAlerts = await ComplianceAlert.find({ status: 'Open' }).select('farmerId');

        console.log("\n--- Checking Farm Status Logic ---");
        let criticalFarms = 0;

        farms.forEach(farm => {
            const farmIdStr = farm._id.toString();
            const farmMrlViolations = currentViolations.filter(a => a.farmerId.toString() === farmIdStr);
            const farmComplianceAlerts = openComplianceAlerts.filter(a => a.farmerId.toString() === farmIdStr);

            const hasCriticalIssues = farmComplianceAlerts.length > 0 || farmMrlViolations.length > 0;

            if (hasCriticalIssues) {
                criticalFarms++;
                console.log(`Farm: ${farm.farmName} (${farm._id})`);
                console.log(`  - Status: Critical`);
                console.log(`  - MRL Violations: ${farmMrlViolations.length}`);
                console.log(`  - Compliance Alerts: ${farmComplianceAlerts.length}`);
                if (farmMrlViolations.length > 0) {
                    console.log(`  - SUCCESS: MRL Violation correctly triggered Critical status.`);
                }
            }
        });

        console.log(`\nTotal Critical Farms: ${criticalFarms}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

verifyMrlLogic();
