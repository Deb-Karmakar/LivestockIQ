// backend/controllers/regulator.controller.js

import Farmer from '../models/farmer.model.js';
import Veterinarian from '../models/vet.model.js';
import Treatment from '../models/treatment.model.js';
import { subMonths, format } from 'date-fns';

export const getDashboardStats = async (req, res) => {
    try {
        const sixMonthsAgo = subMonths(new Date(), 6);

        // Run all database queries concurrently for better performance
        const [
            farmCount,
            vetCount,
            complianceStatsRaw,
            amuTrendRaw,
            farmLocations
        ] = await Promise.all([
            Farmer.countDocuments(),
            Veterinarian.countDocuments(),
            // 1. Aggregate compliance stats
            Treatment.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            // 2. Aggregate AMU trend for the last 6 months
            Treatment.aggregate([
                { $match: { status: 'Approved', startDate: { $gte: sixMonthsAgo } } },
                { 
                    $group: { 
                        _id: { month: { $month: '$startDate' }, year: { $year: '$startDate' } }, 
                        count: { $sum: 1 } 
                    } 
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            // 3. Fetch farm locations for the heatmap
            Farmer.find({ 'location.latitude': { $exists: true, $ne: null } }).select('location')
        ]);

        // --- Process the raw data for the frontend ---

        // Process compliance stats
        const complianceStats = { approved: 0, pending: 0, rejected: 0 };
        complianceStatsRaw.forEach(stat => {
            const statusKey = stat._id.toLowerCase();
            if (complianceStats.hasOwnProperty(statusKey)) {
                complianceStats[statusKey] = stat.count;
            }
        });

        // Process AMU trend to ensure all 6 months are present
        const amuTrend = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const monthName = format(date, 'MMM');
            const monthNum = parseInt(format(date, 'M'));
            const yearNum = parseInt(format(date, 'yyyy'));

            const monthData = amuTrendRaw.find(d => d._id.month === monthNum && d._id.year === yearNum);
            amuTrend.push({
                name: monthName,
                treatments: monthData ? monthData.count : 0,
            });
        }

        // Process farm locations into the format needed for the heatmap
        const heatmapData = farmLocations.map(farm => 
            [farm.location.latitude, farm.location.longitude, 50] // Using a default intensity of 50 for now
        );

        // --- Send the final response ---
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
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};