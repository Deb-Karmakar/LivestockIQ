// backend/controllers/treatment.controller.js

import Treatment from '../models/treatment.model.js';
import Veterinarian from '../models/vet.model.js';
import Farmer from '../models/farmer.model.js';
import sendEmail from '../utils/sendEmail.js';
import { generateTreatmentPdfBuffer } from '../utils/createTreatmentPdf.js';
// NEW: Import the prescription model and PDF generator
import Prescription from '../models/prescription.model.js';
import { generatePrescriptionPdfBuffer } from '../utils/createPrescriptionPdf.js';
// NEW: Import the Animal model to get animal details for the PDF
import Animal from '../models/animal.model.js';


// @desc    Add a new treatment
// @route   POST /api/treatments
export const addTreatment = async (req, res) => {
    // ... (This function remains unchanged)
    try {
        const farmerId = req.user._id;
        const treatmentData = { ...req.body, farmerId };
        const treatment = await Treatment.create(treatmentData);

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
    // ... (This function remains unchanged)
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
    // --- NEW DEBUG LOG ---
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

        if (req.body.status === 'Approved') {
            req.body.vetSigned = true;
        }

        const updatedTreatment = await Treatment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        console.log(`[DEBUG] ✅ Step 3: Treatment status updated to: ${updatedTreatment.status}`);

        // --- PRESCRIPTION LOGIC ---
        if (updatedTreatment && updatedTreatment.status === 'Approved') {
            console.log('[DEBUG] ✅ Entering prescription generation block...');

            const vet = await Veterinarian.findById(req.user._id);
            console.log(`[DEBUG] Found Vet: ${vet.fullName}`);

            // THIS IS THE MOST LIKELY POINT OF FAILURE
            const animal = await Animal.findOne({ tagId: updatedTreatment.animalId });
            if (!animal) {
                console.log(`[DEBUG] ❌ CRITICAL FAILURE: Could not find animal with tagId: ${updatedTreatment.animalId}`);
                console.log('--- VET UPDATE PROCESS ENDED (Animal not found) ---');
                return res.json(updatedTreatment); // Return success, but stop before emailing
            }
            console.log(`[DEBUG] ✅ Found Animal with species: ${animal.species}`);

            await Prescription.create({
                treatmentId: updatedTreatment._id,
                farmerId: farmer._id,
                vetId: vet._id,
            });
            console.log('[DEBUG] ✅ Step 4: Prescription record created in DB.');

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