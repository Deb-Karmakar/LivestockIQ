import Treatment from '../models/treatment.model.js';
import Veterinarian from '../models/vet.model.js';
import Farmer from '../models/farmer.model.js'; // Import Farmer model to get details
import sendEmail from '../utils/sendEmail.js';
import { generateTreatmentPdfBuffer } from '../utils/createTreatmentPdf.js'; // 1. Import the new PDF service

// @desc    Add a new treatment
// @route   POST /api/treatments
export const addTreatment = async (req, res) => {
    try {
        const farmerId = req.user._id;
        const treatmentData = { ...req.body, farmerId };
        const treatment = await Treatment.create(treatmentData);

        if (treatment && treatment.vetId) {
            const vet = await Veterinarian.findOne({ vetId: treatment.vetId });
            // The Farmer object is now attached to req.user by our middleware
            const farmer = req.user;

            if (vet && vet.email && farmer) {
                // 2. Generate the PDF buffer
                const pdfBuffer = await generateTreatmentPdfBuffer(treatment, farmer, vet);

                const subject = `New Treatment Record (#${treatment.animalId}) for Verification from ${farmer.farmOwner}`;
                const html = `<p>Hello Dr. ${vet.fullName.split(' ').pop()},</p><p>A new treatment record from <strong>${farmer.farmOwner}</strong> requires your verification. The details are attached as a PDF.</p><p>Please log in to your LivestockIQ dashboard to review and sign this record.</p>`;

                // 3. Send the email with the PDF as an attachment
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
// @access  Private
export const getMyTreatments = async (req, res) => {
    try {
        const treatments = await Treatment.find({ farmerId: req.user._id }).sort({ startDate: -1 });
        res.json(treatments);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const updateTreatmentByVet = async (req, res) => {
    try {
        const treatment = await Treatment.findById(req.params.id);
        if (!treatment) {
            return res.status(404).json({ message: 'Treatment not found' });
        }

        // Authorization: Check if the treatment belongs to a farmer supervised by this vet
        const farmer = await Farmer.findById(treatment.farmerId);
        if (farmer.vetId !== req.user.vetId) {
            return res.status(401).json({ message: 'Not authorized to modify this treatment' });
        }

        // If approving, set vetSigned to true
        if (req.body.status === 'Approved') {
            req.body.vetSigned = true;
        }

        const updatedTreatment = await Treatment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedTreatment);

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};