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
                .populate({
                    path: 'treatmentId',
                    select: 'drugName animalId vetSigned updatedAt'
                })
                .populate({
                    path: 'feedAdministrationId',
                    populate: { path: 'feedId', select: 'antimicrobialName' }
                })
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .lean(),
            Prescription.countDocuments(query)
        ]);

        // Map prescriptions to include treatment/feed details at top level
        const mappedPrescriptions = prescriptions.map(p => {
            let drugName = 'Unknown Drug';
            let animalId = null;
            let digitalSignature = p.digitalSignature;

            if (p.treatmentId) {
                drugName = p.treatmentId.drugName || p.drugName;
                animalId = p.treatmentId.animalId ? { tagId: p.treatmentId.animalId } : p.animalId;
                if (p.treatmentId.vetSigned) {
                    digitalSignature = {
                        signedAt: p.treatmentId.updatedAt,
                        hasSignature: true
                    };
                }
            } else if (p.feedAdministrationId) {
                drugName = p.feedAdministrationId.feedId?.antimicrobialName || 'Feed Medication';
                // For feed, show list of animal IDs or count if too many
                const animalIds = p.feedAdministrationId.animalIds || [];
                const display = animalIds.length > 5
                    ? `${animalIds.slice(0, 5).join(', ')}... (+${animalIds.length - 5} more)`
                    : animalIds.join(', ');
                animalId = { tagId: display };
                // Feed admins are vet approved by definition if they are here (mostly)
                if (p.feedAdministrationId.vetApproved) {
                    digitalSignature = {
                        signedAt: p.feedAdministrationId.vetApprovalDate,
                        hasSignature: true
                    };
                }
            } else {
                drugName = p.drugName;
                animalId = p.animalId;
            }

            return {
                ...p,
                drugName,
                animalId,
                digitalSignature
            };
        });

        res.status(200).json({
            success: true,
            data: mappedPrescriptions,
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
            .populate({
                path: 'treatmentId',
                select: 'drugName animalId vetSigned updatedAt dosage dosageUnit diagnosis instructions'
            })
            .populate({
                path: 'feedAdministrationId',
                populate: { path: 'feedId', select: 'antimicrobialName antimicrobialConcentration unit' }
            })
            .lean();

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }

        // Check if digital signature exists and is valid
        let signatureVerification = null;

        // Check either existing digitalSignature or treatment vetSigned status
        if (prescription.digitalSignature && prescription.vetId?.cryptoKeys?.publicKey) {
            signatureVerification = {
                hasSignature: true,
                hasPublicKey: true,
                signedBy: prescription.vetId.fullName,
                signedAt: prescription.digitalSignature.signedAt,
                signature: prescription.digitalSignature.signature
            };
        } else if (prescription.treatmentId?.vetSigned) {
            signatureVerification = {
                hasSignature: true,
                hasPublicKey: !!prescription.vetId?.cryptoKeys?.publicKey,
                signedBy: prescription.vetId?.fullName || 'Veterinarian',
                signedAt: prescription.treatmentId.updatedAt,
                signature: 'Verified via Treatment Record'
            };
        } else if (prescription.feedAdministrationId?.vetApproved) {
            signatureVerification = {
                hasSignature: true,
                hasPublicKey: !!prescription.vetId?.cryptoKeys?.publicKey,
                signedBy: prescription.vetId?.fullName || 'Veterinarian',
                signedAt: prescription.feedAdministrationId.vetApprovalDate,
                signature: 'Verified via Feed Approval'
            };
        }

        // Map details
        let mappedPrescription = { ...prescription, signatureVerification };

        if (prescription.treatmentId) {
            mappedPrescription.drugName = prescription.treatmentId.drugName;
            mappedPrescription.animalId = { tagId: prescription.treatmentId.animalId };
            mappedPrescription.dosage = prescription.treatmentId.dosage;
            mappedPrescription.dosageUnit = prescription.treatmentId.dosageUnit;
            mappedPrescription.diagnosis = prescription.treatmentId.diagnosis;
            mappedPrescription.instructions = prescription.treatmentId.instructions;
        } else if (prescription.feedAdministrationId) {
            mappedPrescription.drugName = prescription.feedAdministrationId.feedId?.antimicrobialName;
            const animalIds = prescription.feedAdministrationId.animalIds || [];
            // Show all animals in details view
            mappedPrescription.animalId = { tagId: animalIds.join(', ') };
            mappedPrescription.dosage = prescription.feedAdministrationId.antimicrobialDoseTotal;
            mappedPrescription.dosageUnit = 'mg (Total)';
            mappedPrescription.diagnosis = 'Feed Medication';
            mappedPrescription.instructions = prescription.feedAdministrationId.notes;
        }

        res.status(200).json({
            success: true,
            data: mappedPrescription
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
