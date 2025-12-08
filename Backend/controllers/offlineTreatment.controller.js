// Backend/controllers/offlineTreatment.controller.js
// Controller for offline treatment records (non-registered farmers)

import OfflineTreatment from '../models/offlineTreatment.model.js';
import Veterinarian from '../models/vet.model.js';
import sendEmail from '../utils/sendEmail.js';
import { createAuditLog } from '../services/auditLog.service.js';
import { generateOfflinePrescriptionPDF } from '../utils/generateOfflinePrescriptionPDF.js';

/**
 * @desc    Create new offline treatment record
 * @route   POST /api/vet/offline-treatments
 * @access  Private (Vet)
 */
export const createOfflineTreatment = async (req, res) => {
    try {
        const vetId = req.user._id;
        const {
            farmerName,
            farmerPhone,
            farmerAddress,
            farmName,
            animalTagId,
            animalSpecies,
            animalBreed,
            animalAge,
            animalWeight,
            diagnosis,
            symptoms,
            treatmentDate,
            prescriptions,
            generalNotes,
            followUpDate,
            totalCost
        } = req.body;

        // Get vet details
        const vet = await Veterinarian.findById(vetId).select('fullName email');
        if (!vet) {
            return res.status(404).json({ message: 'Veterinarian not found' });
        }

        // Create offline treatment record
        const offlineTreatment = await OfflineTreatment.create({
            vetId,
            vetEmail: vet.email,
            vetName: vet.fullName,
            farmerName,
            farmerPhone,
            farmerAddress,
            farmName,
            animalTagId,
            animalSpecies,
            animalBreed,
            animalAge,
            animalWeight,
            diagnosis,
            symptoms,
            treatmentDate: treatmentDate || new Date(),
            prescriptions,
            generalNotes,
            followUpDate,
            totalCost
        });

        // Create audit log for blockchain tracking
        await createAuditLog({
            eventType: 'CREATE',
            entityType: 'OfflineTreatment',
            entityId: offlineTreatment._id,
            farmerId: vetId, // Use vetId as reference for offline treatments
            performedBy: vetId,
            performedByRole: 'Veterinarian',
            performedByModel: 'Veterinarian',
            dataSnapshot: {
                farmerName: offlineTreatment.farmerName,
                animalSpecies: offlineTreatment.animalSpecies,
                diagnosis: offlineTreatment.diagnosis,
                prescriptionCount: offlineTreatment.prescriptions.length,
                treatmentDate: offlineTreatment.treatmentDate,
                recordId: offlineTreatment._id.toString()
            },
            metadata: {
                source: 'offline_treatment',
                farmerPhone: farmerPhone,
                animalTagId: animalTagId
            }
        });

        // Generate PDF and send email to vet with prescription attachment
        if (vet.email) {
            try {
                // Generate PDF prescription
                const pdfBuffer = await generateOfflinePrescriptionPDF({
                    recordId: offlineTreatment._id.toString(),
                    vetName: vet.fullName,
                    treatmentDate: new Date(offlineTreatment.treatmentDate).toLocaleDateString(),
                    farmerName: offlineTreatment.farmerName,
                    farmerPhone: offlineTreatment.farmerPhone,
                    farmerAddress: offlineTreatment.farmerAddress,
                    farmName: offlineTreatment.farmName,
                    animalTagId: offlineTreatment.animalTagId,
                    animalSpecies: offlineTreatment.animalSpecies,
                    animalBreed: offlineTreatment.animalBreed,
                    animalAge: offlineTreatment.animalAge,
                    animalWeight: offlineTreatment.animalWeight,
                    diagnosis: offlineTreatment.diagnosis,
                    symptoms: offlineTreatment.symptoms,
                    prescriptions: offlineTreatment.prescriptions,
                    generalNotes: offlineTreatment.generalNotes,
                    followUpDate: followUpDate ? new Date(followUpDate).toLocaleDateString() : null
                });

                // Send email with PDF attachment
                const emailResult = await sendEmail({
                    to: vet.email,
                    subject: `Prescription Record - ${farmerName} - ${new Date(offlineTreatment.treatmentDate).toLocaleDateString()}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #10b981;">Prescription Record</h2>
                            <p>Dear Dr. ${vet.fullName},</p>
                            <p>Please find attached the prescription record for your offline treatment.</p>
                            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0;"><strong>Farmer:</strong> ${farmerName}</p>
                                <p style="margin: 5px 0 0 0;"><strong>Animal:</strong> ${offlineTreatment.animalSpecies}</p>
                                <p style="margin: 5px 0 0 0;"><strong>Diagnosis:</strong> ${offlineTreatment.diagnosis}</p>
                                <p style="margin: 5px 0 0 0;"><strong>Date:</strong> ${new Date(offlineTreatment.treatmentDate).toLocaleDateString()}</p>
                            </div>
                            <p>The prescription has been saved to your records and is attached as a PDF for your reference.</p>
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                            <p style="font-size: 12px; color: #6b7280;">
                                <strong>Record ID:</strong> ${offlineTreatment._id.toString()}<br>
                                This is an automated email from LivestockIQ. The prescription has been logged to the blockchain for immutability.
                            </p>
                        </div>
                    `,
                    attachments: [
                        {
                            filename: `Prescription_${farmerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
                            content: pdfBuffer,
                            contentType: 'application/pdf'
                        }
                    ]
                });

                if (emailResult.success) {
                    offlineTreatment.emailSent = true;
                    offlineTreatment.emailSentAt = new Date();
                    await offlineTreatment.save();
                } else {
                    offlineTreatment.emailError = emailResult.error;
                    await offlineTreatment.save();
                }
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                offlineTreatment.emailError = emailError.message;
                await offlineTreatment.save();
            }
        }

        res.status(201).json({
            message: 'Offline treatment record created successfully',
            treatment: offlineTreatment,
            emailSent: offlineTreatment.emailSent
        });

    } catch (error) {
        console.error('Error creating offline treatment:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Get all offline treatments for logged-in vet
 * @route   GET /api/vet/offline-treatments
 * @access  Private (Vet)
 */
export const getMyOfflineTreatments = async (req, res) => {
    try {
        const vetId = req.user._id;
        const { page = 1, limit = 25, search, species, startDate, endDate } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query
        let query = { vetId };

        if (search) {
            query.$or = [
                { farmerName: { $regex: search, $options: 'i' } },
                { farmerPhone: { $regex: search, $options: 'i' } },
                { farmName: { $regex: search, $options: 'i' } },
                { animalTagId: { $regex: search, $options: 'i' } },
                { diagnosis: { $regex: search, $options: 'i' } }
            ];
        }

        if (species && species !== 'all') {
            query.animalSpecies = species;
        }

        if (startDate && endDate) {
            query.treatmentDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const [treatments, totalCount] = await Promise.all([
            OfflineTreatment.find(query)
                .sort({ treatmentDate: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            OfflineTreatment.countDocuments(query)
        ]);

        res.json({
            data: treatments,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching offline treatments:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Get specific offline treatment by ID
 * @route   GET /api/vet/offline-treatments/:id
 * @access  Private (Vet)
 */
export const getOfflineTreatmentById = async (req, res) => {
    try {
        const vetId = req.user._id;
        const { id } = req.params;

        const treatment = await OfflineTreatment.findOne({
            _id: id,
            vetId: vetId
        }).lean();

        if (!treatment) {
            return res.status(404).json({ message: 'Treatment record not found' });
        }

        res.json(treatment);

    } catch (error) {
        console.error('Error fetching offline treatment:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Update offline treatment
 * @route   PUT /api/vet/offline-treatments/:id
 * @access  Private (Vet)
 */
export const updateOfflineTreatment = async (req, res) => {
    try {
        const vetId = req.user._id;
        const { id } = req.params;

        const treatment = await OfflineTreatment.findOne({
            _id: id,
            vetId: vetId
        });

        if (!treatment) {
            return res.status(404).json({ message: 'Treatment record not found' });
        }

        // Update fields
        const allowedUpdates = [
            'farmerPhone', 'farmerAddress', 'farmName',
            'animalBreed', 'animalAge', 'animalWeight',
            'symptoms', 'prescriptions', 'generalNotes',
            'followUpDate', 'totalCost'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                treatment[field] = req.body[field];
            }
        });

        await treatment.save();

        // Create audit log for update
        await createAuditLog({
            eventType: 'UPDATE',
            entityType: 'OfflineTreatment',
            entityId: treatment._id,
            farmerId: vetId,
            performedBy: vetId,
            performedByRole: 'Veterinarian',
            performedByModel: 'Veterinarian',
            dataSnapshot: {
                farmerName: treatment.farmerName,
                diagnosis: treatment.diagnosis,
                prescriptionCount: treatment.prescriptions.length
            },
            changes: req.body
        });

        res.json({
            message: 'Treatment record updated successfully',
            treatment
        });

    } catch (error) {
        console.error('Error updating offline treatment:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Delete offline treatment
 * @route   DELETE /api/vet/offline-treatments/:id
 * @access  Private (Vet)
 */
export const deleteOfflineTreatment = async (req, res) => {
    try {
        const vetId = req.user._id;
        const { id } = req.params;

        const treatment = await OfflineTreatment.findOne({
            _id: id,
            vetId: vetId
        });

        if (!treatment) {
            return res.status(404).json({ message: 'Treatment record not found' });
        }

        // Create audit log before deletion
        await createAuditLog({
            eventType: 'DELETE',
            entityType: 'OfflineTreatment',
            entityId: treatment._id,
            farmerId: vetId,
            performedBy: vetId,
            performedByRole: 'Veterinarian',
            performedByModel: 'Veterinarian',
            dataSnapshot: {
                farmerName: treatment.farmerName,
                diagnosis: treatment.diagnosis,
                treatmentDate: treatment.treatmentDate
            }
        });

        await treatment.deleteOne();

        res.json({ message: 'Treatment record deleted successfully' });

    } catch (error) {
        console.error('Error deleting offline treatment:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Resend prescription email
 * @route   POST /api/vet/offline-treatments/:id/resend-email
 * @access  Private (Vet)
 */
export const resendPrescriptionEmail = async (req, res) => {
    try {
        const vetId = req.user._id;
        const { id } = req.params;

        const treatment = await OfflineTreatment.findOne({
            _id: id,
            vetId: vetId
        });

        if (!treatment) {
            return res.status(404).json({ message: 'Treatment record not found' });
        }

        const vet = await Veterinarian.findById(vetId).select('email fullName');
        if (!vet || !vet.email) {
            return res.status(400).json({ message: 'Vet email not configured' });
        }

        const emailResult = await sendEmail({
            to: vet.email,
            subject: `Prescription Record (Resent) - ${treatment.farmerName} - ${new Date(treatment.treatmentDate).toLocaleDateString()}`,
            template: 'offlinePrescription',
            templateData: {
                recordId: treatment._id.toString(),
                vetName: vet.fullName,
                treatmentDate: new Date(treatment.treatmentDate).toLocaleDateString(),
                farmerName: treatment.farmerName,
                farmerPhone: treatment.farmerPhone,
                farmerAddress: treatment.farmerAddress,
                farmName: treatment.farmName,
                animalTagId: treatment.animalTagId,
                animalSpecies: treatment.animalSpecies,
                animalBreed: treatment.animalBreed,
                animalAge: treatment.animalAge,
                animalWeight: treatment.animalWeight,
                diagnosis: treatment.diagnosis,
                symptoms: treatment.symptoms,
                prescriptions: treatment.prescriptions,
                generalNotes: treatment.generalNotes,
                followUpDate: treatment.followUpDate ? new Date(treatment.followUpDate).toLocaleDateString() : null
            }
        });

        if (emailResult.success) {
            treatment.emailSent = true;
            treatment.emailSentAt = new Date();
            treatment.emailError = null;
            await treatment.save();

            res.json({ message: 'Email resent successfully' });
        } else {
            treatment.emailError = emailResult.error;
            await treatment.save();

            res.status(500).json({ message: 'Failed to send email', error: emailResult.error });
        }

    } catch (error) {
        console.error('Error resending email:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Get offline treatment statistics for vet dashboard
 * @route   GET /api/vet/offline-treatments/stats
 * @access  Private (Vet)
 */
export const getOfflineTreatmentStats = async (req, res) => {
    try {
        const vetId = req.user._id;

        const [
            totalTreatments,
            thisMonthTreatments,
            speciesBreakdown,
            recentTreatments
        ] = await Promise.all([
            OfflineTreatment.countDocuments({ vetId }),
            OfflineTreatment.countDocuments({
                vetId,
                treatmentDate: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }),
            OfflineTreatment.aggregate([
                { $match: { vetId: vetId } },
                { $group: { _id: '$animalSpecies', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            OfflineTreatment.find({ vetId })
                .sort({ treatmentDate: -1 })
                .limit(5)
                .select('farmerName animalSpecies diagnosis treatmentDate')
                .lean()
        ]);

        res.json({
            totalTreatments,
            thisMonthTreatments,
            speciesBreakdown: speciesBreakdown.map(s => ({
                species: s._id,
                count: s.count
            })),
            recentTreatments
        });

    } catch (error) {
        console.error('Error fetching offline treatment stats:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};
