import cron from 'node-cron';
import Farmer from '../models/farmer.model.js';
import Treatment from '../models/treatment.model.js';
import HighAmuAlert from '../models/highAmuAlert.model.js';
import Animal from '../models/animal.model.js';
import FeedAdministration from '../models/feedAdministration.model.js';
import AmuConfig from '../models/amuConfig.model.js';
import mongoose from 'mongoose';
import { subDays, subMonths, subWeeks } from 'date-fns';
import * as amuStats from '../services/amuStatistics.service.js';

/**
 * Get or create AMU configuration
 */
const getAmuConfig = async () => {
    let config = await AmuConfig.findOne({ isActive: true });

    if (!config) {
        // Create default configuration if none exists
        config = await AmuConfig.create({
            historicalSpikeThreshold: 2.0,
            peerComparisonThreshold: 1.5,
            absoluteIntensityThreshold: 0.5,
            trendIncreaseThreshold: 0.30,
            criticalDrugThreshold: 0.40,
            sustainedHighUsageDuration: 4,
            minimumEventsThreshold: 5,
            isActive: true
        });
        console.log('✅ Created default AMU configuration');
    }

    return config;
};

// --- JOB 1: HISTORICAL SPIKE ANALYSIS (runs daily) ---
export const runHistoricalSpikeAnalysis = async () => {
    console.log('Starting daily historical spike analysis...');
    const config = await getAmuConfig();
    const allFarmers = await Farmer.find().select('_id'); // Removed static herdSize

    for (const farmer of allFarmers) {
        const now = new Date();
        const last7Days = subDays(now, 7);
        const last6Months = subMonths(now, 6);

        // Dynamic Herd Size
        const herdSize = await Animal.countDocuments({ farmerId: farmer._id, status: 'Active' });
        if (herdSize === 0) continue; // Skip if no active animals

        // 1. Fetch Treatments (Direct Injection)
        const [currentWeekTreatments, historicalTreatments] = await Promise.all([
            Treatment.countDocuments({
                farmerId: farmer._id, status: 'Approved', createdAt: { $gte: last7Days }
            }),
            Treatment.countDocuments({
                farmerId: farmer._id, status: 'Approved', createdAt: { $gte: last6Months, $lt: last7Days }
            })
        ]);

        // 2. Fetch Feed Administrations (Medicated Feed)
        const [currentWeekFeed, historicalFeed] = await Promise.all([
            FeedAdministration.aggregate([
                { $match: { farmerId: farmer._id, vetApproved: true, administrationDate: { $gte: last7Days } } },
                { $group: { _id: null, totalAnimals: { $sum: '$numberOfAnimals' } } }
            ]),
            FeedAdministration.aggregate([
                { $match: { farmerId: farmer._id, vetApproved: true, administrationDate: { $gte: last6Months, $lt: last7Days } } },
                { $group: { _id: null, totalAnimals: { $sum: '$numberOfAnimals' } } }
            ])
        ]);

        const currentWeekFeedCount = currentWeekFeed[0]?.totalAnimals || 0;
        const historicalFeedCount = historicalFeed[0]?.totalAnimals || 0;

        // 3. Calculate Total AMU Events
        const currentWeekTotal = currentWeekTreatments + currentWeekFeedCount;
        const historicalTotal = historicalTreatments + historicalFeedCount;
        const historicalWeeklyAverage = historicalTotal / 25; // 25 weeks in 6 months

        // 4. Get drug class breakdown
        const drugBreakdown = await amuStats.getDrugClassBreakdown(farmer._id, last7Days, now);

        // 5. Compare
        const threshold = config.historicalSpikeThreshold;
        if (currentWeekTotal > config.minimumEventsThreshold &&
            currentWeekTotal > historicalWeeklyAverage * threshold) {

            const existingAlert = await HighAmuAlert.findOne({
                farmerId: farmer._id,
                status: 'New',
                alertType: 'HISTORICAL_SPIKE'
            });

            if (!existingAlert) {
                const percentSpike = Math.round((currentWeekTotal / (historicalWeeklyAverage || 0.1)) * 100);
                const deviationMultiplier = currentWeekTotal / (historicalWeeklyAverage || 0.1);
                const severity = amuStats.calculateSeverity('HISTORICAL_SPIKE', deviationMultiplier);

                const message = `Farm has a ${percentSpike}% spike in AMU this week (${currentWeekTotal} animals treated vs avg ${historicalWeeklyAverage.toFixed(1)}).`;

                await HighAmuAlert.create({
                    farmerId: farmer._id,
                    alertType: 'HISTORICAL_SPIKE',
                    severity: severity,
                    message: message,
                    details: {
                        currentWeekCount: currentWeekTotal,
                        historicalWeeklyAverage: parseFloat(historicalWeeklyAverage.toFixed(2)),
                        threshold: `>${threshold * 100}%`,
                        breakdown: `Treatments: ${currentWeekTreatments}, Feed: ${currentWeekFeedCount}`,
                        drugClassBreakdown: drugBreakdown.breakdown
                    }
                });
                console.log(`✓ Historical spike alert generated for farmer ${farmer._id} (Severity: ${severity})`);
            }
        }
    }
    console.log('Daily historical spike analysis finished.');
};


// --- JOB 2: PEER GROUP COMPARISON ANALYSIS (runs monthly) ---
export const runPeerComparisonAnalysis = async () => {
    console.log('Starting monthly peer-group AMU analysis...');
    const config = await getAmuConfig();
    const oneMonthAgo = subMonths(new Date(), 1);
    const now = new Date();

    // 1. Calculate the average AMU Intensity for different peer groups
    const peerGroupStats = await Farmer.aggregate([
        { $match: { speciesReared: { $exists: true } } },
        // Dynamic Herd Size Calculation
        {
            $lookup: {
                from: 'animals',
                localField: '_id',
                foreignField: 'farmerId',
                as: 'animals'
            }
        },
        {
            $addFields: {
                herdSize: {
                    $size: {
                        $filter: {
                            input: '$animals',
                            as: 'animal',
                            cond: { $eq: ['$$animal.status', 'Active'] }
                        }
                    }
                }
            }
        },
        { $match: { herdSize: { $gt: 0 } } },
        {
            $lookup: { from: 'treatments', localField: '_id', foreignField: 'farmerId', as: 'treatments' }
        },
        {
            $lookup: { from: 'feedadministrations', localField: '_id', foreignField: 'farmerId', as: 'feeds' }
        },
        {
            $project: {
                speciesReared: 1,
                herdSize: 1,
                herdSizeBucket: {
                    $switch: {
                        branches: [
                            { case: { $lte: ['$herdSize', 50] }, then: 'Small' },
                            { case: { $lte: ['$herdSize', 200] }, then: 'Medium' },
                        ],
                        default: 'Large'
                    }
                },
                recentTreatmentCount: {
                    $size: {
                        $filter: {
                            input: '$treatments',
                            as: 't',
                            cond: { $gte: ['$$t.createdAt', oneMonthAgo] }
                        }
                    }
                },
                recentFeedAnimalCount: {
                    $sum: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$feeds',
                                    as: 'f',
                                    cond: {
                                        $and: [
                                            { $gte: ['$$f.administrationDate', oneMonthAgo] },
                                            { $eq: ['$$f.vetApproved', true] }
                                        ]
                                    }
                                }
                            },
                            as: 'feed',
                            in: '$$feed.numberOfAnimals'
                        }
                    }
                }
            }
        },
        {
            $project: {
                speciesReared: 1,
                herdSizeBucket: 1,
                herdSize: 1,
                totalAMUEvents: { $add: ['$recentTreatmentCount', '$recentFeedAnimalCount'] }
            }
        },
        {
            $project: {
                speciesReared: 1,
                herdSizeBucket: 1,
                amuIntensity: { $divide: ['$totalAMUEvents', '$herdSize'] }
            }
        },
        {
            $group: {
                _id: { species: '$speciesReared', size: '$herdSizeBucket' },
                avgIntensity: { $avg: '$amuIntensity' },
                count: { $sum: 1 }
            }
        }
    ]);

    const averageMap = new Map(peerGroupStats.map(item => [`${item._id.species}-${item._id.size}`, item.avgIntensity]));

    // 2. Check each farm against peer average
    const allFarms = await Farmer.find({ speciesReared: { $exists: true } });

    for (const farm of allFarms) {
        const intensityData = await amuStats.calculateAmuIntensity(farm._id, oneMonthAgo, now);
        const farmIntensity = intensityData.intensity;
        const herdSize = intensityData.herdSize; // Use dynamic herd size from service

        if (herdSize === 0) continue;

        const sizeBucket = herdSize <= 50 ? 'Small' : herdSize <= 200 ? 'Medium' : 'Large';
        const peerKey = `${farm.speciesReared}-${sizeBucket}`;
        const peerAverage = averageMap.get(peerKey) || 0;

        // 3. Flag if intensity is > threshold of peer average
        const threshold = config.peerComparisonThreshold;
        if (farmIntensity > 0 && farmIntensity > peerAverage * threshold) {
            const existingAlert = await HighAmuAlert.findOne({
                farmerId: farm._id,
                status: 'New',
                alertType: 'PEER_COMPARISON_SPIKE'
            });

            if (!existingAlert) {
                const percentHigher = Math.round((farmIntensity / (peerAverage || 0.01)) * 100);
                const deviationMultiplier = farmIntensity / (peerAverage || 0.01);
                const severity = amuStats.calculateSeverity('PEER_COMPARISON_SPIKE', deviationMultiplier);

                const drugBreakdown = await amuStats.getDrugClassBreakdown(farm._id, oneMonthAgo, now);

                await HighAmuAlert.create({
                    farmerId: farm._id,
                    alertType: 'PEER_COMPARISON_SPIKE',
                    severity: severity,
                    message: `Farm AMU intensity is ${percentHigher}% higher than similar farms (${farmIntensity.toFixed(2)} vs avg ${peerAverage.toFixed(2)}).`,
                    details: {
                        farmMonthlyUsage: intensityData.totalEvents,
                        farmIntensity: parseFloat(farmIntensity.toFixed(2)),
                        peerAverageIntensity: parseFloat(peerAverage.toFixed(2)),
                        threshold: `>${threshold * 100}%`,
                        breakdown: `Treatments: ${intensityData.treatments}, Feed: ${intensityData.feedAnimals}`,
                        drugClassBreakdown: drugBreakdown.breakdown
                    }
                });
                console.log(`✓ Peer comparison alert for farmer ${farm._id} (Severity: ${severity})`);
            }
        }
    }
    console.log('Monthly peer-group AMU analysis finished.');
};


// --- JOB 3: ABSOLUTE THRESHOLD DETECTION (runs weekly) ---
export const runAbsoluteThresholdAnalysis = async () => {
    console.log('Starting weekly absolute threshold analysis...');
    const config = await getAmuConfig();
    const oneMonthAgo = subMonths(new Date(), 1);
    const now = new Date();
    const allFarmers = await Farmer.find().select('_id'); // Removed static herdSize filter

    for (const farmer of allFarmers) {
        const intensityData = await amuStats.calculateAmuIntensity(farmer._id, oneMonthAgo, now);
        const farmIntensity = intensityData.intensity;

        // Check if exceeds absolute threshold
        if (farmIntensity > config.absoluteIntensityThreshold &&
            intensityData.totalEvents > config.minimumEventsThreshold) {

            const existingAlert = await HighAmuAlert.findOne({
                farmerId: farmer._id,
                status: 'New',
                alertType: 'ABSOLUTE_THRESHOLD'
            });

            if (!existingAlert) {
                const deviationMultiplier = farmIntensity / config.absoluteIntensityThreshold;
                const severity = amuStats.calculateSeverity('ABSOLUTE_THRESHOLD', deviationMultiplier);
                const drugBreakdown = await amuStats.getDrugClassBreakdown(farmer._id, oneMonthAgo, now);

                await HighAmuAlert.create({
                    farmerId: farmer._id,
                    alertType: 'ABSOLUTE_THRESHOLD',
                    severity: severity,
                    message: `Farm exceeds absolute AMU threshold: ${farmIntensity.toFixed(2)} treatments/animal/month (threshold: ${config.absoluteIntensityThreshold}).`,
                    details: {
                        currentIntensity: parseFloat(farmIntensity.toFixed(2)),
                        thresholdIntensity: config.absoluteIntensityThreshold,
                        threshold: `>${config.absoluteIntensityThreshold}`,
                        breakdown: `Treatments: ${intensityData.treatments}, Feed: ${intensityData.feedAnimals}`,
                        drugClassBreakdown: drugBreakdown.breakdown
                    }
                });
                console.log(`✓ Absolute threshold alert for farmer ${farmer._id} (Severity: ${severity})`);
            }
        }
    }
    console.log('Weekly absolute threshold analysis finished.');
};


// --- JOB 4: TREND ANALYSIS (runs monthly) ---
export const runTrendAnalysis = async () => {
    console.log('Starting monthly trend analysis...');
    const config = await getAmuConfig();
    const allFarmers = await Farmer.find().select('_id'); // Removed static herdSize filter

    for (const farmer of allFarmers) {
        // Get 3-month trend
        const trendData = await amuStats.getAmuTrend(farmer._id, 3);

        if (trendData.length < 3) continue; // Need at least 3 months of data

        const [threeMonthsAgo, twoMonthsAgo, currentMonth] = trendData;

        // Calculate total events for each month
        const month3Total = threeMonthsAgo.totalEvents;
        const month2Total = twoMonthsAgo.totalEvents;
        const month1Total = currentMonth.totalEvents;

        // Check for increasing trend
        if (month1Total > config.minimumEventsThreshold &&
            month1Total > month3Total) {

            const percentageIncrease = ((month1Total - month3Total) / (month3Total || 1));

            if (percentageIncrease > config.trendIncreaseThreshold) {
                const existingAlert = await HighAmuAlert.findOne({
                    farmerId: farmer._id,
                    status: 'New',
                    alertType: 'TREND_INCREASE'
                });

                if (!existingAlert) {
                    const severity = amuStats.calculateSeverity('TREND_INCREASE', percentageIncrease);
                    const now = new Date();
                    const oneMonthAgo = subMonths(now, 1);
                    const drugBreakdown = await amuStats.getDrugClassBreakdown(farmer._id, oneMonthAgo, now);

                    await HighAmuAlert.create({
                        farmerId: farmer._id,
                        alertType: 'TREND_INCREASE',
                        severity: severity,
                        message: `Farm shows ${Math.round(percentageIncrease * 100)}% increase in AMU over 3 months (${month3Total} → ${month1Total} events).`,
                        details: {
                            currentMonthUsage: month1Total,
                            previousMonthUsage: month2Total,
                            threeMonthsAgoUsage: month3Total,
                            percentageIncrease: parseFloat((percentageIncrease * 100).toFixed(1)),
                            threshold: `>${config.trendIncreaseThreshold * 100}%`,
                            drugClassBreakdown: drugBreakdown.breakdown
                        }
                    });
                    console.log(`✓ Trend increase alert for farmer ${farmer._id} (Severity: ${severity})`);
                }
            }
        }
    }
    console.log('Monthly trend analysis finished.');
};


// --- JOB 5: CRITICAL DRUG MONITORING (runs weekly) ---
export const runCriticalDrugMonitoring = async () => {
    console.log('Starting weekly critical drug monitoring...');
    const config = await getAmuConfig();
    const oneMonthAgo = subMonths(new Date(), 1);
    const now = new Date();
    const allFarmers = await Farmer.find().select('_id');

    for (const farmer of allFarmers) {
        const drugBreakdown = await amuStats.getDrugClassBreakdown(farmer._id, oneMonthAgo, now);

        // Check if critical drug usage exceeds threshold
        if (drugBreakdown.total > config.minimumEventsThreshold) {
            const criticalPercentage = drugBreakdown.criticalPercentage / 100;

            if (criticalPercentage > config.criticalDrugThreshold) {
                const existingAlert = await HighAmuAlert.findOne({
                    farmerId: farmer._id,
                    status: 'New',
                    alertType: 'CRITICAL_DRUG_USAGE'
                });

                if (!existingAlert) {
                    const severity = amuStats.calculateSeverity('CRITICAL_DRUG_USAGE', criticalPercentage);

                    await HighAmuAlert.create({
                        farmerId: farmer._id,
                        alertType: 'CRITICAL_DRUG_USAGE',
                        severity: severity,
                        message: `Farm uses ${drugBreakdown.criticalPercentage.toFixed(1)}% critical antibiotics (Watch/Reserve) - above ${config.criticalDrugThreshold * 100}% threshold.`,
                        details: {
                            totalAmuEvents: drugBreakdown.total,
                            criticalDrugEvents: drugBreakdown.criticalCount,
                            criticalDrugPercentage: parseFloat(drugBreakdown.criticalPercentage.toFixed(1)),
                            watchDrugCount: drugBreakdown.breakdown.watch,
                            reserveDrugCount: drugBreakdown.breakdown.reserve,
                            threshold: `>${config.criticalDrugThreshold * 100}%`,
                            drugClassBreakdown: drugBreakdown.breakdown
                        }
                    });
                    console.log(`✓ Critical drug usage alert for farmer ${farmer._id} (Severity: ${severity})`);
                }
            }
        }
    }
    console.log('Weekly critical drug monitoring finished.');
};


// --- JOB 6: SUSTAINED HIGH USAGE DETECTION (runs weekly) ---
export const runSustainedHighUsageAnalysis = async () => {
    console.log('Starting weekly sustained high usage analysis...');
    const config = await getAmuConfig();
    const allFarmers = await Farmer.find().select('_id'); // Removed static herdSize filter
    const weeksToCheck = config.sustainedHighUsageDuration;

    for (const farmer of allFarmers) {
        let weeksAboveThreshold = 0;
        let totalIntensity = 0;
        const now = new Date();

        // Check each of the last N weeks
        for (let i = 0; i < weeksToCheck; i++) {
            const weekEnd = subWeeks(now, i);
            const weekStart = subWeeks(weekEnd, 1);

            const weekData = await amuStats.calculateAmuIntensity(farmer._id, weekStart, weekEnd);

            if (weekData.intensity > config.absoluteIntensityThreshold) {
                weeksAboveThreshold++;
                totalIntensity += weekData.intensity;
            }
        }

        // Alert if ALL weeks were above threshold
        if (weeksAboveThreshold === weeksToCheck) {
            const existingAlert = await HighAmuAlert.findOne({
                farmerId: farmer._id,
                status: 'New',
                alertType: 'SUSTAINED_HIGH_USAGE'
            });

            if (!existingAlert) {
                const averageIntensity = totalIntensity / weeksToCheck;
                const deviationMultiplier = averageIntensity / config.absoluteIntensityThreshold;
                const severity = amuStats.calculateSeverity('SUSTAINED_HIGH_USAGE', deviationMultiplier);

                const oneMonthAgo = subMonths(now, 1);
                const drugBreakdown = await amuStats.getDrugClassBreakdown(farmer._id, oneMonthAgo, now);

                await HighAmuAlert.create({
                    farmerId: farmer._id,
                    alertType: 'SUSTAINED_HIGH_USAGE',
                    severity: severity,
                    message: `Farm has sustained high AMU for ${weeksToCheck} consecutive weeks (avg: ${averageIntensity.toFixed(2)}).`,
                    details: {
                        weeksAboveThreshold: weeksToCheck,
                        averageIntensity: parseFloat(averageIntensity.toFixed(2)),
                        threshold: `${weeksToCheck} weeks`,
                        drugClassBreakdown: drugBreakdown.breakdown
                    }
                });
                console.log(`✓ Sustained high usage alert for farmer ${farmer._id} (Severity: ${severity})`);
            }
        }
    }
    console.log('Weekly sustained high usage analysis finished.');
};


// --- MASTER JOB RUNNER ---
export const runAllAmuAnalysis = async () => {
    console.log('🔍 Running all AMU analysis jobs...');
    try {
        await runHistoricalSpikeAnalysis();
        await runPeerComparisonAnalysis();
        await runAbsoluteThresholdAnalysis();
        await runTrendAnalysis();
        await runCriticalDrugMonitoring();
        await runSustainedHighUsageAnalysis();
        console.log('✅ All AMU analysis jobs completed successfully');
    } catch (error) {
        console.error('❌ Error running AMU analysis:', error);
    }
};


// --- SCHEDULER ---
export const startAmuAnalysisJob = () => {
    // Historical spike - daily at 2 AM
    cron.schedule('0 2 * * *', runHistoricalSpikeAnalysis);

    // Peer comparison - 1st of month at 3 AM
    cron.schedule('0 3 1 * *', runPeerComparisonAnalysis);

    // Absolute threshold - weekly on Monday at 4 AM
    cron.schedule('0 4 * * 1', runAbsoluteThresholdAnalysis);

    // Trend analysis - 1st of month at 5 AM
    cron.schedule('0 5 1 * *', runTrendAnalysis);

    // Critical drug monitoring - weekly on Monday at 6 AM
    cron.schedule('0 6 * * 1', runCriticalDrugMonitoring);

    // Sustained high usage - weekly on Monday at 7 AM
    cron.schedule('0 7 * * 1', runSustainedHighUsageAnalysis);

    console.log('✅ Enhanced AMU analysis jobs have been scheduled:');
    console.log('   - Historical Spike: Daily at 2:00 AM');
    console.log('   - Peer Comparison: Monthly (1st) at 3:00 AM');
    console.log('   - Absolute Threshold: Weekly (Mon) at 4:00 AM');
    console.log('   - Trend Analysis: Monthly (1st) at 5:00 AM');
    console.log('   - Critical Drug Monitoring: Weekly (Mon) at 6:00 AM');
    console.log('   - Sustained High Usage: Weekly (Mon) at 7:00 AM');
};