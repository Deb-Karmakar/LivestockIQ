// Backend/seed/seedLabTests.js
// Seed realistic mock lab test data for lab technician testing

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LabTestUpload from '../models/labTestUpload.model.js';
import LabTechnician from '../models/labTechnician.model.js';
import Animal from '../models/animal.model.js';
import Farmer from '../models/farmer.model.js';

dotenv.config();

// Common drugs/substances tested in livestock MRL testing
const drugsAndMRLs = [
    { drug: 'Oxytetracycline', mrl: 100, unit: 'µg/kg', testMethod: 'HPLC' },
    { drug: 'Enrofloxacin', mrl: 100, unit: 'µg/kg', testMethod: 'LC-MS/MS' },
    { drug: 'Sulfamethazine', mrl: 100, unit: 'µg/kg', testMethod: 'ELISA' },
    { drug: 'Penicillin G', mrl: 50, unit: 'µg/kg', testMethod: 'HPLC' },
    { drug: 'Ivermectin', mrl: 10, unit: 'µg/kg', testMethod: 'GC-MS' },
    { drug: 'Chloramphenicol', mrl: 0.3, unit: 'µg/kg', testMethod: 'LC-MS/MS' }, // Very strict
    { drug: 'Tetracycline', mrl: 100, unit: 'µg/kg', testMethod: 'HPLC' },
    { drug: 'Streptomycin', mrl: 500, unit: 'µg/kg', testMethod: 'LC-MS/MS' },
    { drug: 'Gentamicin', mrl: 100, unit: 'µg/kg', testMethod: 'ELISA' },
    { drug: 'Amoxicillin', mrl: 50, unit: 'µg/kg', testMethod: 'HPLC' },
    { drug: 'Ciprofloxacin', mrl: 100, unit: 'µg/kg', testMethod: 'LC-MS/MS' },
    { drug: 'Doxycycline', mrl: 100, unit: 'µg/kg', testMethod: 'HPLC' },
    { drug: 'Flunixin', mrl: 20, unit: 'µg/kg', testMethod: 'GC-MS' },
    { drug: 'Meloxicam', mrl: 15, unit: 'µg/kg', testMethod: 'LC-MS/MS' },
    { drug: 'Clenbuterol', mrl: 0.1, unit: 'µg/kg', testMethod: 'LC-MS/MS' }, // Very strict - banned growth promoter
];

const sampleTypes = ['Milk', 'Blood', 'Meat', 'Tissue', 'Urine'];
const productTypes = ['Milk', 'Meat', 'Eggs'];
const statuses = ['Pending Review', 'Verified', 'Approved', 'Rejected'];

// Generate realistic residue level based on whether it should pass
const generateResidueLevel = (mrl, shouldPass) => {
    if (shouldPass) {
        // Pass: 0 to 90% of MRL
        return parseFloat((Math.random() * mrl * 0.9).toFixed(2));
    } else {
        // Fail: 101% to 200% of MRL
        return parseFloat((mrl * (1.01 + Math.random() * 0.99)).toFixed(2));
    }
};

// Generate report number
const generateReportNumber = (labName, year, index) => {
    const labCode = labName.replace(/\s+/g, '').substring(0, 4).toUpperCase();
    return `${labCode}-${year}-${String(index).padStart(5, '0')}`;
};

const seedLabTests = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for seeding...');

        // Get existing data
        const labTechs = await LabTechnician.find().limit(5);
        const animals = await Animal.find().limit(50);
        const farmers = await Farmer.find().limit(20);

        if (labTechs.length === 0) {
            console.log('No lab technicians found. Please create a lab technician first.');
            process.exit(1);
        }

        console.log(`Found ${labTechs.length} lab technicians, ${animals.length} animals, ${farmers.length} farmers`);

        // Clear existing lab test uploads (optional - comment out if you want to keep existing data)
        // await LabTestUpload.deleteMany({});
        // console.log('Cleared existing lab test uploads');

        const mockTests = [];
        const currentYear = new Date().getFullYear();
        let reportIndex = 1;

        // Generate tests for the past 6 months
        for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
            const testDate = new Date();
            testDate.setMonth(testDate.getMonth() - monthOffset);

            // Generate 5-15 tests per month
            const testsPerMonth = 5 + Math.floor(Math.random() * 10);

            for (let i = 0; i < testsPerMonth; i++) {
                const labTech = labTechs[Math.floor(Math.random() * labTechs.length)];
                const animal = animals.length > 0 ? animals[Math.floor(Math.random() * animals.length)] : null;
                const farmer = farmers.length > 0 ? farmers[Math.floor(Math.random() * farmers.length)] : null;
                const drugInfo = drugsAndMRLs[Math.floor(Math.random() * drugsAndMRLs.length)];

                // 85% pass rate (realistic)
                const shouldPass = Math.random() < 0.85;
                const residueLevel = generateResidueLevel(drugInfo.mrl, shouldPass);

                // Randomize test date within the month
                const randomDay = Math.floor(Math.random() * 28) + 1;
                const actualTestDate = new Date(testDate.getFullYear(), testDate.getMonth(), randomDay);

                const sampleCollectionDate = new Date(actualTestDate);
                sampleCollectionDate.setDate(sampleCollectionDate.getDate() - Math.floor(Math.random() * 3) - 1);

                // Determine status based on age
                let status = 'Pending Review';
                if (monthOffset > 0) {
                    // Older tests are more likely to be reviewed
                    const statusRoll = Math.random();
                    if (statusRoll < 0.4) status = 'Approved';
                    else if (statusRoll < 0.7) status = 'Verified';
                    else if (statusRoll < 0.85) status = 'Pending Review';
                    else status = shouldPass ? 'Approved' : 'Rejected';
                }

                const test = {
                    labTechnicianId: labTech._id,
                    labTechnicianName: labTech.fullName,
                    labName: labTech.labName,
                    labCertificationNumber: labTech.labCertificationNumber,

                    animalTagId: animal?.tagId || `TMP${String(reportIndex).padStart(9, '0')}`,
                    animalName: animal?.name || `Test Animal ${reportIndex}`,
                    animalSpecies: animal?.species || ['Cattle', 'Buffalo', 'Goat', 'Sheep'][Math.floor(Math.random() * 4)],

                    farmerId: farmer?._id || animal?.farmerId,
                    farmerName: farmer?.farmOwner || 'Unknown Farmer',
                    farmName: farmer?.farmName || 'Test Farm',

                    testType: 'MRL',
                    drugOrSubstanceTested: drugInfo.drug,
                    sampleType: sampleTypes[Math.floor(Math.random() * sampleTypes.length)],
                    productType: productTypes[Math.floor(Math.random() * productTypes.length)],

                    residueLevelDetected: residueLevel,
                    unit: drugInfo.unit,
                    mrlThreshold: drugInfo.mrl,
                    isPassed: shouldPass,

                    testDate: actualTestDate,
                    sampleCollectionDate: sampleCollectionDate,
                    testReportNumber: generateReportNumber(labTech.labName, currentYear, reportIndex),
                    certificateUrl: `https://lab-reports.example.com/certificates/${generateReportNumber(labTech.labName, currentYear, reportIndex)}.pdf`,

                    testMethod: drugInfo.testMethod,
                    detectionLimit: parseFloat((drugInfo.mrl * 0.01).toFixed(3)),

                    status: status,
                    farmerNotified: monthOffset > 0,
                    farmerNotifiedDate: monthOffset > 0 ? actualTestDate : null,

                    notes: shouldPass
                        ? `Sample tested for ${drugInfo.drug}. Results within safe limits.`
                        : `WARNING: ${drugInfo.drug} levels exceed MRL threshold. Follow-up required.`,
                };

                mockTests.push(test);
                reportIndex++;
            }
        }

        // Insert all mock tests
        const inserted = await LabTestUpload.insertMany(mockTests);
        console.log(`✅ Successfully seeded ${inserted.length} lab test records`);

        // Summary stats
        const passedCount = inserted.filter(t => t.isPassed).length;
        const failedCount = inserted.length - passedCount;
        console.log(`   - Passed: ${passedCount} (${((passedCount / inserted.length) * 100).toFixed(1)}%)`);
        console.log(`   - Failed: ${failedCount} (${((failedCount / inserted.length) * 100).toFixed(1)}%)`);

        const statusCounts = {};
        inserted.forEach(t => {
            statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
        });
        console.log('   - Status breakdown:', statusCounts);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding lab tests:', error);
        process.exit(1);
    }
};

seedLabTests();
