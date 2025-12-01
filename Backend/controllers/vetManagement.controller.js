// Backend/controllers/vetManagement.controller.js

import Veterinarian from '../models/vet.model.js';
import Farmer from '../models/farmer.model.js';
import Treatment from '../models/treatment.model.js';
import Prescription from '../models/prescription.model.js';
import RegulatorAlert from '../models/regulatorAlert.model.js';

/**
 * @desc    Get all veterinarians with statistics
 * @route   GET /api/regulator/vets
 * @access  Private (Regulator)
 */
export const getAllVets = async (req, res) => {
    try {
        const { search, specialization, status, page = 1, limit = 20 } = req.query;

        // Build query
        const query = {};
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { licenseNumber: { $regex: search, $options: 'i' } }
            ];
        }
        if (specialization) {
            query.specialization = { $regex: specialization, $options: 'i' };
        }
        if (status) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const vets = await Veterinarian.find(query)
            .select('-password -cryptoKeys.privateKey')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean();

        const totalVets = await Veterinarian.countDocuments(query);

        // Enhance each vet with statistics
        const vetsWithStats = await Promise.all(vets.map(async (vet) => {
            const [farmsSupervised, totalPrescriptions, totalTreatments, alerts] = await Promise.all([
                Farmer.countDocuments({ vetId: vet.vetId }),
                Prescription.countDocuments({ vetId: vet._id }),
                Treatment.countDocuments({ vetId: vet._id, status: 'Approved' }),
                RegulatorAlert.countDocuments({
                    vetId: vet._id,
                    status: { $ne: 'Resolved' }
                })
            ]);

            // Calculate compliance rate based on alerts
            const totalAlerts = await RegulatorAlert.countDocuments({ vetId: vet._id });
            const complianceRate = totalAlerts === 0 ? 100 :
                Math.max(0, 100 - (alerts / Math.max(totalAlerts, 1)) * 100);

            return {
                ...vet,
                statistics: {
                    farmsSupervised,
                    totalPrescriptions,
                    totalTreatments,
                    activeAlerts: alerts,
                    complianceRate: Math.round(complianceRate)
                }
            };
        }));

        res.status(200).json({
            success: true,
            data: vetsWithStats,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalVets / parseInt(limit)),
                totalItems: totalVets,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error in getAllVets:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch veterinarians',
            error: error.message
        });
    }
};

/**
 * @desc    Get detailed veterinarian information
 * @route   GET /api/regulator/vets/:id
 * @access  Private (Regulator)
 */
export const getVetDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const vet = await Veterinarian.findById(id)
            .select('-password -cryptoKeys.privateKey')
            .lean();

        if (!vet) {
            return res.status(404).json({
                success: false,
                message: 'Veterinarian not found'
            });
        }

        // Get comprehensive statistics
        const [
            farmsSupervised,
            totalPrescriptions,
            totalTreatments,
            approvedTreatments,
            rejectedTreatments,
            totalAlerts,
            activeAlerts,
            recentPrescriptions,
            drugUsageStats
        ] = await Promise.all([
            Farmer.countDocuments({ vetId: vet.vetId }),
            Prescription.countDocuments({ vetId: id }),
            Treatment.countDocuments({ vetId: id }),
            Treatment.countDocuments({ vetId: id, status: 'Approved' }),
            Treatment.countDocuments({ vetId: id, status: 'Rejected' }),
            RegulatorAlert.countDocuments({ vetId: id }),
            RegulatorAlert.countDocuments({ vetId: id, status: { $ne: 'Resolved' } }),
            Prescription.find({ vetId: id })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('farmerId', 'farmName farmOwner')
                .lean(),
            Treatment.aggregate([
                { $match: { vetId: vet._id, status: 'Approved' } },
                {
                    $group: {
                        _id: '$drugType',
                        count: { $sum: 1 },
                        totalDoses: { $sum: '$dosageAmount' }
                    }
                }
            ])
        ]);

        const complianceRate = totalAlerts === 0 ? 100 :
            Math.max(0, 100 - (activeAlerts / totalAlerts) * 100);

        res.status(200).json({
            success: true,
            data: {
                vet,
                statistics: {
                    farms: farmsSupervised,
                    prescriptions: {
                        total: totalPrescriptions
                    },
                    treatments: {
                        total: totalTreatments,
                        approved: approvedTreatments,
                        rejected: rejectedTreatments,
                        approvalRate: totalTreatments > 0 ?
                            Math.round((approvedTreatments / totalTreatments) * 100) : 0
                    },
                    alerts: {
                        total: totalAlerts,
                        active: activeAlerts
                    },
                    complianceRate: Math.round(complianceRate),
                    drugUsage: drugUsageStats
                },
                recentPrescriptions
            }
        });
    } catch (error) {
        console.error('Error in getVetDetails:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch veterinarian details',
            error: error.message
        });
    }
};

/**
 * @desc    Get farms supervised by a veterinarian
 * @route   GET /api/regulator/vets/:id/farms
 * @access  Private (Regulator)
 */
export const getVetFarms = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;

        // Verify vet exists
        const vet = await Veterinarian.findById(id);
        if (!vet) {
            return res.status(404).json({
                success: false,
                message: 'Veterinarian not found'
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [farms, totalFarms] = await Promise.all([
            Farmer.find({ vetId: vet.vetId })
                .select('-password')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ farmName: 1 })
                .lean(),
            Farmer.countDocuments({ vetId: vet.vetId })
        ]);

        // Enhance farms with basic stats
        const farmsWithStats = await Promise.all(farms.map(async (farm) => {
            const [totalAnimals, activeTreatments] = await Promise.all([
                Animal.countDocuments({ farmerId: farm._id, status: 'Active' }),
                Treatment.countDocuments({
                    farmerId: farm._id,
                    status: { $in: ['Pending', 'Approved'] }
                })
            ]);

            return {
                ...farm,
                statistics: {
                    totalAnimals,
                    activeTreatments
                }
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
        console.error('Error in getVetFarms:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vet farms',
            error: error.message
        });
    }
};

/**
 * @desc    Get prescriptions issued by a veterinarian
 * @route   GET /api/regulator/vets/:id/prescriptions
 * @access  Private (Regulator)
 */
export const getVetPrescriptions = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate, page = 1, limit = 50 } = req.query;

        // Verify vet exists
        const vet = await Veterinarian.findById(id);
        if (!vet) {
            return res.status(404).json({
                success: false,
                message: 'Veterinarian not found'
            });
        }

        // Build query
        const query = { vetId: id };
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [prescriptions, totalPrescriptions] = await Promise.all([
            Prescription.find(query)
                .populate('farmerId', 'farmName farmOwner')
                .populate('animalId', 'tagId name species')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .lean(),
            Prescription.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: prescriptions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalPrescriptions / parseInt(limit)),
                totalItems: totalPrescriptions,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error in getVetPrescriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vet prescriptions',
            error: error.message
        });
    }
};

/**
 * @desc    Get compliance metrics for a veterinarian
 * @route   GET /api/regulator/vets/:id/compliance
 * @access  Private (Regulator)
 */
export const getVetCompliance = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify vet exists
        const vet = await Veterinarian.findById(id);
        if (!vet) {
            return res.status(404).json({
                success: false,
                message: 'Veterinarian not found'
            });
        }

        // Get alerts breakdown
        const [alertsByType, alertsBySeverity, totalAlerts, resolvedAlerts] = await Promise.all([
            RegulatorAlert.aggregate([
                { $match: { vetId: vet._id } },
                { $group: { _id: '$alertType', count: { $sum: 1 } } }
            ]),
            RegulatorAlert.aggregate([
                { $match: { vetId: vet._id } },
                { $group: { _id: '$severity', count: { $sum: 1 } } }
            ]),
            RegulatorAlert.countDocuments({ vetId: id }),
            RegulatorAlert.countDocuments({ vetId: id, status: 'Resolved' })
        ]);

        // Get recent alerts
        const recentAlerts = await RegulatorAlert.find({ vetId: id })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('farmerId', 'farmName farmOwner')
            .lean();

        const complianceRate = totalAlerts === 0 ? 100 :
            Math.round((resolvedAlerts / totalAlerts) * 100);

        res.status(200).json({
            success: true,
            data: {
                complianceMetrics: {
                    complianceRate,
                    totalAlerts,
                    resolvedAlerts,
                    activeAlerts: totalAlerts - resolvedAlerts
                },
                breakdown: {
                    byType: alertsByType,
                    bySeverity: alertsBySeverity
                },
                recentAlerts
            }
        });
    } catch (error) {
        console.error('Error in getVetCompliance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vet compliance data',
            error: error.message
        });
    }
};
