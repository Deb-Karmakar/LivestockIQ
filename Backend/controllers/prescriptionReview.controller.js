// Backend/controllers/prescriptionReview.controller.js

import Prescription from '../models/prescription.model.js';
import Veterinarian from '../models/vet.model.js';
import Farmer from '../models/farmer.model.js';
import Animal from '../models/animal.model.js';

/**
 * @desc    Get all prescriptions with filtering
 * @route   GET /api/regulator/prescriptions
 * @access  Private (Regulator)
 */
export const getAllPrescriptions = async (req, res) => {
    try {
        const {
            search,
            vetId,
            farmId,
            drugName,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        // Build query
        const query = {};

        if (search) {
            query.$or = [
                { drugName: { $regex: search, $options: 'i' } },
                { diagnosis: { $regex: search, $options: 'i' } }
            ];
        }
        if (vetId) query.vetId = vetId;
        if (farmId) query.farmerId = farmId;
        if (drugName) query.drugName = { $regex: drugName, $options: 'i' };
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [prescriptions, totalPrescriptions] = await Promise.all([
            Prescription.find(query)
                .populate('vetId', 'fullName licenseNumber email')
                .populate('farmerId', 'farmName farmOwner email')
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
        console.error('Error in getAllPrescriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch prescriptions',
            error: error.message
        });
    }
};

/**
 * @desc    Get detailed prescription information
 * @route   GET /api/regulator/prescriptions/:id
 * @access  Private (Regulator)
 */
export const getPrescriptionDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const prescription = await Prescription.findById(id)
            .populate('vetId', 'fullName licenseNumber email phoneNumber university degree cryptoKeys.publicKey')
            .populate('farmerId', 'farmName farmOwner email phoneNumber location')
            .lean();

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }

        // Check if digital signature exists and is valid
        let signatureVerification = null;
        if (prescription.digitalSignature && prescription.vetId?.cryptoKeys?.publicKey) {
            signatureVerification = {
                hasSignature: true,
                hasPublicKey: true,
                signedBy: prescription.vetId.fullName,
                signedAt: prescription.digitalSignature.signedAt,
                signature: prescription.digitalSignature.signature
            };
        }

        res.status(200).json({
            success: true,
            data: {
                ...prescription,
                signatureVerification
            }
        });
    } catch (error) {
        console.error('Error in getPrescriptionDetails:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch prescription details',
            error: error.message
        });
    }
};

/**
 * @desc    Get prescription statistics
 * @route   GET /api/regulator/prescriptions/stats
 * @access  Private (Regulator)
 */
export const getPrescriptionStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        const [
            totalPrescriptions,
            prescriptionsByDrug,
            prescriptionsByVet,
            prescriptionsByMonth,
            withSignatures,
            topDrugs
        ] = await Promise.all([
            Prescription.countDocuments(dateFilter),
            Prescription.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: '$drugType',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]),
            Prescription.aggregate([
                { $match: dateFilter },
                {
                    $lookup: {
                        from: 'veterinarians',
                        localField: 'vetId',
                        foreignField: '_id',
                        as: 'vet'
                    }
                },
                { $unwind: '$vet' },
                {
                    $group: {
                        _id: '$vetId',
                        count: { $sum: 1 },
                        vetName: { $first: '$vet.fullName' },
                        licenseNumber: { $first: '$vet.licenseNumber' }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            Prescription.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
                { $limit: 12 }
            ]),
            Prescription.countDocuments({
                ...dateFilter,
                'digitalSignature.signature': { $exists: true, $ne: null }
            }),
            Prescription.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: '$drugName',
                        count: { $sum: 1 },
                        totalDosage: { $sum: '$dosage' }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ])
        ]);

        // Format monthly data for charts
        const monthlyData = prescriptionsByMonth.map(item => ({
            month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
            count: item.count
        }));

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    total: totalPrescriptions,
                    withDigitalSignatures: withSignatures,
                    signatureRate: totalPrescriptions > 0 ?
                        Math.round((withSignatures / totalPrescriptions) * 100) : 0
                },
                breakdown: {
                    byDrugType: prescriptionsByDrug,
                    byVet: prescriptionsByVet,
                    byMonth: monthlyData,
                    topDrugs
                }
            }
        });
    } catch (error) {
        console.error('Error in getPrescriptionStats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch prescription statistics',
            error: error.message
        });
    }
};
