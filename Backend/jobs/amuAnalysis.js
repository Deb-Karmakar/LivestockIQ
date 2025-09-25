// backend/jobs/amuAnalysis.js

import cron from 'node-cron';
import Farmer from '../models/farmer.model.js';
import Treatment from '../models/treatment.model.js';
import HighAmuAlert from '../models/highAmuAlert.model.js';
import { subDays, subMonths } from 'date-fns';

// UPDATED: Added 'export' to make this function available for import
export const runAmuAnalysis = async () => {
    console.log('Starting daily AMU analysis job...');
    const allFarmers = await Farmer.find().select('_id');

    for (const farmer of allFarmers) {
        const now = new Date();
        const last7Days = subDays(now, 7);
        const last6Months = subMonths(now, 6);

        // 1. Calculate Recent Usage (last 7 days)
        const currentWeekCount = await Treatment.countDocuments({
            farmerId: farmer._id,
            status: 'Approved',
            createdAt: { $gte: last7Days }
        });
        
        // 2. Calculate Historical Baseline (weekly average over last 6 months)
        const historicalCount = await Treatment.countDocuments({
            farmerId: farmer._id,
            status: 'Approved',
            createdAt: { $gte: last6Months, $lt: last7Days }
        });
        const historicalWeeklyAverage = historicalCount / 25;

        // 3. Compare and Flag (e.g., if current usage is > 200% of the average and at least 3 treatments)
        const threshold = 2.0;
        if (currentWeekCount > 3 && currentWeekCount > historicalWeeklyAverage * threshold) {
            const message = `Farm has a ${Math.round((currentWeekCount / (historicalWeeklyAverage || 0.1)) * 100)}% spike in AMU this week.`;
            
            // Create a new alert in the database
            await HighAmuAlert.create({
                farmerId: farmer._id,
                alertType: 'HISTORICAL_SPIKE',
                message: message,
                details: {
                    currentWeekCount,
                    historicalWeeklyAverage: parseFloat(historicalWeeklyAverage.toFixed(2)),
                    threshold: `>${threshold * 100}%`
                }
            });
            console.log(`High AMU alert generated for farmer ${farmer._id}`);
        }
    }
    console.log('Daily AMU analysis job finished.');
};

// Schedule the job to run once every day at 2:00 AM
export const startAmuAnalysisJob = () => {
    cron.schedule('0 2 * * *', runAmuAnalysis);
};