// Backend/controllers/reports.analytics.controller.js

import Treatment from '../models/treatment.model.js';
import FeedAdministration from '../models/feedAdministration.model.js';
import ComplianceAlert from '../models/complianceAlert.model.js';
import RegulatorAlert from '../models/regulatorAlert.model.js';
import HighAmuAlert from '../models/highAmuAlert.model.js';
import Animal from '../models/animal.model.js';
import Farmer from '../models/farmer.model.js';
import Veterinarian from '../models/vet.model.js';
import { subMonths, format } from 'date-fns';

// @desc    Get Compliance & Violation Report Data
// @route   GET /api/regulator/reports/compliance-data
// @access  Private (Regulator)
export const getComplianceReportData = async (req, res) => {
    try {
        const { from, to } = req.query;
        const startDate = new Date(from);
        const endDate = new Date(to);

        // Aggregate compliance data by state/region
        const [treatmentStats, alertsByRegion, violationTrend] = await Promise.all([
            // Treatment approval statistics
            Treatment.aggregate([
                { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),

            // Compliance alerts grouped by region
            ComplianceAlert.aggregate([
                { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
                {
                    $lookup: {
                        from: 'farmers',
                        localField: 'farmerId',
                        foreignField: '_id',
                        as: 'farmInfo'
                    }
                },
                { $unwind: { path: '$farmInfo', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: { $ifNull: ['$farmInfo.location.state', 'Unknown'] },
                        violations: { $sum: 1 }
                    }
                },
                { $sort: { violations: -1 } }
            ]),

            // Violation trend over time
            ComplianceAlert.aggregate([
                { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ])
        ]);

        // Process treatment stats
        const stats = { approved: 0, pending: 0, rejected: 0 };
        treatmentStats.forEach(stat => {
            if (stat._id) {
                const key = stat._id.toLowerCase();
                if (stats.hasOwnProperty(key)) {
                    stats[key] = stat.count;
                }
            }
        });

        const total = stats.approved + stats.pending + stats.rejected;
        const complianceRate = total > 0 ? ((stats.approved / total) * 100).toFixed(1) : 100;

        // Get total farms for compliance calculation
        const totalFarms = await Farmer.countDocuments();
        const farmsWithViolations = await ComplianceAlert.distinct('farmerId', {
            createdAt: { $gte: startDate, $lte: endDate }
        });

        // Format data for charts
        const regionData = alertsByRegion.map(item => ({
            name: item._id,
            violations: item.count || item.violations,
            compliant: Math.max(0, Math.floor(totalFarms / 5) - item.violations) // Estimated
        }));

        const trendData = violationTrend.map(item => ({
            name: format(new Date(item._id.year, item._id.month - 1), 'MMM yyyy'),
            violations: item.count
        }));

        res.json({
            reportType: 'Compliance',
            data: regionData.slice(0, 10), // Top 10 regions
            summary: {
                totalTreatments: total,
                approvedTreatments: stats.approved,
                pendingTreatments: stats.pending,
                rejectedTreatments: stats.rejected,
                complianceRate: parseFloat(complianceRate),
                totalViolations: alertsByRegion.reduce((sum, item) => sum + (item.violations || 0), 0),
                farmsWithViolations: farmsWithViolations.length,
                totalFarms
            },
            trend: trendData,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getComplianceReportData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get AMU Trends Report Data
// @route   GET /api/regulator/reports/amu-trends-data
// @access  Private (Regulator)
export const getAmuTrendsReportData = async (req, res) => {
    try {
        const { from, to } = req.query;
        const startDate = new Date(from);
        const endDate = new Date(to);

        const [monthlyTrend, drugBreakdown, speciesBreakdown, totalStats] = await Promise.all([
            // Monthly AMU trend
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
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
                { $match: { status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$drugName', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),

            // Usage by species
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
                {
                    $lookup: {
                        from: 'animals',
                        localField: 'animalId',
                        foreignField: 'tagId',
                        as: 'animalInfo'
                    }
                },
                { $unwind: { path: '$animalInfo', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: { $ifNull: ['$animalInfo.species', 'Unknown'] },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]),

            // Overall statistics
            Promise.all([
                Treatment.countDocuments({ status: 'Approved', startDate: { $gte: startDate, $lte: endDate } }),
                Treatment.distinct('drugName', { status: 'Approved', startDate: { $gte: startDate, $lte: endDate } }),
                Treatment.distinct('farmerId', { status: 'Approved', startDate: { $gte: startDate, $lte: endDate } })
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

        // Format species breakdown
        const speciesData = speciesBreakdown.map(item => ({
            name: item._id,
            value: item.count
        }));

        res.json({
            reportType: 'AmuTrends',
            data: trendData,
            drugBreakdown: drugData,
            speciesBreakdown: speciesData,
            summary: {
                totalTreatments: totalStats[0],
                uniqueDrugs: totalStats[1].length,
                farmsInvolved: totalStats[2].length,
                averagePerMonth: trendData.length > 0
                    ? Math.round(totalStats[0] / trendData.length)
                    : 0
            },
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getAmuTrendsReportData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get WHO AWaRe Report Data
// @route   GET /api/regulator/reports/who-aware-data
// @access  Private (Regulator)
export const getWhoAwareReportData = async (req, res) => {
    try {
        const { from, to } = req.query;
        const startDate = new Date(from);
        const endDate = new Date(to);

        const [classBreakdown, monthlyTrend] = await Promise.all([
            // Drug class distribution
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$drugClass', count: { $sum: 1 } } }
            ]),

            // Monthly trend by drug class
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$startDate' },
                            month: { $month: '$startDate' },
                            drugClass: '$drugClass'
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ])
        ]);

        // Process class breakdown
        const classStats = { Access: 0, Watch: 0, Reserve: 0, Unclassified: 0 };
        classBreakdown.forEach(item => {
            const className = item._id || 'Unclassified';
            if (classStats.hasOwnProperty(className)) {
                classStats[className] = item.count;
            } else {
                classStats.Unclassified += item.count;
            }
        });

        const total = Object.values(classStats).reduce((sum, val) => sum + val, 0);

        // Format for pie chart
        const pieData = Object.entries(classStats)
            .filter(([key, value]) => value > 0)
            .map(([key, value]) => ({
                name: key,
                value: value
            }));

        // Calculate percentages
        const percentages = {};
        Object.entries(classStats).forEach(([key, value]) => {
            percentages[key] = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
        });

        res.json({
            reportType: 'WhoAware',
            data: pieData,
            summary: {
                totalTreatments: total,
                accessCount: classStats.Access,
                watchCount: classStats.Watch,
                reserveCount: classStats.Reserve,
                unclassifiedCount: classStats.Unclassified,
                accessPercent: parseFloat(percentages.Access),
                watchPercent: parseFloat(percentages.Watch),
                reservePercent: parseFloat(percentages.Reserve),
                complianceScore: total > 0
                    ? parseFloat((((classStats.Access + classStats.Watch * 0.5) / total) * 100).toFixed(1))
                    : 100
            },
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getWhoAwareReportData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get Veterinarian Oversight Report Data
// @route   GET /api/regulator/reports/vet-oversight-data
// @access  Private (Regulator)
export const getVetOversightReportData = async (req, res) => {
    try {
        const { from, to } = req.query;
        const startDate = new Date(from);
        const endDate = new Date(to);

        const [vetPerformance, feedAdminStats] = await Promise.all([
            // Veterinarian treatment activity
            Treatment.aggregate([
                { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
                {
                    $group: {
                        _id: '$vetId',
                        approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
                        rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
                        pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
                        total: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'veterinarians',
                        localField: '_id',
                        foreignField: 'licenseNumber',
                        as: 'vetInfo'
                    }
                },
                { $unwind: { path: '$vetInfo', preserveNullAndEmptyArrays: true } },
                { $sort: { total: -1 } },
                { $limit: 20 }
            ]),

            // Feed administration oversight
            FeedAdministration.aggregate([
                { $match: { administrationDate: { $gte: startDate, $lte: endDate } } },
                {
                    $group: {
                        _id: '$prescribedByVet',
                        feedPrescriptions: { $sum: 1 },
                        animalsAffected: { $sum: '$numberOfAnimals' }
                    }
                },
                {
                    $lookup: {
                        from: 'veterinarians',
                        localField: '_id',
                        foreignField: 'licenseNumber',
                        as: 'vetInfo'
                    }
                },
                { $unwind: { path: '$vetInfo', preserveNullAndEmptyArrays: true } }
            ])
        ]);

        // Merge treatment and feed data
        const vetMap = new Map();

        vetPerformance.forEach(vet => {
            const vetId = vet._id;
            vetMap.set(vetId, {
                name: vet.vetInfo?.fullName || `Vet ${vetId}`,
                visits: vet.total,
                prescriptions: vet.approved,
                rejected: vet.rejected,
                pending: vet.pending,
                approvalRate: vet.total > 0 ? ((vet.approved / vet.total) * 100).toFixed(1) : 0,
                feedPrescriptions: 0
            });
        });

        feedAdminStats.forEach(feed => {
            if (vetMap.has(feed._id)) {
                vetMap.get(feed._id).feedPrescriptions = feed.feedPrescriptions;
            }
        });

        const vetData = Array.from(vetMap.values());

        // Calculate totals
        const totals = vetData.reduce((acc, vet) => ({
            totalVisits: acc.totalVisits + vet.visits,
            totalPrescriptions: acc.totalPrescriptions + vet.prescriptions,
            totalRejected: acc.totalRejected + vet.rejected
        }), { totalVisits: 0, totalPrescriptions: 0, totalRejected: 0 });

        res.json({
            reportType: 'VetOversight',
            data: vetData,
            summary: {
                totalVets: vetData.length,
                totalVisits: totals.totalVisits,
                totalPrescriptions: totals.totalPrescriptions,
                totalRejected: totals.totalRejected,
                averageApprovalRate: vetData.length > 0
                    ? (vetData.reduce((sum, vet) => sum + parseFloat(vet.approvalRate), 0) / vetData.length).toFixed(1)
                    : 0
            },
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getVetOversightReportData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get Farm Risk Profile Report Data
// @route   GET /api/regulator/reports/farm-risk-data
// @access  Private (Regulator)
export const getFarmRiskReportData = async (req, res) => {
    try {
        const { from, to } = req.query;
        const startDate = new Date(from);
        const endDate = new Date(to);

        const [highAmuFarms, alertsByFarm, mrlViolations, allFarms] = await Promise.all([
            // High AMU farms
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$farmerId', treatmentCount: { $sum: 1 } } },
                {
                    $lookup: {
                        from: 'farmers',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'farmInfo'
                    }
                },
                { $unwind: '$farmInfo' },
                { $sort: { treatmentCount: -1 } }
            ]),

            // Compliance alerts by farm
            ComplianceAlert.aggregate([
                { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$farmerId', alertCount: { $sum: 1 } } }
            ]),

            // MRL violations
            Animal.aggregate([
                { $match: { mrlStatus: 'VIOLATION' } },
                { $group: { _id: '$farmerId', violationCount: { $sum: 1 } } }
            ]),

            Farmer.countDocuments()
        ]);

        // Create risk profile for each farm
        const farmRiskMap = new Map();

        highAmuFarms.forEach(farm => {
            const farmId = farm._id.toString();
            farmRiskMap.set(farmId, {
                farmName: farm.farmInfo.farmName,
                treatmentCount: farm.treatmentCount,
                alertCount: 0,
                violationCount: 0,
                riskScore: 0,
                riskLevel: 'Low'
            });
        });

        alertsByFarm.forEach(alert => {
            const farmId = alert._id.toString();
            if (farmRiskMap.has(farmId)) {
                farmRiskMap.get(farmId).alertCount = alert.alertCount;
            }
        });

        mrlViolations.forEach(violation => {
            const farmId = violation._id.toString();
            if (farmRiskMap.has(farmId)) {
                farmRiskMap.get(farmId).violationCount = violation.violationCount;
            }
        });

        // Calculate risk scores and levels
        farmRiskMap.forEach((farm, farmId) => {
            const riskScore = (farm.treatmentCount * 0.3) + (farm.alertCount * 5) + (farm.violationCount * 10);
            farm.riskScore = Math.round(riskScore);

            if (farm.violationCount > 0 || farm.alertCount >= 3) {
                farm.riskLevel = 'High';
            } else if (farm.treatmentCount > 20 || farm.alertCount > 0) {
                farm.riskLevel = 'Medium';
            } else {
                farm.riskLevel = 'Low';
            }
        });

        const farmRiskData = Array.from(farmRiskMap.values())
            .sort((a, b) => b.riskScore - a.riskScore)
            .slice(0, 30); // Top 30 farms by risk

        // Calculate distribution
        const riskDistribution = {
            'Low Risk': farmRiskData.filter(f => f.riskLevel === 'Low').length,
            'Medium Risk': farmRiskData.filter(f => f.riskLevel === 'Medium').length,
            'High Risk': farmRiskData.filter(f => f.riskLevel === 'High').length
        };

        const pieData = Object.entries(riskDistribution)
            .filter(([key, value]) => value > 0)
            .map(([key, value]) => ({
                name: key,
                value: value
            }));

        res.json({
            reportType: 'FarmRisk',
            data: farmRiskData,
            distribution: pieData,
            summary: {
                totalFarms: allFarms,
                farmsAnalyzed: farmRiskData.length,
                highRiskFarms: riskDistribution['High Risk'],
                mediumRiskFarms: riskDistribution['Medium Risk'],
                lowRiskFarms: riskDistribution['Low Risk'],
                farmsWithViolations: farmRiskData.filter(f => f.violationCount > 0).length
            },
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getFarmRiskReportData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get Feed vs Therapeutic Report Data
// @route   GET /api/regulator/reports/feed-vs-therapeutic-data
// @access  Private (Regulator)
export const getFeedVsTherapeuticReportData = async (req, res) => {
    try {
        const { from, to } = req.query;
        const startDate = new Date(from);
        const endDate = new Date(to);

        const [therapeuticData, feedData, monthlyComparison] = await Promise.all([
            // Therapeutic treatments
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        uniqueDrugs: { $addToSet: '$drugName' }
                    }
                }
            ]),

            // Medicated feed
            FeedAdministration.aggregate([
                { $match: { vetApproved: true, administrationDate: { $gte: startDate, $lte: endDate } } },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        totalAnimals: { $sum: '$numberOfAnimals' },
                        uniqueFeeds: { $addToSet: '$feedType' }
                    }
                }
            ]),

            // Monthly comparison
            Promise.all([
                Treatment.aggregate([
                    { $match: { status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
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
                FeedAdministration.aggregate([
                    { $match: { vetApproved: true, administrationDate: { $gte: startDate, $lte: endDate } } },
                    {
                        $group: {
                            _id: {
                                year: { $year: '$administrationDate' },
                                month: { $month: '$administrationDate' }
                            },
                            count: { $sum: '$numberOfAnimals' }
                        }
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1 } }
                ])
            ])
        ]);

        const therapeuticCount = therapeuticData[0]?.count || 0;
        const feedCount = feedData[0]?.totalAnimals || 0;
        const total = therapeuticCount + feedCount;

        // Format pie chart data
        const pieData = [
            { name: 'Therapeutic', value: therapeuticCount },
            { name: 'Feed', value: feedCount }
        ];

        // Merge monthly trends
        const monthMap = new Map();

        monthlyComparison[0].forEach(item => {
            const key = `${item._id.year}-${item._id.month}`;
            monthMap.set(key, {
                name: format(new Date(item._id.year, item._id.month - 1), 'MMM yyyy'),
                therapeutic: item.count,
                feed: 0
            });
        });

        monthlyComparison[1].forEach(item => {
            const key = `${item._id.year}-${item._id.month}`;
            if (monthMap.has(key)) {
                monthMap.get(key).feed = item.count;
            } else {
                monthMap.set(key, {
                    name: format(new Date(item._id.year, item._id.month - 1), 'MMM yyyy'),
                    therapeutic: 0,
                    feed: item.count
                });
            }
        });

        const trendData = Array.from(monthMap.values());

        res.json({
            reportType: 'FeedVsTherapeutic',
            data: pieData,
            trend: trendData,
            summary: {
                totalTreatments: total,
                therapeuticCount: therapeuticCount,
                feedCount: feedCount,
                therapeuticPercent: total > 0 ? ((therapeuticCount / total) * 100).toFixed(1) : 0,
                feedPercent: total > 0 ? ((feedCount / total) * 100).toFixed(1) : 0,
                uniqueDrugs: therapeuticData[0]?.uniqueDrugs?.length || 0,
                uniqueFeeds: feedData[0]?.uniqueFeeds?.length || 0
            },
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getFeedVsTherapeuticReportData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};
