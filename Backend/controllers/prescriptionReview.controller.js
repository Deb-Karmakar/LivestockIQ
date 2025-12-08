// Backend/controllers/prescriptionReview.controller.js

import Prescription from '../models/prescription.model.js';
import Veterinarian from '../models/vet.model.js';
import Farmer from '../models/farmer.model.js';
import Animal from '../models/animal.model.js';
import OfflineTreatment from '../models/offlineTreatment.model.js';

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

        // Build query for regular prescriptions
        const prescriptionQuery = {};

        if (search) {
            prescriptionQuery.$or = [
                { drugName: { $regex: search, $options: 'i' } },
                { diagnosis: { $regex: search, $options: 'i' } }
            ];
        }
        if (vetId) prescriptionQuery.vetId = vetId;
        if (farmId) prescriptionQuery.farmerId = farmId;
        if (drugName) prescriptionQuery.drugName = { $regex: drugName, $options: 'i' };
        if (startDate || endDate) {
            prescriptionQuery.createdAt = {};
            if (startDate) prescriptionQuery.createdAt.$gte = new Date(startDate);
            if (endDate) prescriptionQuery.createdAt.$lte = new Date(endDate);
        }

        // Build query for offline treatments
        const offlineQuery = {};
        if (search) {
            offlineQuery.$or = [
                { farmerName: { $regex: search, $options: 'i' } },
                { diagnosis: { $regex: search, $options: 'i' } },
                { 'prescriptions.drugName': { $regex: search, $options: 'i' } }
            ];
        }
        if (vetId) offlineQuery.vetId = vetId;
        if (drugName) offlineQuery['prescriptions.drugName'] = { $regex: drugName, $options: 'i' };
        if (startDate || endDate) {
            offlineQuery.treatmentDate = {};
            if (startDate) offlineQuery.treatmentDate.$gte = new Date(startDate);
            if (endDate) offlineQuery.treatmentDate.$lte = new Date(endDate);
        }

        // Fetch both regular prescriptions and offline treatments
        const [prescriptions, offlineTreatments, totalPrescriptions, totalOffline] = await Promise.all([
            Prescription.find(prescriptionQuery)
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
                .sort({ createdAt: -1 })
                .lean(),
            OfflineTreatment.find(offlineQuery)
                .sort({ treatmentDate: -1 })
                .lean(),
            Prescription.countDocuments(prescriptionQuery),
            OfflineTreatment.countDocuments(offlineQuery)
        ]);

        // Map regular prescriptions
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
                const animalIds = p.feedAdministrationId.animalIds || [];
                const display = animalIds.length > 5
                    ? `${animalIds.slice(0, 5).join(', ')}... (+${animalIds.length - 5} more)`
                    : animalIds.join(', ');
                animalId = { tagId: display };
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
                digitalSignature,
                isOffline: false
            };
        });

        // Map offline treatments to prescription format
        const mappedOfflineTreatments = offlineTreatments.map(ot => {
            const drugNames = ot.prescriptions.map(p => p.drugName).join(', ');

            return {
                _id: ot._id,
                vetId: { _id: ot.vetId, fullName: ot.vetName, email: ot.vetEmail },
                farmerId: { farmName: ot.farmName || 'N/A', farmOwner: ot.farmerName },
                drugName: drugNames || 'Multiple Drugs',
                animalId: { tagId: ot.animalTagId || `${ot.animalSpecies} (Offline)` },
                diagnosis: ot.diagnosis,
                createdAt: ot.treatmentDate,
                digitalSignature: null,
                isOffline: true,
                offlineData: {
                    farmerName: ot.farmerName,
                    farmerPhone: ot.farmerPhone,
                    animalSpecies: ot.animalSpecies,
                    prescriptionCount: ot.prescriptions.length,
                    emailSent: ot.emailSent
                }
            };
        });

        // Merge and sort all records
        const allRecords = [...mappedPrescriptions, ...mappedOfflineTreatments]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Apply pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginatedRecords = allRecords.slice(skip, skip + parseInt(limit));
        const totalRecords = totalPrescriptions + totalOffline;

        res.status(200).json({
            success: true,
            data: paginatedRecords,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalRecords / parseInt(limit)),
                totalItems: totalRecords,
                itemsPerPage: parseInt(limit),
                breakdown: {
                    regularPrescriptions: totalPrescriptions,
                    offlineTreatments: totalOffline
                }
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

        // First try to find in regular prescriptions
        let prescription = await Prescription.findById(id)
            .populate('vetId', 'fullName licenseNumber email phoneNumber university degree cryptoKeys.publicKey')
            .populate('farmerId', 'farmName farmOwner email phoneNumber location')
            .populate({
                path: 'treatmentId',
                select: 'drugName animalId vetSigned updatedAt dose route notes drugClass status'
            })
            .populate({
                path: 'feedAdministrationId',
                populate: { path: 'feedId', select: 'antimicrobialName antimicrobialConcentration unit' }
            })
            .lean();

        if (prescription) {
            // Handle regular prescription
            let signatureVerification = null;

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

            let mappedPrescription = { ...prescription, signatureVerification };

            if (prescription.treatmentId) {
                mappedPrescription.drugName = prescription.treatmentId.drugName;
                mappedPrescription.animalId = { tagId: prescription.treatmentId.animalId };
                mappedPrescription.dosage = prescription.treatmentId.dose || 'N/A';
                mappedPrescription.dosageUnit = prescription.treatmentId.route || '';
                mappedPrescription.diagnosis = prescription.treatmentId.drugClass || 'Treatment';
                mappedPrescription.instructions = prescription.treatmentId.notes || 'No additional instructions';
            } else if (prescription.feedAdministrationId) {
                mappedPrescription.drugName = prescription.feedAdministrationId.feedId?.antimicrobialName;
                const animalIds = prescription.feedAdministrationId.animalIds || [];
                mappedPrescription.animalId = { tagId: animalIds.join(', ') };
                mappedPrescription.dosage = prescription.feedAdministrationId.antimicrobialDoseTotal;
                mappedPrescription.dosageUnit = 'mg (Total)';
                mappedPrescription.diagnosis = 'Feed Medication';
                mappedPrescription.instructions = prescription.feedAdministrationId.notes || 'No additional instructions';
            } else {
                mappedPrescription.dosage = 'N/A';
                mappedPrescription.dosageUnit = '';
                mappedPrescription.diagnosis = 'N/A';
                mappedPrescription.instructions = 'No additional instructions';
            }

            mappedPrescription.isOffline = false;

            return res.status(200).json({
                success: true,
                data: mappedPrescription
            });
        }

        // If not found in prescriptions, try offline treatments
        const offlineTreatment = await OfflineTreatment.findById(id).lean();

        if (!offlineTreatment) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }

        // Map offline treatment to prescription detail format
        const mappedOffline = {
            _id: offlineTreatment._id,
            vetId: {
                _id: offlineTreatment.vetId,
                fullName: offlineTreatment.vetName,
                email: offlineTreatment.vetEmail,
                licenseNumber: 'N/A',
                cryptoKeys: { publicKey: null }
            },
            farmerId: {
                farmName: offlineTreatment.farmName || 'Offline Farm',
                farmOwner: offlineTreatment.farmerName,
                email: null,
                phoneNumber: offlineTreatment.farmerPhone,
                location: { address: offlineTreatment.farmerAddress }
            },
            drugName: offlineTreatment.prescriptions.map(p => p.drugName).join(', '),
            animalId: {
                tagId: offlineTreatment.animalTagId || `${offlineTreatment.animalSpecies} (Offline)`
            },
            diagnosis: offlineTreatment.diagnosis,
            dosage: 'See Prescriptions Below',
            dosageUnit: '',
            instructions: offlineTreatment.generalNotes || 'No additional instructions',
            createdAt: offlineTreatment.treatmentDate,
            signatureVerification: null,
            isOffline: true,
            offlineData: {
                farmerName: offlineTreatment.farmerName,
                farmerPhone: offlineTreatment.farmerPhone,
                farmerAddress: offlineTreatment.farmerAddress,
                farmName: offlineTreatment.farmName,
                animalSpecies: offlineTreatment.animalSpecies,
                animalBreed: offlineTreatment.animalBreed,
                animalAge: offlineTreatment.animalAge,
                animalWeight: offlineTreatment.animalWeight,
                symptoms: offlineTreatment.symptoms,
                prescriptions: offlineTreatment.prescriptions,
                followUpDate: offlineTreatment.followUpDate,
                totalCost: offlineTreatment.totalCost,
                emailSent: offlineTreatment.emailSent,
                emailSentAt: offlineTreatment.emailSentAt
            }
        };

        res.status(200).json({
            success: true,
            data: mappedOffline
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
