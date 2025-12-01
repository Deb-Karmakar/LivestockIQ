// New Enhanced Trends Controller - Backend/controllers/trendsEnhanced.controller.js
// This replaces getTrendAnalysisData with comprehensive features

import Farmer from '../models/farmer.model.js';
import Treatment from '../models/treatment.model.js';
import HighAmuAlert from '../models/highAmuAlert.model.js';
import { subMonths, format, subDays } from 'date-fns';

export const getTrendAnalysisDataEnhanced = async (req, res) => {
    try {
        // Support time period filtering
        const { period = '12m' } = req.query;
        let startDate;

        switch (period) {
            case '30d': startDate = subDays(new Date(), 30); break;
            case '3m': startDate = subMonths(new Date(), 3); break;
            case '6m': startDate = subMonths(new Date(), 6); break;
            case '1y':
            case '12m':
            default: startDate = subMonths(new Date(), 12); break;
        }

        // Dynamically import FeedAdministration to avoid circular dependency
        const FeedAdministration = (await import('../models/feedAdministration.model.js')).default;

        // Run all queries concurrently for performance
        const [
            amuByDrugRaw, amuBySpeciesRaw, treatmentsByMonthRaw, feedByMonthRaw,
            topDrugsRaw, totalTreatments, totalFeedAdministrations, uniqueDrugs,
            farmCount, highAmuAlertsCount, treatmentsByFarmRaw
        ] = await Promise.all([
            // AMU by Drug
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: startDate } } },
                { $group: { _id: { year: { $year: '$startDate' }, month: { $month: '$startDate' }, drugName: '$drugName' }, count: { $sum: 1 } } },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),

            // AMU by Species
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: startDate } } },
                { $lookup: { from: 'animals', localField: 'animalId', foreignField: 'tagId', as: 'animalInfo' } },
                { $unwind: '$animalInfo' },
                { $group: { _id: { year: { $year: '$startDate' }, month: { $month: '$startDate' }, species: '$animalInfo.species' }, count: { $sum: 1 } } },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),

            // Treatments by month
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: startDate } } },
                { $group: { _id: { year: { $year: '$startDate' }, month: { $month: '$startDate' } }, count: { $sum: 1 } } },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),

            // Feed by month
            FeedAdministration.aggregate([
                { $match: { status: { $in: ['Active', 'Completed'] }, startDate: { $gte: startDate } } },
                { $group: { _id: { year: { $year: '$startDate' }, month: { $month: '$startDate' } }, count: { $sum: 1 } } },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),

            // Top drugs
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: startDate } } },
                { $group: { _id: '$drugName', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),

            Treatment.countDocuments({ status: 'Approved', startDate: { $gte: startDate } }),
            FeedAdministration.countDocuments({ status: { $in: ['Active', 'Completed'] }, startDate: { $gte: startDate } }),
            Treatment.distinct('drugName', { status: 'Approved', startDate: { $gte: startDate } }),
            Farmer.countDocuments(),
            HighAmuAlert.countDocuments({ status: 'New', createdAt: { $gte: startDate } }),

            // High AMU farms
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: startDate } } },
                { $group: { _id: '$farmerId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
                { $lookup: { from: 'farmers', localField: '_id', foreignField: '_id', as: 'farmInfo' } },
                { $unwind: '$farmInfo' }
            ])
        ]);

        // Process chart data helper
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

        // Process treatment vs feed data
        const amuByMethodMap = new Map();
        treatmentsByMonthRaw.forEach(item => {
            const monthKey = `${item._id.year}-${item._id.month}`;
            if (!amuByMethodMap.has(monthKey)) {
                amuByMethodMap.set(monthKey, {
                    name: format(new Date(item._id.year, item._id.month - 1), 'MMM'),
                    year: item._id.year, month: item._id.month, treatment: 0, feed: 0
                });
            }
            amuByMethodMap.get(monthKey).treatment = item.count;
        });
        feedByMonthRaw.forEach(item => {
            const monthKey = `${item._id.year}-${item._id.month}`;
            if (!amuByMethodMap.has(monthKey)) {
                amuByMethodMap.set(monthKey, {
                    name: format(new Date(item._id.year, item._id.month - 1), 'MMM'),
                    year: item._id.year, month: item._id.month, treatment: 0, feed: 0
                });
            }
            amuByMethodMap.get(monthKey).feed = item.count;
        });
        const amuByMethod = {
            data: Array.from(amuByMethodMap.values()).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
        };

        // Process top drugs with WHO risk levels
        const whoCIA = ['Colistin', 'Fluoroquinolones', 'Enrofloxacin', 'Ciprofloxacin',
            '3rd Generation Cephalosporins', 'Ceftriaxone', 'Macrolides'];
        const totalAMU = totalTreatments + totalFeedAdministrations;
        const topDrugs = topDrugsRaw.map((drug, index) => {
            const drugName = drug._id;
            const isHighRisk = whoCIA.some(cia => drugName.toLowerCase().includes(cia.toLowerCase()));
            const percentage = totalAMU > 0 ? ((drug.count / totalAMU) * 100).toFixed(1) : 0;
            return {
                rank: index + 1, name: drugName, count: drug.count, percentage: parseFloat(percentage),
                riskLevel: isHighRisk ? 'high' : (index < 3 ? 'medium' : 'low'), trend: 'stable'
            };
        });

        // Process high AMU farms
        const avgTreatmentsPerFarm = farmCount > 0 ? totalAMU / farmCount : 0;
        const highAmuFarms = treatmentsByFarmRaw
            .map(farm => {
                const score = avgTreatmentsPerFarm > 0 ? Math.round((farm.count / avgTreatmentsPerFarm) * 100) : 0;
                return {
                    id: farm._id, name: farm.farmInfo.farmName, owner: farm.farmInfo.farmOwner,
                    treatments: farm.count, percentileRank: Math.min(score, 999),
                    status: score > 200 ? 'critical' : score > 150 ? 'high' : 'elevated'
                };
            })
            .filter(farm => farm.percentileRank > 120);

        // Summary statistics
        const summary = {
            totalTreatments: totalAMU, treatmentOnly: totalTreatments, feedOnly: totalFeedAdministrations,
            uniqueDrugs: uniqueDrugs.length, avgTreatmentsPerFarm: parseFloat(avgTreatmentsPerFarm.toFixed(1)),
            alertsTriggered: highAmuAlertsCount, period: period
        };

        res.json({ summary, amuByDrug, amuBySpecies, amuByMethod, topDrugs, highAmuFarms });

    } catch (error) {
        console.error("Error in getTrendAnalysisDataEnhanced:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};
