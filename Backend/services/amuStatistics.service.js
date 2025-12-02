import mongoose from 'mongoose';
import Treatment from '../models/treatment.model.js';
import FeedAdministration from '../models/feedAdministration.model.js';
import Feed from '../models/feed.model.js';
import Farmer from '../models/farmer.model.js';
import Animal from '../models/animal.model.js';
import { subDays, subMonths } from 'date-fns';

/**
 * AMU Statistics Service
 * 
 * Centralized service for calculating Antimicrobial Usage (AMU) metrics
 * across the system. Ensures consistent calculations and prevents discrepancies.
 */

/**
 * Calculate AMU Intensity for a farm
 * @param {ObjectId} farmerId - The farmer's ID
 * @param {Date} startDate - Start date for calculation
 * @param {Date} endDate - End date for calculation
 * @returns {Object} AMU intensity data
 */
export const calculateAmuIntensity = async (farmerId, startDate, endDate) => {
    try {
        // Calculate dynamic herd size (Active animals)
        const herdSize = await Animal.countDocuments({
            farmerId: farmerId,
            status: 'Active'
        });

        if (herdSize === 0) {
            return {
                intensity: 0,
                totalEvents: 0,
                treatments: 0,
                feedAnimals: 0,
                error: 'No active animals found (Herd Size = 0)'
            };
        }

        // Count approved treatments
        const treatmentCount = await Treatment.countDocuments({
            farmerId: farmerId,
            status: 'Approved',
            createdAt: { $gte: startDate, $lte: endDate }
        });

        // Sum animals treated via medicated feed
        const feedStats = await FeedAdministration.aggregate([
            {
                $match: {
                    farmerId: new mongoose.Types.ObjectId(farmerId),
                    vetApproved: true,
                    administrationDate: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAnimals: { $sum: '$numberOfAnimals' }
                }
            }
        ]);

        const feedAnimals = feedStats[0]?.totalAnimals || 0;
        const totalEvents = treatmentCount + feedAnimals;
        const intensity = totalEvents / herdSize;

        return {
            intensity: parseFloat(intensity.toFixed(4)),
            totalEvents,
            treatments: treatmentCount,
            feedAnimals,
            herdSize: herdSize
        };
    } catch (error) {
        console.error('Error calculating AMU intensity:', error);
        throw error;
    }
};

/**
 * Get AMU trend data for a farm over specified months
 * @param {ObjectId} farmerId - The farmer's ID
 * @param {Number} months - Number of months to analyze
 * @returns {Array} Monthly AMU data
 */
export const getAmuTrend = async (farmerId, months = 6) => {
    try {
        const trendData = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const endDate = subMonths(now, i);
            const startDate = subMonths(endDate, 1);

            const monthData = await calculateAmuIntensity(farmerId, startDate, endDate);

            trendData.push({
                month: endDate.toISOString().substring(0, 7), // YYYY-MM format
                ...monthData
            });
        }

        return trendData;
    } catch (error) {
        console.error('Error getting AMU trend:', error);
        throw error;
    }
};

/**
 * Get drug class breakdown for a farm
 * @param {ObjectId} farmerId - The farmer's ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Drug class breakdown
 */
export const getDrugClassBreakdown = async (farmerId, startDate, endDate) => {
    try {
        // Get treatment breakdown
        const treatmentBreakdown = await Treatment.aggregate([
            {
                $match: {
                    farmerId: new mongoose.Types.ObjectId(farmerId),
                    status: 'Approved',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$drugClass',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get feed administration breakdown
        const feedBreakdown = await FeedAdministration.aggregate([
            {
                $match: {
                    farmerId: new mongoose.Types.ObjectId(farmerId),
                    vetApproved: true,
                    administrationDate: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $lookup: {
                    from: 'feeds',
                    localField: 'feedId',
                    foreignField: '_id',
                    as: 'feedData'
                }
            },
            {
                $unwind: '$feedData'
            },
            {
                $group: {
                    _id: '$feedData.antimicrobialClass',
                    count: { $sum: '$numberOfAnimals' }
                }
            }
        ]);

        // Combine and aggregate
        const breakdown = {
            access: 0,
            watch: 0,
            reserve: 0,
            unclassified: 0
        };

        treatmentBreakdown.forEach(item => {
            const className = (item._id || 'Unclassified').toLowerCase();
            if (breakdown.hasOwnProperty(className)) {
                breakdown[className] += item.count;
            }
        });

        feedBreakdown.forEach(item => {
            const className = (item._id || 'Unclassified').toLowerCase();
            if (breakdown.hasOwnProperty(className)) {
                breakdown[className] += item.count;
            }
        });

        const total = breakdown.access + breakdown.watch + breakdown.reserve + breakdown.unclassified;
        const criticalCount = breakdown.watch + breakdown.reserve;
        const criticalPercentage = total > 0 ? (criticalCount / total) : 0;

        return {
            breakdown,
            total,
            criticalCount,
            criticalPercentage: parseFloat((criticalPercentage * 100).toFixed(2))
        };
    } catch (error) {
        console.error('Error getting drug class breakdown:', error);
        throw error;
    }
};

/**
 * Get peer group statistics for comparison
 * @param {String} species - Species reared
 * @param {String} herdSizeBucket - Small/Medium/Large
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Peer group stats
 */
export const getPeerGroupStats = async (species, herdSizeBucket, startDate, endDate) => {
    try {
        const peerStats = await Farmer.aggregate([
            {
                $match: {
                    speciesReared: species
                }
            },
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
            {
                $match: {
                    herdSize: { $gt: 0 }
                }
            },
            {
                $addFields: {
                    sizeBucket: {
                        $switch: {
                            branches: [
                                { case: { $lte: ['$herdSize', 50] }, then: 'Small' },
                                { case: { $lte: ['$herdSize', 200] }, then: 'Medium' }
                            ],
                            default: 'Large'
                        }
                    }
                }
            },
            {
                $match: { sizeBucket: herdSizeBucket }
            },
            {
                $lookup: {
                    from: 'treatments',
                    localField: '_id',
                    foreignField: 'farmerId',
                    as: 'treatments'
                }
            },
            {
                $lookup: {
                    from: 'feedadministrations',
                    localField: '_id',
                    foreignField: 'farmerId',
                    as: 'feeds'
                }
            },
            {
                $project: {
                    herdSize: 1,
                    treatmentCount: {
                        $size: {
                            $filter: {
                                input: '$treatments',
                                as: 't',
                                cond: {
                                    $and: [
                                        { $gte: ['$$t.createdAt', startDate] },
                                        { $lte: ['$$t.createdAt', endDate] },
                                        { $eq: ['$$t.status', 'Approved'] }
                                    ]
                                }
                            }
                        }
                    },
                    feedAnimalCount: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$feeds',
                                        as: 'f',
                                        cond: {
                                            $and: [
                                                { $gte: ['$$f.administrationDate', startDate] },
                                                { $lte: ['$$f.administrationDate', endDate] },
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
                    totalEvents: { $add: ['$treatmentCount', '$feedAnimalCount'] },
                    intensity: {
                        $divide: [
                            { $add: ['$treatmentCount', '$feedAnimalCount'] },
                            '$herdSize'
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avgIntensity: { $avg: '$intensity' },
                    maxIntensity: { $max: '$intensity' },
                    minIntensity: { $min: '$intensity' },
                    farmCount: { $sum: 1 }
                }
            }
        ]);

        return peerStats[0] || {
            avgIntensity: 0,
            maxIntensity: 0,
            minIntensity: 0,
            farmCount: 0
        };
    } catch (error) {
        console.error('Error getting peer group stats:', error);
        throw error;
    }
};

/**
 * Calculate severity score for an AMU alert
 * @param {String} alertType - Type of alert
 * @param {Number} deviationMultiplier - How much above threshold
 * @returns {String} Severity level
 */
export const calculateSeverity = (alertType, deviationMultiplier) => {
    // Critical drug usage is always high severity
    if (alertType === 'CRITICAL_DRUG_USAGE') {
        if (deviationMultiplier >= 0.6) return 'Critical'; // >60% critical drugs
        if (deviationMultiplier >= 0.4) return 'High';
        return 'Medium';
    }

    // For other alert types
    if (deviationMultiplier >= 3.0) return 'Critical'; // 300%+ of threshold
    if (deviationMultiplier >= 2.0) return 'High';      // 200%+ of threshold
    if (deviationMultiplier >= 1.5) return 'Medium';    // 150%+ of threshold
    return 'Low';
};
