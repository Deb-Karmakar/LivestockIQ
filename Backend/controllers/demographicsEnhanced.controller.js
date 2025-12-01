// backend/controllers/demographicsEnhanced.controller.js

import Farmer from '../models/farmer.model.js';
import Animal from '../models/animal.model.js';
import Treatment from '../models/treatment.model.js';
import FeedAdministration from '../models/feedAdministration.model.js';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Enhanced Demographics Data Controller
 * Provides comprehensive animal demographics with regional analysis, AMU correlation,
 * temporal trends, and MRL compliance metrics
 */
export const getDemographicsDataEnhanced = async (req, res) => {
    try {
        // Parse period parameter (default: 12 months)
        const periodParam = req.query.period || '12m';
        const periodMap = {
            '30d': { months: 1, label: '30 Days' },
            '3m': { months: 3, label: '3 Months' },
            '6m': { months: 6, label: '6 Months' },
            '12m': { months: 12, label: '12 Months' }
        };
        const period = periodMap[periodParam] || periodMap['12m'];
        const startDate = subMonths(new Date(), period.months);

        // Execute all queries in parallel for performance
        const [
            herdCompositionRaw,
            ageDistributionRaw,
            speciesGenderRaw,
            regionalDistributionRaw,
            amuBySpeciesRaw,
            treatmentsBySpeciesRaw,
            feedBySpeciesRaw,
            mrlStatusBySpeciesRaw,
            populationTrendsRaw
        ] = await Promise.all([
            // Query 1: Herd composition by species
            Animal.aggregate([
                { $group: { _id: '$species', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // Query 2: Age distribution
            Animal.aggregate([
                { $project: { age: { $divide: [{ $subtract: [new Date(), '$dob'] }, (365 * 24 * 60 * 60 * 1000)] } } },
                { $bucket: { groupBy: "$age", boundaries: [0, 1, 3, 5, 10, Infinity], default: "Unknown", output: { "count": { $sum: 1 } } } }
            ]),

            // Query 3: Species and gender breakdown
            Animal.aggregate([
                { $match: { species: { $ne: null }, gender: { $ne: null } } },
                { $group: { _id: { species: '$species', gender: '$gender' }, count: { $sum: 1 } } }
            ]),

            // Query 4: Regional Distribution (State/District > Geo Zones)
            Animal.aggregate([
                {
                    $lookup: {
                        from: 'farmers',
                        localField: 'farmerId',
                        foreignField: '_id',
                        as: 'farmInfo'
                    }
                },
                { $unwind: '$farmInfo' },
                {
                    $project: {
                        species: 1,
                        farmerId: 1,
                        location: '$farmInfo.location',
                        hasAdminLoc: {
                            $and: [
                                { $ifNull: ['$farmInfo.location.state', false] },
                                { $ne: ['$farmInfo.location.state', ''] }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        species: 1,
                        farmerId: 1,
                        groupBy: {
                            $cond: {
                                if: '$hasAdminLoc',
                                then: {
                                    type: 'admin',
                                    state: '$location.state',
                                    district: '$location.district'
                                },
                                else: {
                                    type: 'geo',
                                    lat: { $floor: '$location.latitude' },
                                    lng: { $floor: '$location.longitude' }
                                }
                            }
                        }
                    }
                },
                {
                    $match: {
                        // Ensure we have either admin loc or coordinates
                        $or: [
                            { 'groupBy.type': 'admin' },
                            { 'groupBy.lat': { $ne: null }, 'groupBy.lng': { $ne: null } }
                        ]
                    }
                },
                {
                    $group: {
                        _id: '$groupBy',
                        animalCount: { $sum: 1 },
                        farms: { $addToSet: '$farmerId' },
                        species: { $push: '$species' }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        animalCount: 1,
                        farmCount: { $size: '$farms' },
                        species: 1
                    }
                },
                { $sort: { animalCount: -1 } },
                { $limit: 20 }
            ]),

            // Query 5: AMU (Treatments + Feed) by species
            Animal.aggregate([
                {
                    $lookup: {
                        from: 'treatments',
                        let: { animalTag: '$tagId' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$animalId', '$$animalTag'] },
                                    status: 'Approved',
                                    startDate: { $gte: startDate }
                                }
                            }
                        ],
                        as: 'treatments'
                    }
                },
                {
                    $lookup: {
                        from: 'feedadministrations',
                        let: { animalTag: '$tagId' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $in: ['$$animalTag', '$animalIds'] },
                                    status: 'Approved',
                                    isMedicated: true,
                                    startDate: { $gte: startDate }
                                }
                            }
                        ],
                        as: 'feedAdministrations'
                    }
                },
                {
                    $group: {
                        _id: '$species',
                        totalAnimals: { $sum: 1 },
                        totalTreatments: { $sum: { $size: '$treatments' } },
                        totalFeedAdministrations: { $sum: { $size: '$feedAdministrations' } }
                    }
                },
                {
                    $project: {
                        species: '$_id',
                        totalAnimals: 1,
                        totalAMU: { $add: ['$totalTreatments', '$totalFeedAdministrations'] },
                        avgAMUPerAnimal: {
                            $cond: {
                                if: { $gt: ['$totalAnimals', 0] },
                                then: { $divide: [{ $add: ['$totalTreatments', '$totalFeedAdministrations'] }, '$totalAnimals'] },
                                else: 0
                            }
                        }
                    }
                },
                { $sort: { totalAMU: -1 } }
            ]),

            // Query 6: Treatment count by species (for detailed breakdown)
            Treatment.aggregate([
                {
                    $match: {
                        status: 'Approved',
                        startDate: { $gte: startDate }
                    }
                },
                {
                    $lookup: {
                        from: 'animals',
                        localField: 'animalId',
                        foreignField: 'tagId',
                        as: 'animalInfo'
                    }
                },
                { $unwind: '$animalInfo' },
                {
                    $group: {
                        _id: '$animalInfo.species',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Query 7: Feed administration count by species
            FeedAdministration.aggregate([
                {
                    $match: {
                        status: 'Approved',
                        isMedicated: true,
                        startDate: { $gte: startDate }
                    }
                },
                { $unwind: '$animalIds' },
                {
                    $lookup: {
                        from: 'animals',
                        localField: 'animalIds',
                        foreignField: 'tagId',
                        as: 'animalInfo'
                    }
                },
                { $unwind: '$animalInfo' },
                {
                    $group: {
                        _id: '$animalInfo.species',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Query 8: MRL status distribution by species
            Animal.aggregate([
                {
                    $group: {
                        _id: {
                            species: '$species',
                            mrlStatus: '$mrlStatus'
                        },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Query 9: Population trends over time (monthly registration)
            Animal.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        newRegistrations: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ])
        ]);

        // ===== Process Results =====

        // 1. Herd Composition
        const herdComposition = herdCompositionRaw.map(item => ({
            name: item._id,
            value: item.count
        }));

        // 2. Age Distribution
        const ageLabels = ['0-1 Years', '1-3 Years', '3-5 Years', '5-10 Years', '10+ Years'];
        const ageDistribution = ageDistributionRaw.map((bucket, index) => ({
            name: ageLabels[index] || 'Unknown',
            count: bucket.count
        }));

        // 3. Species Gender Breakdown
        const speciesGenderMap = {};
        speciesGenderRaw.forEach(item => {
            const { species, gender } = item._id;
            const count = item.count;

            if (!speciesGenderMap[species]) {
                speciesGenderMap[species] = { species, total: 0, Male: 0, Female: 0 };
            }

            speciesGenderMap[species].total += count;
            if (gender === 'Male' || gender === 'Female') {
                speciesGenderMap[species][gender] += count;
            }
        });
        const speciesGenderBreakdown = Object.values(speciesGenderMap).sort((a, b) => b.total - a.total);

        // 4. Regional Distribution
        const regionalDistribution = regionalDistributionRaw.map(item => {
            let displayName, state, district;

            if (item._id.type === 'admin') {
                state = item._id.state;
                district = item._id.district || 'Unknown';
                displayName = `${district}, ${state}`;
            } else {
                const lat = item._id.lat;
                const lng = item._id.lng;
                displayName = `Zone ${lat}°N, ${lng}°E`;
                state = `Lat: ${lat}`;
                district = `Lng: ${lng}`;
            }

            // Count species distribution
            const speciesCount = {};
            item.species.forEach(sp => {
                speciesCount[sp] = (speciesCount[sp] || 0) + 1;
            });

            return {
                region: displayName,
                state: state,
                district: district,
                farms: item.farmCount,
                animals: item.animalCount,
                speciesDistribution: speciesCount
            };
        });

        // 5. AMU Correlation by Species
        const amuCorrelation = {
            bySpecies: amuBySpeciesRaw.map(item => ({
                species: item.species,
                totalAnimals: item.totalAnimals,
                totalAMU: item.totalAMU,
                avgAMUPerAnimal: parseFloat(item.avgAMUPerAnimal.toFixed(2))
            }))
        };

        // 6. MRL Compliance by Species
        const mrlStatusMap = {};
        mrlStatusBySpeciesRaw.forEach(item => {
            const species = item._id.species;
            const status = item._id.mrlStatus || 'SAFE';

            if (!mrlStatusMap[species]) {
                mrlStatusMap[species] = {
                    species,
                    SAFE: 0,
                    NEW: 0,
                    WITHDRAWAL_ACTIVE: 0,
                    TEST_REQUIRED: 0,
                    PENDING_VERIFICATION: 0,
                    VIOLATION: 0
                };
            }

            mrlStatusMap[species][status] = item.count;
        });

        const mrlCompliance = {
            bySpecies: Object.values(mrlStatusMap).map(item => {
                const total = item.SAFE + item.NEW + item.WITHDRAWAL_ACTIVE + item.TEST_REQUIRED +
                    item.PENDING_VERIFICATION + item.VIOLATION;
                // Count SAFE and NEW as compliant
                const compliantCount = item.SAFE + item.NEW;
                const compliancePercentage = total > 0 ? ((compliantCount / total) * 100).toFixed(1) : 100;

                return {
                    ...item,
                    total,
                    compliancePercentage: parseFloat(compliancePercentage)
                };
            }).sort((a, b) => b.total - a.total)
        };

        // 7. Temporal Trends (Population by Month)
        const populationByMonth = [];
        const totalAnimals = await Animal.countDocuments();

        for (let i = period.months - 1; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);

            const monthData = populationTrendsRaw.find(d =>
                d._id.month === (date.getMonth() + 1) && d._id.year === date.getFullYear()
            );

            populationByMonth.push({
                month: format(date, 'MMM yyyy'),
                monthShort: format(date, 'MMM'),
                newRegistrations: monthData ? monthData.newRegistrations : 0
            });
        }

        const temporalTrends = {
            populationByMonth,
            currentTotal: totalAnimals
        };

        // 8. Summary Statistics
        const totalAMU = amuBySpeciesRaw.reduce((sum, item) => sum + item.totalAMU, 0);
        const avgMRLCompliance = mrlCompliance.bySpecies.length > 0
            ? (mrlCompliance.bySpecies.reduce((sum, item) => sum + item.compliancePercentage, 0) / mrlCompliance.bySpecies.length).toFixed(1)
            : 100;

        const summary = {
            totalAnimals,
            totalSpecies: herdComposition.length,
            totalRegions: regionalDistribution.length,
            totalAMU,
            avgMRLCompliance: parseFloat(avgMRLCompliance),
            period: period.label
        };

        // ===== Send Response =====
        res.json({
            // Existing fields (for backward compatibility)
            herdComposition,
            ageDistribution,
            speciesGenderBreakdown,

            // New enhanced fields
            regionalDistribution,
            amuCorrelation,
            mrlCompliance,
            temporalTrends,
            summary
        });

    } catch (error) {
        console.error("Error in getDemographicsDataEnhanced:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};
