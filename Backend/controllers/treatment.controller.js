// backend/controllers/treatment.controller.js

import Treatment from '../models/treatment.model.js';
import Veterinarian from '../models/vet.model.js';
import Farmer from '../models/farmer.model.js';
import sendEmail from '../utils/sendEmail.js';
import { generateTreatmentPdfBuffer } from '../utils/createTreatmentPdf.js';
import Prescription from '../models/prescription.model.js';
import { generatePrescriptionPdfBuffer } from '../utils/createPrescriptionPdf.js';
import Animal from '../models/animal.model.js';
import { createAuditLog } from '../services/auditLog.service.js';


// @desc    Add a new treatment
// @route   POST /api/treatments
export const addTreatment = async (req, res) => {
    try {
        const farmerId = req.user._id;
        const treatmentData = { ...req.body, farmerId };

        // First, validate that the animal exists and check its MRL status
        const animal = await Animal.findOne({ tagId: req.body.animalId, farmerId });
        if (!animal) {
            return res.status(404).json({ message: 'Animal not found or does not belong to you' });
        }

        // Import and check MRL status
        const { calculateAnimalMRLStatus } = await import('../utils/mrlStatusCalculator.js');
        const mrlStatus = await calculateAnimalMRLStatus(animal, farmerId);

        // Only SAFE and NEW animals can receive treatments
        if (mrlStatus.mrlStatus && !['SAFE', 'NEW'].includes(mrlStatus.mrlStatus)) {
            return res.status(400).json({
                message: `Cannot add treatment: Animal has MRL status "${mrlStatus.mrlStatus}"`,
                reason: mrlStatus.statusMessage
            });
        }

        const treatment = await Treatment.create(treatmentData);

        // Create audit log for treatment creation
        await createAuditLog({
            eventType: 'CREATE',
            entityType: 'Treatment',
            entityId: treatment._id,
            farmerId: farmerId,
            performedBy: req.user._id,
            performedByRole: 'Farmer',
            performedByModel: 'Farmer',
            dataSnapshot: treatment.toObject(),
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                notes: `Treatment for animal ${treatment.animalId}`,
            },
        });

        // Clear the "New" tag when animal receives first treatment
        await Animal.findOneAndUpdate(
            { tagId: treatment.animalId, farmerId: req.user._id, isNew: true },
            { isNew: false }
        );

        if (treatment && treatment.vetId) {
            const vet = await Veterinarian.findOne({ vetId: treatment.vetId });
            const farmer = req.user;

            if (vet && vet.email && farmer) {
                const pdfBuffer = await generateTreatmentPdfBuffer(treatment, farmer, vet);
                const subject = `New Treatment Record (#${treatment.animalId}) for Verification from ${farmer.farmOwner}`;
                const html = `<p>Hello Dr. ${vet.fullName.split(' ').pop()},</p><p>A new treatment record from <strong>${farmer.farmOwner}</strong> requires your verification. The details are attached as a PDF.</p><p>Please log in to your LivestockIQ dashboard to review and sign this record.</p>`;

                await sendEmail({
                    to: vet.email,
                    subject: subject,
                    html: html,
                    attachments: [
                        {
                            filename: `TreatmentRecord_${treatment.animalId}.pdf`,
                            content: pdfBuffer,
                            contentType: 'application/pdf',
                        },
                    ],
                });
            }
        }

        res.status(201).json(treatment);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get all treatments for the logged-in farmer
// @route   GET /api/treatments
export const getMyTreatments = async (req, res) => {
    try {
        const treatments = await Treatment.find({ farmerId: req.user._id }).sort({ startDate: -1 });
        res.json(treatments);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};


// @desc    Update treatment by Vet (Approve/Reject)
// @route   PUT /api/treatments/:id/vet-update
export const updateTreatmentByVet = async (req, res) => {
    console.log(`\n--- VET UPDATE PROCESS STARTED for Treatment ID: ${req.params.id} ---`);
    try {
        const treatment = await Treatment.findById(req.params.id);
        if (!treatment) {
            console.log('[DEBUG] Step 1 FAILED: Treatment not found.');
            return res.status(404).json({ message: 'Treatment not found' });
        }
        console.log('[DEBUG] Step 1: Found treatment record.');

        const farmer = await Farmer.findById(treatment.farmerId);
        if (!farmer) {
            console.log('[DEBUG] Authorization FAILED: Farmer not found.');
            return res.status(404).json({ message: 'Farmer not found' });
        }

        // Debug logging for vetId comparison
        console.log(`[DEBUG] farmer.vetId: "${farmer.vetId}" (type: ${typeof farmer.vetId})`);
        console.log(`[DEBUG] req.user.vetId: "${req.user.vetId}" (type: ${typeof req.user.vetId})`);
        console.log(`[DEBUG] req.user._id: "${req.user._id}"`);

        // Check authorization - compare vetId strings OR check if vet owns the farmer
        const isAuthorized = (farmer.vetId && req.user.vetId && farmer.vetId === req.user.vetId) ||
            (farmer.vetId && req.user._id && farmer.vetId.toString() === req.user._id.toString());

        if (!isAuthorized) {
            console.log('[DEBUG] Authorization FAILED: VetId mismatch.');
            console.log(`[DEBUG] Comparison 1 (vetId strings): "${farmer.vetId}" === "${req.user.vetId}" = ${farmer.vetId === req.user.vetId}`);
            console.log(`[DEBUG] Comparison 2 (ObjectId): "${farmer.vetId}" === "${req.user._id}" = ${farmer.vetId?.toString() === req.user._id?.toString()}`);
            return res.status(401).json({ message: 'Not authorized to modify this treatment' });
        }
        console.log('[DEBUG] Step 2: Vet authorized.');

        // Store original state for audit trail
        const originalState = treatment.toObject();

        if (req.body.status === 'Approved') {
            req.body.vetSigned = true;
        }

        const updatedTreatment = await Treatment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        console.log(`[DEBUG] Step 3: Treatment status updated to: ${updatedTreatment.status}`);

        // Create audit log for vet approval/rejection with digital signature
        const eventType = req.body.status === 'Approved' ? 'APPROVE' : req.body.status === 'Rejected' ? 'REJECT' : 'UPDATE';

        // Generate digital signature for approval (if approved)
        let signature = null;
        let publicKey = null;

        if (req.body.status === 'Approved') {
            try {
                const { signTreatmentApproval, generateVetKeys } = await import('../services/digitalSignature.service.js');

                // Reload vet to get latest crypto keys
                const vet = await Veterinarian.findById(req.user._id);

                // Ensure vet has crypto keys
                if (!vet.cryptoKeys || !vet.cryptoKeys.privateKey) {
                    console.log('[DEBUG] Vet has no crypto keys, generating...');
                    await generateVetKeys(vet._id);
                    // Reload vet with keys
                    const updatedVet = await Veterinarian.findById(vet._id);
                    publicKey = updatedVet.cryptoKeys.publicKey;
                } else {
                    publicKey = vet.cryptoKeys.publicKey;
                }

                // Sign the approval
                signature = await signTreatmentApproval(updatedTreatment, req.user._id);
                console.log(`[DEBUG] Digital signature generated: ${signature.substring(0, 20)}...`);
            } catch (error) {
                console.error('[DEBUG] Failed to generate signature:', error.message);
                // Continue without signature - don't block the approval
            }
        }

        await createAuditLog({
            eventType,
            entityType: 'Treatment',
            entityId: updatedTreatment._id,
            farmerId: treatment.farmerId,
            performedBy: req.user._id,
            performedByRole: 'Vet',
            performedByModel: 'Veterinarian',
            dataSnapshot: updatedTreatment.toObject(),
            changes: {
                status: { from: originalState.status, to: updatedTreatment.status },
                vetSigned: { from: originalState.vetSigned, to: updatedTreatment.vetSigned },
                vetNotes: { from: originalState.vetNotes, to: updatedTreatment.vetNotes },
            },
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                notes: `Vet ${eventType.toLowerCase()}d treatment`,
                signature: signature, // Digital signature (if generated)
                publicKey: publicKey, // Store public key for verification
            },
        });

        // --- PRESCRIPTION LOGIC ---
        if (updatedTreatment && updatedTreatment.status === 'Approved') {
            console.log('[DEBUG] Entering prescription generation block...');

            const vet = await Veterinarian.findById(req.user._id);
            console.log(`[DEBUG] Found Vet: ${vet.fullName}`);

            const animal = await Animal.findOne({ tagId: updatedTreatment.animalId });
            if (!animal) {
                console.log(`[DEBUG] CRITICAL FAILURE: Could not find animal with tagId: ${updatedTreatment.animalId}`);
                console.log('--- VET UPDATE PROCESS ENDED (Animal not found) ---');
                return res.json(updatedTreatment);
            }
            console.log(`[DEBUG] Found Animal with species: ${animal.species}`);

            const prescription = await Prescription.create({
                treatmentId: updatedTreatment._id,
                farmerId: farmer._id,
                vetId: vet._id,
            });
            console.log('[DEBUG] Step 4: Prescription record created in DB.');

            // Create audit log for prescription creation
            await createAuditLog({
                eventType: 'CREATE',
                entityType: 'Prescription',
                entityId: prescription._id,
                farmerId: farmer._id,
                performedBy: req.user._id,
                performedByRole: 'Vet',
                performedByModel: 'Veterinarian',
                dataSnapshot: prescription.toObject(),
                metadata: {
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                    notes: `Prescription issued for treatment ${updatedTreatment._id}`,
                },
            });

            const pdfDataForFarmer = { ...updatedTreatment.toObject(), animal };
            const pdfBuffer = await generatePrescriptionPdfBuffer(pdfDataForFarmer, farmer, vet);
            console.log('[DEBUG] Step 5: PDF Buffer generated successfully.');

            const subject = `Prescription for Animal ID: ${updatedTreatment.animalId}`;
            const html = `<p>Hello ${farmer.farmOwner},</p><p>Dr. ${vet.fullName} has approved a treatment and issued a new prescription for your animal (ID: ${updatedTreatment.animalId}).</p><p>The official prescription is attached to this email as a PDF for your records.</p><p>Thank you for using LivestockIQ.</p>`;

            console.log(`[DEBUG] Step 6: Attempting to send email to: ${farmer.email}`);

            await sendEmail({
                to: farmer.email,
                subject: subject,
                html: html,
                attachments: [{
                    filename: `Prescription_${updatedTreatment.animalId}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                }],
            });

            console.log('[DEBUG] Step 7: Email sent successfully!');
        }
        // --- END OF LOGIC ---

        console.log('--- VET UPDATE PROCESS COMPLETED SUCCESSFULLY ---');
        res.json(updatedTreatment);

    } catch (error) {
        console.error('--- VET UPDATE PROCESS FAILED WITH AN ERROR ---');
        console.error(error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Add treatment by Vet (auto-approved, with withdrawal period)
// @route   POST /api/treatments/vet-entry
export const addTreatmentByVet = async (req, res) => {
    console.log(`\n--- VET TREATMENT ENTRY STARTED ---`);
    try {
        const {
            farmerId,
            animalId,
            drugName,
            drugClass,
            dose,
            route,
            withdrawalDays,
            withdrawalStartDate,
            notes
        } = req.body;

        // Validate required fields
        if (!farmerId || !animalId || !drugName || !withdrawalDays) {
            return res.status(400).json({
                message: 'Farmer, animal, drug name, and withdrawal period are required'
            });
        }

        // Get farmer and verify vet supervises them
        const farmer = await Farmer.findById(farmerId);
        if (!farmer) {
            return res.status(404).json({ message: 'Farmer not found' });
        }

        if (farmer.vetId !== req.user.vetId) {
            return res.status(403).json({ message: 'You are not authorized to treat this farmer\'s animals' });
        }

        // Verify animal belongs to this farmer
        const animal = await Animal.findOne({ tagId: animalId, farmerId });
        if (!animal) {
            return res.status(404).json({ message: 'Animal not found or does not belong to this farmer' });
        }

        // Calculate withdrawal end date
        const startDate = withdrawalStartDate ? new Date(withdrawalStartDate) : new Date();
        const withdrawalEndDate = new Date(startDate);
        withdrawalEndDate.setDate(withdrawalEndDate.getDate() + parseInt(withdrawalDays));

        // Create treatment (auto-approved since vet is entering)
        const treatment = await Treatment.create({
            farmerId,
            animalId,
            drugName,
            drugClass: drugClass || 'Unclassified',
            dose: dose || '',
            route: route || '',
            startDate,
            withdrawalEndDate,
            vetId: req.user.vetId,
            vetSigned: true,
            status: 'Approved', // Auto-approved
            notes: notes || '',
            vetNotes: `Treatment entered directly by veterinarian.`,
        });

        console.log(`[DEBUG] Treatment created by vet: ${treatment._id}`);

        // Create audit log
        const { createAuditLog } = await import('../services/auditLog.service.js');
        await createAuditLog({
            eventType: 'CREATE',
            entityType: 'Treatment',
            entityId: treatment._id,
            farmerId: farmerId,
            performedBy: req.user._id,
            performedByRole: 'Vet',
            performedByModel: 'Veterinarian',
            dataSnapshot: treatment.toObject(),
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                notes: `Vet-initiated treatment for animal ${animalId}`,
            },
        });

        // Create prescription
        const vet = await Veterinarian.findById(req.user._id);
        const prescription = await Prescription.create({
            treatmentId: treatment._id,
            farmerId: farmer._id,
            vetId: vet._id,
        });
        console.log(`[DEBUG] Prescription created: ${prescription._id}`);

        // Generate and send prescription PDF to farmer
        try {
            const pdfDataForFarmer = { ...treatment.toObject(), animal };
            const pdfBuffer = await generatePrescriptionPdfBuffer(pdfDataForFarmer, farmer, vet);

            const subject = `🔔 New Treatment & Withdrawal Period for Animal: ${animalId}`;
            const html = `
                <p>Hello ${farmer.farmOwner},</p>
                <p>Dr. ${vet.fullName} has administered a treatment and issued a prescription for your animal (ID: <strong>${animalId}</strong>).</p>
                <h3>Treatment Details:</h3>
                <ul>
                    <li><strong>Drug:</strong> ${drugName}</li>
                    <li><strong>Dose:</strong> ${dose || 'As prescribed'}</li>
                    <li><strong>Route:</strong> ${route || 'As administered'}</li>
                </ul>
                <h3>⚠️ Withdrawal Period Active</h3>
                <p>Your animal is now under a <strong>${withdrawalDays}-day withdrawal period</strong>.</p>
                <ul>
                    <li><strong>Start Date:</strong> ${startDate.toLocaleDateString()}</li>
                    <li><strong>End Date:</strong> ${withdrawalEndDate.toLocaleDateString()}</li>
                </ul>
                <p style="color: red;"><strong>Do not sell any products from this animal until the withdrawal period ends.</strong></p>
                <p>The official prescription is attached to this email.</p>
                <p>Thank you for using LivestockIQ.</p>
            `;

            await sendEmail({
                to: farmer.email,
                subject: subject,
                html: html,
                attachments: [{
                    filename: `Prescription_${animalId}_${Date.now()}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                }],
            });
            console.log(`[DEBUG] Prescription email sent to farmer: ${farmer.email}`);
        } catch (emailError) {
            console.error('[DEBUG] Failed to send prescription email:', emailError.message);
            // Don't fail the whole request if email fails
        }

        // Send WebSocket notification to farmer
        try {
            const { sendAlertToFarmer } = await import('../services/websocket.service.js');
            sendAlertToFarmer(farmerId, {
                type: 'WITHDRAWAL_ACTIVE',
                severity: 'warning',
                title: '⚠️ Withdrawal Period Started',
                message: `${drugName} treatment for ${animal.name || animalId}. Withdrawal ends ${withdrawalEndDate.toLocaleDateString()}.`,
                data: {
                    treatmentId: treatment._id,
                    animalId,
                    animalName: animal.name || animalId,
                    drugName,
                    withdrawalEndDate,
                    withdrawalDays: parseInt(withdrawalDays),
                },
                action: {
                    type: 'navigate',
                    url: '/farmer/animals'
                }
            });
        } catch (wsError) {
            console.error('[DEBUG] WebSocket notification failed:', wsError.message);
        }

        console.log('--- VET TREATMENT ENTRY COMPLETED SUCCESSFULLY ---');
        res.status(201).json({
            message: 'Treatment recorded successfully. Farmer has been notified.',
            treatment,
            prescription,
            withdrawalEndDate
        });

    } catch (error) {
        console.error('--- VET TREATMENT ENTRY FAILED ---');
        console.error(error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};