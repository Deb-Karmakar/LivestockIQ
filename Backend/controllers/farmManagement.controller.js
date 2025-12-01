// Backend/controllers/farmManagement.controller.js

import Farmer from '../models/farmer.model.js';
import Animal from '../models/animal.model.js';
import Treatment from '../models/treatment.model.js';
import FeedAdministration from '../models/feedAdministration.model.js';
import RegulatorAlert from '../models/regulatorAlert.model.js';
import Veterinarian from '../models/vet.model.js';

/**
 * @desc    Get all farms with statistics
 * @route   GET /api/regulator/farms
 * @access  Private (Regulator)
 */
export const getAllFarms = async (req, res) => {
    try {
        const { search, species, status, page = 1, limit = 20 } = req.query;

        // Build query
        const query = {};
        if (search) {
            query.$or = [
                { farmName: { $regex: search, $options: 'i' } },
                { farmOwner: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) {
            query.status = status;
        }
        if (species) {
            query.speciesReared = { $regex: species, $options: 'i' };
        }

        // Get farms with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const farms = await Farmer.find(query)
            .select('-password')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean();

        const totalFarms = await Farmer.countDocuments(query);

        // Enhance each farm with statistics
        const farmsWithStats = await Promise.all(farms.map(async (farm) => {
            const [totalAnimals, activeTreatments, alerts, vet] = await Promise.all([
                Animal.countDocuments({ farmerId: farm._id, status: 'Active' }),
                Treatment.countDocuments({
                    farmerId: farm._id,
                    status: { $in: ['Pending', 'Approved'] }
                }),
                RegulatorAlert.countDocuments({
                    farmerId: farm._id,
                    status: { $ne: 'RESOLVED' }
                }),
                Veterinarian.findOne({ vetId: farm.vetId }).select('fullName email')
            ]);

            // Calculate compliance rate
            const totalAlerts = await RegulatorAlert.countDocuments({ farmerId: farm._id });
            const complianceRate = totalAlerts === 0 ? 100 :
                Math.max(0, 100 - (alerts / Math.max(totalAlerts, 1)) * 100);

            return {
                ...farm,
                statistics: {
                    totalAnimals,
                    activeTreatments,
                    activeAlerts: alerts,
                    complianceRate: Math.round(complianceRate)
                },
                veterinarian: vet
            };
        }));

        res.status(200).json({
            success: true,
            data: farmsWithStats,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalFarms / parseInt(limit)),
                totalItems: totalFarms,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error in getAllFarms:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch farms',
            error: error.message
        });
    }
};

/**
 * @desc    Get detailed farm information
 * @route   GET /api/regulator/farms/:id
 * @access  Private (Regulator)
 */
export const getFarmDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const farm = await Farmer.findById(id).select('-password').lean();
        if (!farm) {
            return res.status(404).json({
                success: false,
                message: 'Farm not found'
            });
        }

        // Get comprehensive statistics
        const [
            totalAnimals,
            activeAnimals,
            animalsBySpecies,
            totalTreatments,
            activeTreatments,
            totalAlerts,
            activeAlerts,
            vet,
            recentTreatments
        ] = await Promise.all([
            Animal.countDocuments({ farmerId: id }),
            Animal.countDocuments({ farmerId: id, status: 'Active' }),
            Animal.aggregate([
                { $match: { farmerId: farm._id } },
                { $group: { _id: '$species', count: { $sum: 1 } } }
            ]),
            Treatment.countDocuments({ farmerId: id }),
            Treatment.countDocuments({ farmerId: id, status: { $in: ['Pending', 'Approved'] } }),
            RegulatorAlert.countDocuments({ farmerId: id }),
            RegulatorAlert.countDocuments({ farmerId: id, status: { $ne: 'RESOLVED' } }),
            Veterinarian.findOne({ vetId: farm.vetId }).select('fullName email phoneNumber licenseNumber'),
            Treatment.find({ farmerId: id })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('animalId', 'tagId name species')
                .lean()
        ]);

        // MRL Status breakdown
        const mrlStatusBreakdown = await Animal.aggregate([
            { $match: { farmerId: farm._id, status: 'Active' } },
            { $group: { _id: '$mrlStatus', count: { $sum: 1 } } }
        ]);

        const complianceRate = totalAlerts === 0 ? 100 :
            Math.max(0, 100 - (activeAlerts / totalAlerts) * 100);

        res.status(200).json({
            success: true,
            data: {
                farm,
                veterinarian: vet,
                statistics: {
                    animals: {
                        total: totalAnimals,
                        active: activeAnimals,
                        bySpecies: animalsBySpecies,
                        byMrlStatus: mrlStatusBreakdown
                    },
                    treatments: {
                        total: totalTreatments,
                        active: activeTreatments
                    },
                    alerts: {
                        total: totalAlerts,
                        active: activeAlerts
                    },
                    complianceRate: Math.round(complianceRate)
                },
                recentTreatments
            }
        });
    } catch (error) {
        console.error('Error in getFarmDetails:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch farm details',
            error: error.message
        });
    }
};

/**
 * @desc    Get all animals for a specific farm
 * @route   GET /api/regulator/farms/:id/animals
 * @access  Private (Regulator)
 */
export const getFarmAnimals = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, species, mrlStatus, page = 1, limit = 50 } = req.query;

        // Verify farm exists
        const farm = await Farmer.findById(id);
        if (!farm) {
            return res.status(404).json({
                success: false,
                message: 'Farm not found'
            });
        }

        // Build query
        const query = { farmerId: id };
        if (status) query.status = status;
        if (species) query.species = species;
        if (mrlStatus) query.mrlStatus = mrlStatus;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [animals, totalAnimals] = await Promise.all([
            Animal.find(query)
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .lean(),
            Animal.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: animals,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalAnimals / parseInt(limit)),
                totalItems: totalAnimals,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error in getFarmAnimals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch farm animals',
            error: error.message
        });
    }
};

/**
 * @desc    Get treatment history for a farm
 * @route   GET /api/regulator/farms/:id/treatments
 * @access  Private (Regulator)
 */
export const getFarmTreatments = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, drugType, startDate, endDate, page = 1, limit = 50 } = req.query;

        // Verify farm exists
        const farm = await Farmer.findById(id);
        if (!farm) {
            return res.status(404).json({
                success: false,
                message: 'Farm not found'
            });
        }

        // Build query
        const query = { farmerId: id };
        if (status) query.status = status;
        if (drugType) query.drugType = drugType;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [treatments, totalTreatments] = await Promise.all([
            Treatment.find(query)
                .populate('animalId', 'tagId name species')
                .populate('vetId', 'fullName licenseNumber')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .lean(),
            Treatment.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: treatments,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalTreatments / parseInt(limit)),
                totalItems: totalTreatments,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error in getFarmTreatments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch farm treatments',
            error: error.message
        });
    }
};

/**
 * @desc    Get compliance scorecard for a farm
 * @route   GET /api/regulator/farms/:id/compliance
 * @access  Private (Regulator)
 */
export const getFarmCompliance = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify farm exists
        const farm = await Farmer.findById(id);
        if (!farm) {
            return res.status(404).json({
                success: false,
                message: 'Farm not found'
            });
        }

        // Get alerts breakdown
        const [alertsByType, alertsBySeverity, alertsByStatus, totalAlerts, resolvedAlerts] = await Promise.all([
            RegulatorAlert.aggregate([
                { $match: { farmerId: farm._id } },
                { $group: { _id: '$alertType', count: { $sum: 1 } } }
            ]),
            RegulatorAlert.aggregate([
                { $match: { farmerId: farm._id } },
                { $group: { _id: '$severity', count: { $sum: 1 } } }
            ]),
            RegulatorAlert.aggregate([
                { $match: { farmerId: farm._id } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            RegulatorAlert.countDocuments({ farmerId: id }),
            RegulatorAlert.countDocuments({ farmerId: id, status: 'RESOLVED' })
        ]);

        // Get recent violations
        const recentViolations = await RegulatorAlert.find({
            farmerId: id,
            alertType: 'MRL_VIOLATION'
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Calculate compliance metrics
        const complianceRate = totalAlerts === 0 ? 100 : Math.round((resolvedAlerts / totalAlerts) * 100);
        const activeViolations = totalAlerts - resolvedAlerts;

        res.status(200).json({
            success: true,
            data: {
                complianceMetrics: {
                    complianceRate,
                    totalAlerts,
                    resolvedAlerts,
                    activeViolations
                },
                breakdown: {
                    byType: alertsByType,
                    bySeverity: alertsBySeverity,
                    byStatus: alertsByStatus
                },
                recentViolations
            }
        });
    } catch (error) {
        console.error('Error in getFarmCompliance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch farm compliance data',
            error: error.message
        });
    }
};

/**
 * @desc    Get medicated feed batches for a farm
 * @route   GET /api/regulator/farms/:id/feed-batches
 * @access  Private (Regulator)
 */
export const getFarmFeedBatches = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, page = 1, limit = 50 } = req.query;

        // Verify farm exists
        const farm = await Farmer.findById(id);
        if (!farm) {
            return res.status(404).json({
                success: false,
                message: 'Farm not found'
            });
        }

        // Build query
        const query = { farmerId: id };
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [feedBatches, totalBatches] = await Promise.all([
            FeedAdministration.find(query)
                .populate('feedId', 'feedName antimicrobialName antimicrobialConcentration withdrawalPeriodDays isMedicated')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ administrationDate: -1 })
                .lean(),
            FeedAdministration.countDocuments(query)
        ]);

        // For each batch, get animal details
        const batchesWithAnimals = await Promise.all(feedBatches.map(async (batch) => {
            const animals = await Animal.find({
                farmerId: id,
                tagId: { $in: batch.animalIds }
            }).select('tagId name species mrlStatus').lean();

            return {
                ...batch,
                animals
            };
        }));

        res.status(200).json({
            success: true,
            data: batchesWithAnimals,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalBatches / parseInt(limit)),
                totalItems: totalBatches,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error in getFarmFeedBatches:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch farm feed batches',
            error: error.message
        });
    }
};
