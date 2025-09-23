// backend/controllers/prescription.controller.js

import Prescription from '../models/prescription.model.js';

// @desc    Get prescriptions for the logged-in user (farmer or vet)
// @route   GET /api/prescriptions
export const getMyPrescriptions = async (req, res) => {
    try {
        let query = {};
        // req.user will have either _id (farmer) or vetId
        if (req.user.farmOwner) { // Heuristic to check if user is a farmer
            query.farmerId = req.user._id;
        } else { // Assumes user is a vet
            query.vetId = req.user._id;
        }

        const prescriptions = await Prescription.find(query)
            .populate('treatmentId', 'animalId drugName startDate')
            .populate('farmerId', 'farmOwner')
            .populate('vetId', 'fullName')
            .sort({ issueDate: -1 });

        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};