import cron from 'node-cron';
import Farmer from '../models/farmer.model.js';
import Treatment from '../models/treatment.model.js';
import HighAmuAlert from '../models/highAmuAlert.model.js';
import Animal from '../models/animal.model.js'; // Import the Animal model
import { subDays, subMonths } from 'date-fns';

// --- JOB 1: HISTORICAL SPIKE ANALYSIS (runs daily) ---
export const runAmuAnalysis = async () => {
    console.log('Starting daily historical spike analysis...');
    const allFarmers = await Farmer.find().select('_id');

    for (const farmer of allFarmers) {
        const now = new Date();
        const last7Days = subDays(now, 7);
        const last6Months = subMonths(now, 6);

        const currentWeekCount = await Treatment.countDocuments({
            farmerId: farmer._id, status: 'Approved', createdAt: { $gte: last7Days }
        });
        
        const historicalCount = await Treatment.countDocuments({
            farmerId: farmer._id, status: 'Approved', createdAt: { $gte: last6Months, $lt: last7Days }
        });
        const historicalWeeklyAverage = historicalCount / 25;

        const threshold = 2.0;
        if (currentWeekCount > 3 && currentWeekCount > historicalWeeklyAverage * threshold) {
            const existingAlert = await HighAmuAlert.findOne({ farmerId: farmer._id, status: 'New', alertType: 'HISTORICAL_SPIKE' });

            if (!existingAlert) {
                const message = `Farm has a ${Math.round((currentWeekCount / (historicalWeeklyAverage || 0.1)) * 100)}% spike in AMU this week.`;
                await HighAmuAlert.create({
                    farmerId: farmer._id,
                    alertType: 'HISTORICAL_SPIKE',
                    message: message,
                    details: { currentWeekCount, historicalWeeklyAverage: parseFloat(historicalWeeklyAverage.toFixed(2)), threshold: `>${threshold * 100}%` }
                });
                console.log(`New High AMU alert generated for farmer ${farmer._id}`);
            } else {
                console.log(`High AMU alert for farmer ${farmer._id} already exists. Skipping.`);
            }
        }
    }
    console.log('Daily historical spike analysis finished.');
};


// --- JOB 2: PEER GROUP COMPARISON ANALYSIS (runs monthly) ---
export const runPeerComparisonAnalysis = async () => {
    console.log('Starting monthly peer-group AMU analysis...');
    const oneMonthAgo = subMonths(new Date(), 1);

    // 1. Calculate the average AMU for different peer groups in the last month
    const peerGroupAverages = await Farmer.aggregate([
        { $match: { herdSize: { $exists: true }, speciesReared: { $exists: true } } },
        {
            $lookup: { from: 'treatments', localField: '_id', foreignField: 'farmerId', as: 'treatments' }
        },
        {
            $project: {
                speciesReared: 1,
                herdSizeBucket: {
                    $switch: {
                        branches: [
                            { case: { $lte: ['$herdSize', 50] }, then: 'Small' },
                            { case: { $lte: ['$herdSize', 200] }, then: 'Medium' },
                        ],
                        default: 'Large'
                    }
                },
                recentTreatmentCount: { $size: { $filter: { input: '$treatments', as: 't', cond: { $gte: ['$$t.createdAt', oneMonthAgo] } } } }
            }
        },
        {
            $group: {
                _id: { species: '$speciesReared', size: '$herdSizeBucket' },
                totalFarmsInGroup: { $sum: 1 },
                totalTreatmentsInGroup: { $sum: '$recentTreatmentCount' }
            }
        },
        {
            $project: {
                _id: 1,
                averageUsage: { $divide: ['$totalTreatmentsInGroup', '$totalFarmsInGroup'] }
            }
        }
    ]);
    
    // Create a simple map for easy lookup
    const averageMap = new Map(peerGroupAverages.map(item => [`${item._id.species}-${item._id.size}`, item.averageUsage]));

    // 2. Now, check each farm against its peer average
    const allFarms = await Farmer.find({ herdSize: { $exists: true }, speciesReared: { $exists: true } });
    for (const farm of allFarms) {
        const recentTreatments = await Treatment.countDocuments({ farmerId: farm._id, createdAt: { $gte: oneMonthAgo } });
        
        const sizeBucket = farm.herdSize <= 50 ? 'Small' : farm.herdSize <= 200 ? 'Medium' : 'Large';
        const peerKey = `${farm.speciesReared}-${sizeBucket}`;
        const peerAverage = averageMap.get(peerKey) || 0;

        // 3. Flag if usage is 50% higher than peers
        if (recentTreatments > 0 && recentTreatments > peerAverage * 1.5) {
             const existingAlert = await HighAmuAlert.findOne({ farmerId: farm._id, status: 'New', alertType: 'PEER_COMPARISON_SPIKE' });

            if (!existingAlert) {
                await HighAmuAlert.create({
                    farmerId: farm._id,
                    alertType: 'PEER_COMPARISON_SPIKE',
                    message: `Farm AMU is ${Math.round((recentTreatments / (peerAverage || 0.1)) * 100)}% higher than similar farms.`,
                    details: {
                        farmMonthlyUsage: recentTreatments,
                        peerMonthlyAverage: parseFloat(peerAverage.toFixed(2)),
                        threshold: '>150%'
                    }
                });
                console.log(`Peer comparison alert for farmer ${farm._id}`);
            }
        }
    }
    console.log('Monthly peer-group AMU analysis finished.');
};


// --- SCHEDULER ---
export const startAmuAnalysisJob = () => {
    // Runs the historical spike check every night at 2 AM
    cron.schedule('0 2 * * *', runAmuAnalysis);
    
    // Runs the more intensive peer comparison check on the 1st of every month at 3 AM
    cron.schedule('0 3 1 * *', runPeerComparisonAnalysis);

    console.log('✅ AMU analysis jobs have been scheduled.');
};