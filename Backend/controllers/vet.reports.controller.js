// Backend/controllers/vet.reports.controller.js

import Treatment from '../models/treatment.model.js';
import FeedAdministration from '../models/feedAdministration.model.js';
import Farmer from '../models/farmer.model.js';
import Animal from '../models/animal.model.js';
import ComplianceAlert from '../models/complianceAlert.model.js';
import { subMonths, format } from 'date-fns';

// @desc    Get Vet Practice Overview Data
// @route   GET /api/reports/vet/practice-overview-data
// @access  Private (Vet)
export const getVetPracticeOverviewData = async (req, res) => {
    try {
        const { from, to } = req.query;
        const vetId = req.user.vetId;
        const startDate = new Date(from);
        const endDate = new Date(to);

        // Get all supervised farms first
        const supervisedFarms = await Farmer.find({ vetId }).select('_id farmName farmOwner').lean();
        const farmIds = supervisedFarms.map(f => f._id);

        const [monthlyActivity, overallStats] = await Promise.all([
            // Monthly prescription activity
            Treatment.aggregate([
                {
                    $match: {
                        farmerId: { $in: farmIds },
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
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
            ]),

            // Overall statistics
            Promise.all([
                Treatment.countDocuments({ farmerId: { $in: farmIds }, createdAt: { $gte: startDate, $lte: endDate } }),
                Treatment.countDocuments({ farmerId: { $in: farmIds }, status: 'Approved', createdAt: { $gte: startDate, $lte: endDate } }),
                Treatment.countDocuments({ farmerId: { $in: farmIds }, status: 'Rejected', createdAt: { $gte: startDate, $lte: endDate } }),
                FeedAdministration.countDocuments({ prescribedByVet: vetId, vetApproved: true, administrationDate: { $gte: startDate, $lte: endDate } })
            ])
        ]);

        // Format monthly activity
        const activityData = monthlyActivity.map(item => ({
            name: format(new Date(item._id.year, item._id.month - 1), 'MMM yyyy'),
            prescriptions: item.count
        }));

        const totalPrescriptions = overallStats[0];
        const approvedCount = overallStats[1];
        const rejectedCount = overallStats[2];
        const feedPrescriptions = overallStats[3];

        res.json({
            reportType: 'PracticeOverview',
            data: activityData,
            summary: {
                supervisedFarms: supervisedFarms.length,
                totalPrescriptions,
                approvedPrescriptions: approvedCount,
                rejectedPrescriptions: rejectedCount,
                feedPrescriptions,
                approvalRate: totalPrescriptions > 0 ? ((approvedCount / totalPrescriptions) * 100).toFixed(1) : 100
            },
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getVetPracticeOverviewData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get Vet Prescription Analytics Data
// @route   GET /api/reports/vet/prescription-analytics-data
// @access  Private (Vet)
export const getVetPrescriptionAnalyticsData = async (req, res) => {
    try {
        const { from, to } = req.query;
        const vetId = req.user.vetId;
        const startDate = new Date(from);
        const endDate = new Date(to);

        // Get all supervised farms first
        const supervisedFarms = await Farmer.find({ vetId }).select('_id').lean();
        const farmIds = supervisedFarms.map(f => f._id);

        const [topDrugs, speciesBreakdown, drugClassBreakdown] = await Promise.all([
            // Top drugs prescribed
            Treatment.aggregate([
                { $match: { farmerId: { $in: farmIds }, status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$drugName', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),

            // Prescriptions by species
            Treatment.aggregate([
                { $match: { farmerId: { $in: farmIds }, status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
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

            // Drug class distribution (WHO AWaRe)
            Treatment.aggregate([
                { $match: { farmerId: { $in: farmIds }, status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$drugClass', count: { $sum: 1 } } }
            ])
        ]);

        // Format drug data
        const drugData = topDrugs.map(item => ({
            name: item._id,
            count: item.count
        }));

        // Format species data
        const speciesData = speciesBreakdown.map(item => ({
            name: item._id,
            value: item.count
        }));

        // Process drug class
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
            reportType: 'PrescriptionAnalytics',
            data: drugData,
            speciesBreakdown: speciesData,
            drugClassBreakdown: classData,
            summary: {
                totalPrescriptions: drugData.reduce((sum, d) => sum + d.count, 0),
                uniqueDrugs: drugData.length,
                speciesTreated: speciesData.length,
                accessCount: classStats.Access,
                watchCount: classStats.Watch,
                reserveCount: classStats.Reserve
            },
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getVetPrescriptionAnalyticsData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get Vet Farm Supervision Data
// @route   GET /api/reports/vet/farm-supervision-data
// @access  Private (Vet)
export const getVetFarmSupervisionData = async (req, res) => {
    try {
        const { from, to } = req.query;
        const vetId = req.user.vetId;
        const startDate = new Date(from);
        const endDate = new Date(to);

        // Get all supervised farms
        const farms = await Farmer.find({ vetId }).select('_id farmName farmOwner').lean();
        const farmIds = farms.map(f => f._id);

        const [treatmentsByFarm, alertsByFarm, animalCounts] = await Promise.all([
            // Treatments per farm
            Treatment.aggregate([
                {
                    $match: {
                        farmerId: { $in: farmIds },
                        status: 'Approved',
                        startDate: { $gte: startDate, $lte: endDate }
                    }
                },
                { $group: { _id: '$farmerId', count: { $sum: 1 } } }
            ]),

            // Alerts per farm
            ComplianceAlert.aggregate([
                {
                    $match: {
                        farmerId: { $in: farmIds },
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                { $group: { _id: '$farmerId', count: { $sum: 1 } } }
            ]),

            // Active animals per farm
            Animal.aggregate([
                { $match: { farmerId: { $in: farmIds }, status: 'Active' } },
                { $group: { _id: '$farmerId', count: { $sum: 1 } } }
            ])
        ]);

        // Combine data for each farm
        const farmData = farms.map(farm => {
            const farmIdStr = farm._id.toString();
            const treatments = treatmentsByFarm.find(t => t._id.toString() === farmIdStr)?.count || 0;
            const alerts = alertsByFarm.find(a => a._id.toString() === farmIdStr)?.count || 0;
            const animals = animalCounts.find(a => a._id.toString() === farmIdStr)?.count || 0;

            return {
                farmName: farm.farmName,
                farmOwner: farm.farmOwner,
                treatments,
                alerts,
                animals,
                amuIntensity: animals > 0 ? (treatments / animals).toFixed(2) : 0
            };
        }).sort((a, b) => b.treatments - a.treatments);

        res.json({
            reportType: 'FarmSupervision',
            data: farmData,
            summary: {
                totalFarms: farms.length,
                totalTreatments: farmData.reduce((sum, f) => sum + f.treatments, 0),
                totalAlerts: farmData.reduce((sum, f) => sum + f.alerts, 0),
                totalAnimals: farmData.reduce((sum, f) => sum + f.animals, 0),
                farmsWithAlerts: farmData.filter(f => f.alerts > 0).length
            },
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getVetFarmSupervisionData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get Vet Monthly Activity Summary Data
// @route   GET /api/reports/vet/monthly-activity-data
// @access  Private (Vet)
export const getVetMonthlyActivityData = async (req, res) => {
    try {
        const { from, to } = req.query;
        const vetId = req.user.vetId;
        const startDate = new Date(from);
        const endDate = new Date(to);

        // Get all supervised farms first
        const supervisedFarms = await Farmer.find({ vetId }).select('_id farmName').lean();
        const farmIds = supervisedFarms.map(f => f._id);

        const [monthlyTreatments, monthlyFeed, statusBreakdown] = await Promise.all([
            // Monthly treatment activity
            Treatment.aggregate([
                { $match: { farmerId: { $in: farmIds }, createdAt: { $gte: startDate, $lte: endDate } } },
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
            ]),

            // Monthly feed prescriptions
            FeedAdministration.aggregate([
                { $match: { prescribedByVet: vetId, administrationDate: { $gte: startDate, $lte: endDate } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$administrationDate' },
                            month: { $month: '$administrationDate' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),

            // Overall status breakdown
            Treatment.aggregate([
                { $match: { farmerId: { $in: farmIds }, createdAt: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ])
        ]);

        // Combine monthly data
        const monthlyMap = new Map();

        monthlyTreatments.forEach(item => {
            const key = `${item._id.year}-${item._id.month}`;
            const monthName = format(new Date(item._id.year, item._id.month - 1), 'MMM yyyy');
            if (!monthlyMap.has(key)) {
                monthlyMap.set(key, { name: monthName, treatments: 0, feedPrescriptions: 0 });
            }
            monthlyMap.get(key).treatments = item.count;
        });

        monthlyFeed.forEach(item => {
            const key = `${item._id.year}-${item._id.month}`;
            const monthName = format(new Date(item._id.year, item._id.month - 1), 'MMM yyyy');
            if (!monthlyMap.has(key)) {
                monthlyMap.set(key, { name: monthName, treatments: 0, feedPrescriptions: 0 });
            }
            monthlyMap.get(key).feedPrescriptions = item.count;
        });

        const activityData = Array.from(monthlyMap.values());

        // Process status breakdown
        const stats = { approved: 0, pending: 0, rejected: 0 };
        statusBreakdown.forEach(item => {
            const key = item._id?.toLowerCase();
            if (stats.hasOwnProperty(key)) {
                stats[key] = item.count;
            }
        });

        const total = stats.approved + stats.pending + stats.rejected;

        res.json({
            reportType: 'MonthlyActivity',
            data: activityData,
            summary: {
                supervisedFarms: supervisedFarms.length,
                totalReviews: total,
                approved: stats.approved,
                pending: stats.pending,
                rejected: stats.rejected,
                approvalRate: total > 0 ? ((stats.approved / total) * 100).toFixed(1) : 0,
                totalMonths: activityData.length
            },
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getVetMonthlyActivityData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get Vet WHO AWaRe Stewardship Data
// @route   GET /api/reports/vet/who-aware-stewardship-data
// @access  Private (Vet)
export const getVetWhoAwareStewardshipData = async (req, res) => {
    try {
        const { from, to } = req.query;
        const vetId = req.user.vetId;
        const startDate = new Date(from);
        const endDate = new Date(to);

        // Get all supervised farms first
        const supervisedFarms = await Farmer.find({ vetId }).select('_id').lean();
        const farmIds = supervisedFarms.map(f => f._id);

        const [drugClassData, monthlyClassTrend] = await Promise.all([
            // Drug class distribution
            Treatment.aggregate([
                { $match: { farmerId: { $in: farmIds }, status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$drugClass', count: { $sum: 1 } } }
            ]),

            // Monthly trend by drug class
            Treatment.aggregate([
                { $match: { farmerId: { $in: farmIds }, status: 'Approved', startDate: { $gte: startDate, $lte: endDate } } },
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
        drugClassData.forEach(item => {
            const className = item._id || 'Unclassified';
            if (classStats.hasOwnProperty(className)) {
                classStats[className] = item.count;
            } else {
                classStats.Unclassified += item.count;
            }
        });

        const total = Object.values(classStats).reduce((sum, val) => sum + val, 0);

        const pieData = Object.entries(classStats)
            .filter(([key, value]) => value > 0)
            .map(([key, value]) => ({
                name: key,
                value: value
            }));

        // Process monthly trend
        const trendMap = new Map();
        monthlyClassTrend.forEach(item => {
            const key = `${item._id.year}-${item._id.month}`;
            const monthName = format(new Date(item._id.year, item._id.month - 1), 'MMM');

            if (!trendMap.has(key)) {
                trendMap.set(key, { name: monthName, Access: 0, Watch: 0, Reserve: 0, Unclassified: 0 });
            }

            const drugClass = item._id.drugClass || 'Unclassified';
            if (trendMap.get(key).hasOwnProperty(drugClass)) {
                trendMap.get(key)[drugClass] = item.count;
            }
        });

        const trendData = Array.from(trendMap.values());

        // Calculate stewardship score (prefer Access, minimize Watch/Reserve)
        const stewardshipScore = total > 0
            ? (((classStats.Access * 1.0 + classStats.Watch * 0.5) / total) * 100).toFixed(1)
            : 100;

        res.json({
            reportType: 'WhoAwareStewardship',
            data: pieData,
            trend: trendData,
            summary: {
                totalPrescriptions: total,
                accessCount: classStats.Access,
                watchCount: classStats.Watch,
                reserveCount: classStats.Reserve,
                unclassifiedCount: classStats.Unclassified,
                accessPercent: total > 0 ? ((classStats.Access / total) * 100).toFixed(1) : 0,
                watchPercent: total > 0 ? ((classStats.Watch / total) * 100).toFixed(1) : 0,
                reservePercent: total > 0 ? ((classStats.Reserve / total) * 100).toFixed(1) : 0,
                stewardshipScore: parseFloat(stewardshipScore)
            },
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getVetWhoAwareStewardshipData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};
