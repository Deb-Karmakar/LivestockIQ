// backend/controllers/regulator.controller.js

import Farmer from '../models/farmer.model.js';
import Veterinarian from '../models/vet.model.js';
import Treatment from '../models/treatment.model.js';
import { subMonths, format } from 'date-fns';

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