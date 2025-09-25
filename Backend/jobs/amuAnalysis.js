// backend/jobs/amuAnalysis.js

import cron from 'node-cron';
import Farmer from '../models/farmer.model.js';
import Treatment from '../models/treatment.model.js';
import HighAmuAlert from '../models/highAmuAlert.model.js';
import { subDays, subMonths } from 'date-fns';

export const runAmuAnalysis = async () => {
    console.log('Starting daily AMU analysis job...');
    const allFarmers = await Farmer.find().select('_id');

    for (const farmer of allFarmers) {
        const now = new Date();
        const last7Days = subDays(now, 7);
        const last6Months = subMonths(now, 6);

        const currentWeekCount = await Treatment.countDocuments({
            farmerId: farmer._id,
            status: 'Approved',
            createdAt: { $gte: last7Days }
        });
        
        const historicalCount = await Treatment.countDocuments({
            farmerId: farmer._id,
            status: 'Approved',
            createdAt: { $gte: last6Months, $lt: last7Days }
        });
        const historicalWeeklyAverage = historicalCount / 25;

        const threshold = 2.0;
        if (currentWeekCount > 3 && currentWeekCount > historicalWeeklyAverage * threshold) {
            
            // NEW: Check if an 'Open' alert for this farmer already exists before creating a new one.
            const existingAlert = await HighAmuAlert.findOne({
                farmerId: farmer._id,
                status: 'New',
                alertType: 'HISTORICAL_SPIKE'
            });

            // Only create a new alert if one doesn't already exist
            if (!existingAlert) {
                const message = `Farm has a ${Math.round((currentWeekCount / (historicalWeeklyAverage || 0.1)) * 100)}% spike in AMU this week.`;
                
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
                console.log(`New High AMU alert generated for farmer ${farmer._id}`);
            } else {
                console.log(`High AMU alert for farmer ${farmer._id} already exists. Skipping.`);
            }
        }
    }
    console.log('Daily AMU analysis job finished.');
};

export const startAmuAnalysisJob = () => {
    cron.schedule('0 2 * * *', runAmuAnalysis);
    console.log('✅ AMU analysis job has been scheduled to run every night at 2:00 AM.');
};