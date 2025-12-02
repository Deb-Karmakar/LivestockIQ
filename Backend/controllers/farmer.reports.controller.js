// Backend/controllers/farmer.reports.controller.js

import Treatment from '../models/treatment.model.js';
import FeedAdministration from '../models/feedAdministration.model.js';
import Animal from '../models/animal.model.js';
import Farmer from '../models/farmer.model.js';
import LabTest from '../models/labTest.model.js';
import { subMonths, format } from 'date-fns';

// @desc    Get Farmer AMU Report Data
// @route   GET /api/reports/farmer/amu-data
// @access  Private (Farmer)
export const getFarmerAmuReportData = async (req, res) => {
    try {
        const { from, to } = req.query;
        const farmerId = req.user._id;
        const startDate = new Date(from);
        const endDate = new Date(to);

        const [monthlyTrend, drugBreakdown, drugClassBreakdown, totalStats] = await Promise.all([
            // Monthly AMU trend
            Treatment.aggregate([
                { $match: { farmerId, status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$startDate' },
                            month: { $month: '$startDate' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),

            // Top drugs used
            Treatment.aggregate([
                { $match: { farmerId, status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$drugName', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),

            // Drug class breakdown (WHO AWaRe)
            Treatment.aggregate([
                { $match: { farmerId, status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$drugClass', count: { $sum: 1 } } }
            ]),

            // Overall statistics
            Promise.all([
                Treatment.countDocuments({ farmerId, status: 'Approved', startDate: { $gte: startDate, $lte: endDate } }),
                Treatment.distinct('drugName', { farmerId, status: 'Approved', startDate: { $gte: startDate, $lte: endDate } }),
                Animal.countDocuments({ farmerId, status: 'Active' })
            ])
        ]);

        // Format trend data
        const trendData = monthlyTrend.map(item => ({
            name: format(new Date(item._id.year, item._id.month - 1), 'MMM yyyy'),
            usage: item.count
        }));

        // Format drug breakdown
        const drugData = drugBreakdown.map(item => ({
            name: item._id,
            count: item.count
        }));

        // Process drug class breakdown
        const classStats = { Access: 0, Watch: 0, Reserve: 0, Unclassified: 0 };
        drugClassBreakdown.forEach(item => {
            const className = item._id || 'Unclassified';
            if (classStats.hasOwnProperty(className)) {
                classStats[className] = item.count;
            } else {
                classStats.Unclassified += item.count;
            }
        });

        const classData = Object.entries(classStats)
            .filter(([key, value]) => value > 0)
            .map(([key, value]) => ({ name: key, value }));

        res.json({
            reportType: 'AmuUsage',
            data: trendData,
            drugBreakdown: drugData,
            drugClassBreakdown: classData,
            summary: {
                totalTreatments: totalStats[0],
                uniqueDrugs: totalStats[1].length,
                activeAnimals: totalStats[2],
                averagePerMonth: trendData.length > 0 ? Math.round(totalStats[0] / trendData.length) : 0,
                accessCount: classStats.Access,
                watchCount: classStats.Watch,
                reserveCount: classStats.Reserve
            },
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getFarmerAmuReportData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get Farmer Animal Health Report Data
// @route   GET /api/reports/farmer/animal-health-data
// @access  Private (Farmer)
export const getFarmerAnimalHealthReportData = async (req, res) => {
    try {
        const { from, to } = req.query;
        const farmerId = req.user._id;
        const startDate = new Date(from);
        const endDate = new Date(to);

        const [mrlStatusBreakdown, activeTreatments, recentTests, healthStats] = await Promise.all([
            // MRL Status distribution
            Animal.aggregate([
                { $match: { farmerId } },
                { $group: { _id: '$mrlStatus', count: { $sum: 1 } } }
            ]),

            // Active treatments in period
            Treatment.countDocuments({
                farmerId,
                status: 'Approved',
                startDate: { $gte: startDate, $lte: endDate }
            }),

            // Recent lab tests
            LabTest.aggregate([
                {
                    $lookup: {
                        from: 'animals',
                        localField: 'animalId',
                        foreignField: 'tagId',
                        as: 'animalInfo'
                    }
                },
                { $unwind: '$animalInfo' },
                { $match: { 'animalInfo.farmerId': farmerId, testDate: { $gte: startDate, $lte: endDate } } },
                {
                    $group: {
                        _id: '$isPassed',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Overall health statistics
            Promise.all([
                Animal.countDocuments({ farmerId, status: 'Active' }),
                Animal.countDocuments({ farmerId, status: 'Sold' }),
                Animal.countDocuments({ farmerId, status: 'Deceased' }),
                Animal.countDocuments({ farmerId, mrlStatus: 'VIOLATION' })
            ])
        ]);

        // Process MRL status
        const mrlStats = {
            'SAFE': 0,
            'WITHDRAWAL_ACTIVE': 0,
            'TEST_REQUIRED': 0,
            'PENDING_VERIFICATION': 0,
            'VIOLATION': 0
        };
        mrlStatusBreakdown.forEach(item => {
            if (mrlStats.hasOwnProperty(item._id)) {
                mrlStats[item._id] = item.count;
            }
        });

        const mrlData = Object.entries(mrlStats)
            .filter(([key, value]) => value > 0)
            .map(([key, value]) => ({
                name: key.replace(/_/g, ' '),
                value
            }));

        // Test results
        const testStats = { passed: 0, failed: 0 };
        recentTests.forEach(item => {
            if (item._id === true) testStats.passed = item.count;
            else if (item._id === false) testStats.failed = item.count;
        });

        res.json({
            reportType: 'AnimalHealth',
            data: mrlData,
            summary: {
                totalAnimals: healthStats[0],
                activeAnimals: healthStats[0],
                soldAnimals: healthStats[1],
                deceasedAnimals: healthStats[2],
                mrlViolations: healthStats[3],
                activeTreatments,
                testsPassed: testStats.passed,
                testsFailed: testStats.failed,
                complianceRate: healthStats[0] > 0
                    ? (((healthStats[0] - healthStats[3]) / healthStats[0]) * 100).toFixed(1)
                    : 100
            },
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getFarmerAnimalHealthReportData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get Farmer Herd Demographics Data
// @route   GET /api/reports/farmer/herd-demographics-data
// @access  Private (Farmer)
export const getFarmerHerdDemographicsData = async (req, res) => {
    try {
        const farmerId = req.user._id;

        const [speciesBreakdown, ageDistribution, genderBreakdown] = await Promise.all([
            // Species composition
            Animal.aggregate([
                { $match: { farmerId, status: 'Active' } },
                { $group: { _id: '$species', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // Age distribution
            Animal.aggregate([
                { $match: { farmerId, status: 'Active' } },
                {
                    $project: {
                        age: { $divide: [{ $subtract: [new Date(), '$dob'] }, (365 * 24 * 60 * 60 * 1000)] }
                    }
                },
                {
                    $bucket: {
                        groupBy: "$age",
                        boundaries: [0, 1, 3, 5, 10, Infinity],
                        default: "Unknown",
                        output: { count: { $sum: 1 } }
                    }
                }
            ]),

            // Gender breakdown
            Animal.aggregate([
                { $match: { farmerId, status: 'Active' } },
                { $group: { _id: '$gender', count: { $sum: 1 } } }
            ])
        ]);

        // Format species data
        const speciesData = speciesBreakdown.map(item => ({
            name: item._id,
            value: item.count
        }));

        // Format age data
        const ageLabels = ['0-1 Years', '1-3 Years', '3-5 Years', '5-10 Years', '10+ Years'];
        const ageData = ageDistribution.map((item, index) => ({
            name: ageLabels[index] || 'Unknown',
            count: item.count
        }));

        // Format gender data
        const genderData = genderBreakdown.map(item => ({
            name: item._id,
            value: item.count
        }));

        const totalAnimals = speciesData.reduce((sum, item) => sum + item.value, 0);

        res.json({
            reportType: 'HerdDemographics',
            data: speciesData,
            ageDistribution: ageData,
            genderDistribution: genderData,
            summary: {
                totalAnimals,
                speciesCount: speciesData.length,
                averageAge: ageData.length > 0
                    ? ((ageData[0].count * 0.5 + ageData[1].count * 2 + ageData[2].count * 4 +
                        ageData[3].count * 7.5 + ageData[4].count * 12) / totalAnimals).toFixed(1)
                    : 0,
                maleCount: genderBreakdown.find(g => g._id === 'Male')?.count || 0,
                femaleCount: genderBreakdown.find(g => g._id === 'Female')?.count || 0
            },
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getFarmerHerdDemographicsData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get Farmer Treatment History Data
// @route   GET /api/reports/farmer/treatment-history-data
// @access  Private (Farmer)
export const getFarmerTreatmentHistoryData = async (req, res) => {
    try {
        const { from, to } = req.query;
        const farmerId = req.user._id;
        const startDate = new Date(from);
        const endDate = new Date(to);

        const [treatments, feedAdministrations] = await Promise.all([
            // Individual treatments
            Treatment.find({
                farmerId,
                status: 'Approved',
                startDate: { $gte: startDate, $lte: endDate }
            })
                .select('animalId drugName drugClass startDate withdrawalPeriod vetNotes')
                .sort({ startDate: -1 })
                .limit(100)
                .lean(),

            // Feed administrations
            FeedAdministration.find({
                farmerId,
                vetApproved: true,
                administrationDate: { $gte: startDate, $lte: endDate }
            })
                .select('feedType numberOfAnimals administrationDate prescribedByVet')
                .sort({ administrationDate: -1 })
                .limit(50)
                .lean()
        ]);

        // Format treatment data
        const treatmentData = treatments.map(t => ({
            date: format(new Date(t.startDate), 'yyyy-MM-dd'),
            animalId: t.animalId,
            type: 'Individual Treatment',
            drug: t.drugName,
            drugClass: t.drugClass || 'Unclassified',
            withdrawalDays: t.withdrawalPeriod || 0,
            notes: t.vetNotes ? t.vetNotes.substring(0, 50) : ''
        }));

        // Format feed data
        const feedData = feedAdministrations.map(f => ({
            date: format(new Date(f.administrationDate), 'yyyy-MM-dd'),
            type: 'Medicated Feed',
            drug: f.feedType,
            numberOfAnimals: f.numberOfAnimals,
            prescribedBy: f.prescribedByVet
        }));

        // Combine and sort by date
        const allRecords = [...treatmentData, ...feedData].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        res.json({
            reportType: 'TreatmentHistory',
            data: allRecords.slice(0, 100),
            summary: {
                totalTreatments: treatments.length,
                totalFeedAdministrations: feedAdministrations.length,
                totalRecords: treatments.length + feedAdministrations.length,
                dateRangeStart: format(startDate, 'MMM dd, yyyy'),
                dateRangeEnd: format(endDate, 'MMM dd, yyyy')
            },
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getFarmerTreatmentHistoryData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get Farmer MRL Compliance Data
// @route   GET /api/reports/farmer/mrl-compliance-data
// @access  Private (Farmer)
export const getFarmerMrlComplianceData = async (req, res) => {
    try {
        const { from, to } = req.query;
        const farmerId = req.user._id;
        const startDate = new Date(from);
        const endDate = new Date(to);

        const [mrlStatusCounts, withdrawalActive, testResults, recentViolations] = await Promise.all([
            // MRL status counts
            Animal.aggregate([
                { $match: { farmerId } },
                { $group: { _id: '$mrlStatus', count: { $sum: 1 } } }
            ]),

            // Animals in withdrawal
            Animal.find({
                farmerId,
                mrlStatus: 'WITHDRAWAL_ACTIVE',
                withdrawalEndDate: { $exists: true }
            })
                .select('tagId species withdrawalEndDate')
                .lean(),

            // Lab test results
            LabTest.aggregate([
                {
                    $lookup: {
                        from: 'animals',
                        localField: 'animalId',
                        foreignField: 'tagId',
                        as: 'animalInfo'
                    }
                },
                { $unwind: '$animalInfo' },
                {
                    $match: {
                        'animalInfo.farmerId': farmerId,
                        testDate: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $project: {
                        animalId: 1,
                        testDate: 1,
                        isPassed: 1,
                        residuesDetected: 1
                    }
                },
                { $sort: { testDate: -1 } },
                { $limit: 20 }
            ]),

            // Recent violations
            Animal.find({
                farmerId,
                mrlStatus: 'VIOLATION'
            })
                .select('tagId species')
                .lean()
        ]);

        // Process MRL status
        const statusCounts = {
            SAFE: 0,
            WITHDRAWAL_ACTIVE: 0,
            TEST_REQUIRED: 0,
            PENDING_VERIFICATION: 0,
            VIOLATION: 0
        };
        mrlStatusCounts.forEach(item => {
            if (statusCounts.hasOwnProperty(item._id)) {
                statusCounts[item._id] = item.count;
            }
        });

        const statusData = Object.entries(statusCounts)
            .filter(([key, value]) => value > 0)
            .map(([key, value]) => ({
                name: key.replace(/_/g, ' '),
                value
            }));

        // Format withdrawal data
        const withdrawalData = withdrawalActive.map(animal => ({
            animalId: animal.tagId,
            species: animal.species,
            withdrawalEnds: format(new Date(animal.withdrawalEndDate), 'MMM dd, yyyy'),
            daysRemaining: Math.ceil((new Date(animal.withdrawalEndDate) - new Date()) / (1000 * 60 * 60 * 24))
        }));

        // Test pass rate
        const totalTests = testResults.length;
        const passedTests = testResults.filter(t => t.isPassed).length;
        const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 100;

        res.json({
            reportType: 'MrlCompliance',
            data: statusData,
            withdrawalAnimals: withdrawalData,
            recentTests: testResults,
            summary: {
                totalAnimals: Object.values(statusCounts).reduce((sum, val) => sum + val, 0),
                safeAnimals: statusCounts.SAFE,
                inWithdrawal: statusCounts.WITHDRAWAL_ACTIVE,
                requireTests: statusCounts.TEST_REQUIRED,
                violations: statusCounts.VIOLATION,
                totalTests,
                testPassRate: parseFloat(passRate),
                complianceRate: statusCounts.SAFE > 0
                    ? ((statusCounts.SAFE / Object.values(statusCounts).reduce((sum, val) => sum + val, 0)) * 100).toFixed(1)
                    : 0
            },
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getFarmerMrlComplianceData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};
