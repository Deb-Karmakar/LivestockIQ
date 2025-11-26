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
            console.log('[DEBUG] ❌ Step 1 FAILED: Treatment not found.');
            return res.status(404).json({ message: 'Treatment not found' });
        }
        console.log('[DEBUG] ✅ Step 1: Found treatment record.');

        const farmer = await Farmer.findById(treatment.farmerId);
        if (farmer.vetId !== req.user.vetId) {
            console.log('[DEBUG] ❌ Authorization FAILED.');
            return res.status(401).json({ message: 'Not authorized to modify this treatment' });
        }
        console.log('[DEBUG] ✅ Step 2: Vet authorized.');

        // Store original state for audit trail
        const originalState = treatment.toObject();

        if (req.body.status === 'Approved') {
            req.body.vetSigned = true;
        }

        const updatedTreatment = await Treatment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        console.log(`[DEBUG] ✅ Step 3: Treatment status updated to: ${updatedTreatment.status}`);

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
                    console.log('[DEBUG] ⚠️  Vet has no crypto keys, generating...');
                    await generateVetKeys(vet._id);
                    // Reload vet with keys
                    const updatedVet = await Veterinarian.findById(vet._id);
                    publicKey = updatedVet.cryptoKeys.publicKey;
                } else {
                    publicKey = vet.cryptoKeys.publicKey;
                }

                // Sign the approval
                signature = await signTreatmentApproval(updatedTreatment, req.user._id);
                console.log(`[DEBUG] ✅ Digital signature generated: ${signature.substring(0, 20)}...`);
            } catch (error) {
                console.error('[DEBUG] ⚠️  Failed to generate signature:', error.message);
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
            console.log('[DEBUG] ✅ Entering prescription generation block...');

            const vet = await Veterinarian.findById(req.user._id);
            console.log(`[DEBUG] Found Vet: ${vet.fullName}`);

            const animal = await Animal.findOne({ tagId: updatedTreatment.animalId });
            if (!animal) {
                console.log(`[DEBUG] ❌ CRITICAL FAILURE: Could not find animal with tagId: ${updatedTreatment.animalId}`);
                console.log('--- VET UPDATE PROCESS ENDED (Animal not found) ---');
                return res.json(updatedTreatment);
            }
            console.log(`[DEBUG] ✅ Found Animal with species: ${animal.species}`);

            const prescription = await Prescription.create({
                treatmentId: updatedTreatment._id,
                farmerId: farmer._id,
                vetId: vet._id,
            });
            console.log('[DEBUG] ✅ Step 4: Prescription record created in DB.');

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
            console.log('[DEBUG] ✅ Step 5: PDF Buffer generated successfully.');

            const subject = `Prescription for Animal ID: ${updatedTreatment.animalId}`;
            const html = `<p>Hello ${farmer.farmOwner},</p><p>Dr. ${vet.fullName} has approved a treatment and issued a new prescription for your animal (ID: ${updatedTreatment.animalId}).</p><p>The official prescription is attached to this email as a PDF for your records.</p><p>Thank you for using LivestockIQ.</p>`;

            console.log(`[DEBUG] 📧 Step 6: Attempting to send email to: ${farmer.email}`);

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

            console.log('[DEBUG] ✅ Step 7: Email sent successfully!');

        }
        // --- END OF LOGIC ---

        console.log('--- VET UPDATE PROCESS COMPLETED SUCCESSFULLY ---');
        res.json(updatedTreatment);

    } catch (error) {
        console.error('--- ❌ VET UPDATE PROCESS FAILED WITH AN ERROR ---');
        console.error(error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};