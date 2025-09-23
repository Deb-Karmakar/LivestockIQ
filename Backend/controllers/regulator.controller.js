// backend/controllers/regulator.controller.js

import Farmer from '../models/farmer.model.js';
import Veterinarian from '../models/vet.model.js';
import Treatment from '../models/treatment.model.js';
import ComplianceAlert from '../models/complianceAlert.model.js';
import Animal from '../models/animal.model.js';
import { subMonths, format, subDays } from 'date-fns';

export const getDashboardStats = async (req, res) => {
    try {
        const sixMonthsAgo = subMonths(new Date(), 6);

        const [
            farmCount, vetCount, complianceStatsRaw, amuTrendRaw, heatmapRawData
        ] = await Promise.all([
            Farmer.countDocuments(),
            Veterinarian.countDocuments(),
            Treatment.aggregate([ { $group: { _id: '$status', count: { $sum: 1 } } } ]),
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: sixMonthsAgo } } },
                { $group: { _id: { month: { $month: '$startDate' }, year: { $year: '$startDate' } }, count: { $sum: 1 } } },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            Treatment.aggregate([
                { $match: { status: 'Approved' } },
                { $group: { _id: '$farmerId', intensity: { $sum: 1 } } },
                { $lookup: { from: 'farmers', localField: '_id', foreignField: '_id', as: 'farmerInfo' } },
                { $unwind: '$farmerInfo' },
                // UPDATED: This now checks for BOTH latitude and longitude
                { 
                    $match: {
                        'farmerInfo.location.latitude': { $exists: true, $ne: null },
                        'farmerInfo.location.longitude': { $exists: true, $ne: null }
                    } 
                },
                {
                    $project: {
                        _id: 0,
                        lat: '$farmerInfo.location.latitude',
                        lng: '$farmerInfo.location.longitude',
                        intensity: '$intensity'
                    }
                }
            ])
        ]);

        // --- Process the raw data for the frontend ---
        const complianceStats = { approved: 0, pending: 0, rejected: 0 };
        complianceStatsRaw.forEach(stat => {
            if (stat._id) {
                const statusKey = stat._id.toLowerCase();
                if (complianceStats.hasOwnProperty(statusKey)) {
                    complianceStats[statusKey] = stat.count;
                }
            }
        });

        const amuTrend = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const monthName = format(date, 'MMM');
            const monthNum = parseInt(format(date, 'M'));
            const yearNum = parseInt(format(date, 'yyyy'));
            const monthData = amuTrendRaw.find(d => d._id.month === monthNum && d._id.year === yearNum);
            amuTrend.push({ name: monthName, treatments: monthData ? monthData.count : 0 });
        }

        const heatmapData = heatmapRawData.map(item => [item.lat, item.lng, item.intensity * 100]);

        res.json({
            overviewStats: {
                totalFarms: farmCount,
                totalVets: vetCount,
                totalTreatments: complianceStats.approved + complianceStats.pending + complianceStats.rejected,
            },
            complianceStats,
            amuTrend,
            heatmapData,
        });

    } catch (error) {
        console.error("Error in getDashboardStats:", error); 
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const getComplianceData = async (req, res) => {
    try {
        const sevenDaysAgo = subDays(new Date(), 7);
        const sixMonthsAgo = subMonths(new Date(), 6);

        const [
            complianceStatsRaw,
            overdueCount,
            flaggedFarms,
            complianceTrendRaw,
            alerts
        ] = await Promise.all([
            // This query already fetches all statuses, including 'Rejected'
            Treatment.aggregate([ { $group: { _id: '$status', count: { $sum: 1 } } } ]),
            Treatment.countDocuments({ status: 'Pending', createdAt: { $lte: sevenDaysAgo } }),
            ComplianceAlert.distinct('farmerId', { status: 'Open' }),
            Treatment.aggregate([
                { $match: { status: 'Pending', createdAt: { $gte: sixMonthsAgo, $lte: new Date() } } },
                { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            ComplianceAlert.find({ status: 'Open' })
                .populate('farmerId', 'farmName')
                .populate('vetId', 'fullName')
                .sort({ createdAt: -1 })
                .limit(10)
        ]);

        // UPDATED: Processing logic now includes the 'Rejected' count
        const complianceStats = { approved: 0, pending: 0, rejected: 0 };
        complianceStatsRaw.forEach(stat => {
            if (stat._id) { // Ensure status is not null
                const statusKey = stat._id.toLowerCase();
                if (complianceStats.hasOwnProperty(statusKey)) {
                    complianceStats[statusKey] = stat.count;
                }
            }
        });
        const totalVerified = complianceStats.approved;
        // UPDATED: The denominator now includes all three statuses
        const total = complianceStats.approved + complianceStats.pending + complianceStats.rejected;
        const complianceRate = total > 0 ? ((totalVerified / total) * 100).toFixed(1) : 100;
        
        const complianceTrend = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const monthData = complianceTrendRaw.find(d => d._id.month === (date.getMonth() + 1) && d._id.year === date.getFullYear());
            complianceTrend.push({
                month: format(date, 'MMM'),
                overdue: monthData ? monthData.count : 0,
            });
        }

        res.json({
            complianceStats: {
                complianceRate: parseFloat(complianceRate),
                pendingVerifications: complianceStats.pending,
                overdueVerifications: overdueCount,
                farmsFlagged: flaggedFarms.length,
            },
            complianceTrend,
            alerts: alerts.map(alert => ({
                id: alert._id,
                farmName: alert.farmerId.farmName,
                vetName: alert.vetId.fullName,
                issue: alert.reason,
                date: alert.createdAt,
                severity: 'High'
            }))
        });

    } catch (error) {
        console.error("Error in getComplianceData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const getTrendAnalysisData = async (req, res) => {
    try {
        const twelveMonthsAgo = subMonths(new Date(), 12);

        // Run both complex queries concurrently
        const [amuByDrugRaw, amuBySpeciesRaw] = await Promise.all([
            // Query 1: Group treatments by drug name and month
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: twelveMonthsAgo } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$startDate' },
                            month: { $month: '$startDate' },
                            drugName: '$drugName'
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            // Query 2: Group treatments by animal species and month
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: twelveMonthsAgo } } },
                {
                    $lookup: {
                        from: 'animals', // The name of the Animal collection
                        localField: 'animalId',
                        foreignField: 'tagId',
                        as: 'animalInfo'
                    }
                },
                { $unwind: '$animalInfo' },
                {
                    $group: {
                        _id: {
                            year: { $year: '$startDate' },
                            month: { $month: '$startDate' },
                            species: '$animalInfo.species'
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ])
        ]);

        // Helper function to process and pivot the aggregated data for charts
        const processDataForChart = (rawData, categoryField) => {
            const dataMap = new Map();
            const categories = new Set();

            rawData.forEach(item => {
                const monthName = format(new Date(item._id.year, item._id.month - 1), 'MMM yyyy');
                const category = item._id[categoryField];
                categories.add(category);

                if (!dataMap.has(monthName)) {
                    dataMap.set(monthName, { name: format(new Date(item._id.year, item._id.month - 1), 'MMM') });
                }
                dataMap.get(monthName)[category] = item.count;
            });
            return { data: Array.from(dataMap.values()), keys: Array.from(categories) };
        };

        const amuByDrug = processDataForChart(amuByDrugRaw, 'drugName');
        const amuBySpecies = processDataForChart(amuBySpeciesRaw, 'species');

        res.json({ amuByDrug, amuBySpecies });

    } catch (error) {
        console.error("Error in getTrendAnalysisData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const getDemographicsData = async (req, res) => {
    try {
        // UPDATED: Added speciesGenderRaw to the Promise.all call
        const [
            herdCompositionRaw, 
            ageDistributionRaw,
            speciesGenderRaw // NEW: Query for the new table
        ] = await Promise.all([
            // Query 1: Group animals by species (unchanged)
            Animal.aggregate([
                { $group: { _id: '$species', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            // Query 2: Group animals into age buckets (unchanged)
            Animal.aggregate([
                { $project: { age: { $divide: [ { $subtract: [new Date(), '$dob'] }, (365 * 24 * 60 * 60 * 1000) ] } } },
                { $bucket: { groupBy: "$age", boundaries: [0, 1, 3, 5, 10, Infinity], default: "Unknown", output: { "count": { $sum: 1 } } } }
            ]),
            // NEW: Query 3: Group animals by both species and gender
            Animal.aggregate([
                { $match: { species: { $ne: null }, gender: { $ne: null } } },
                { $group: { _id: { species: '$species', gender: '$gender' }, count: { $sum: 1 } } }
            ])
        ]);

        // Process herd composition for the pie chart (unchanged)
        const herdComposition = herdCompositionRaw.map(item => ({
            name: item._id,
            value: item.count
        }));
        
        // Process age distribution for the bar chart (unchanged)
        const ageLabels = ['0-1 Years', '1-3 Years', '3-5 Years', '5-10 Years', '10+ Years'];
        const ageDistribution = ageDistributionRaw.map((bucket, index) => ({
            name: ageLabels[index] || 'Unknown',
            count: bucket.count
        }));

        // NEW: Process the raw gender data into the table format
        const speciesGenderMap = {};
        speciesGenderRaw.forEach(item => {
            const { species, gender } = item._id;
            const count = item.count;

            if (!speciesGenderMap[species]) {
                speciesGenderMap[species] = { species: species, total: 0, Male: 0, Female: 0 };
            }
            
            speciesGenderMap[species].total += count;
            // Ensure we only count recognized genders to avoid extra columns
            if (gender === 'Male' || gender === 'Female') {
                speciesGenderMap[species][gender] += count;
            }
        });
        const speciesGenderBreakdown = Object.values(speciesGenderMap).sort((a, b) => b.total - a.total);

        // UPDATED: Add the new data to the response
        res.json({ herdComposition, ageDistribution, speciesGenderBreakdown });

    } catch (error) {
        console.error("Error in getDemographicsData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};