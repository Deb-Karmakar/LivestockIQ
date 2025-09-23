import Farmer from '../models/farmer.model.js';
import Veterinarian from '../models/vet.model.js';
import Treatment from '../models/treatment.model.js';
import Animal from '../models/animal.model.js';
import ComplianceAlert from '../models/complianceAlert.model.js';

// @desc    Get all farmers assigned to the logged-in vet
// @route   GET /api/vets/my-farmers
// @access  Private
export const getMyFarmers = async (req, res) => {
    try {
        // req.user is attached by the 'protect' middleware and contains the logged-in vet's info.
        // We use the vet's unique vetId to find all matching farmers.
        const farmers = await Farmer.find({ vetId: req.user.vetId });
        
        if (farmers) {
            res.json(farmers);
        } else {
            res.status(404).json({ message: 'No farmers found for this veterinarian.' });
        }
    } catch (error) {
         res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const getVetByCode = async (req, res) => {
    try {
        const vet = await Veterinarian.findOne({ vetId: req.params.vetId }).select('fullName vetId');
        if (vet) {
            res.json(vet);
        } else {
            res.status(404).json({ message: 'Veterinarian not found' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const getTreatmentRequests = async (req, res) => {
    try {
        const farmers = await Farmer.find({ vetId: req.user.vetId });
        const farmerIds = farmers.map(farmer => farmer._id);

        const treatments = await Treatment.find({ farmerId: { $in: farmerIds } })
            .populate('farmerId', 'farmOwner farmName')
            .sort({ createdAt: -1 })
            .lean(); // Use .lean() for better performance

        // Get all unique animal Tag IDs from the treatments
        const animalTagIds = [...new Set(treatments.map(t => t.animalId))];

        // Find all corresponding animal documents
        const animals = await Animal.find({ tagId: { $in: animalTagIds } }).select('tagId species dob weight gender');

        // Create a lookup map for efficient merging
        const animalMap = new Map(animals.map(a => [a.tagId, a]));

        // Combine the treatment data with the animal data
        const enrichedTreatments = treatments.map(treatment => ({
            ...treatment,
            animal: animalMap.get(treatment.animalId) || null // Attach animal details
        }));

        res.json(enrichedTreatments);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const getAnimalsForFarmerByVet = async (req, res) => {
    try {
        const { farmerId } = req.params;
        const vetId = req.user.vetId; // Get the logged-in vet's unique ID

        // 1. Authorization Check: Ensure the farmer is linked to this vet
        const farmer = await Farmer.findById(farmerId);
        if (!farmer) {
            return res.status(404).json({ message: 'Farmer not found.' });
        }
        if (farmer.vetId !== vetId) {
            return res.status(401).json({ message: 'Not authorized to view this farmer\'s animals.' });
        }

        // 2. If authorized, fetch the animals
        const animals = await Animal.find({ farmerId: farmer._id }).sort({ createdAt: -1 });
        res.json(animals);

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const updateVetProfile = async (req, res) => {
    try {
        const vet = await Veterinarian.findById(req.user._id);

        if (vet) {
            // Update fields from request body
            vet.fullName = req.body.fullName || vet.fullName;
            vet.specialization = req.body.specialization || vet.specialization;
            vet.phoneNumber = req.body.phoneNumber || vet.phoneNumber;
            
            // Update notification preferences if they are provided
            if (req.body.notificationPrefs) {
                vet.notificationPrefs = { ...vet.notificationPrefs, ...req.body.notificationPrefs };
            }

            const updatedVet = await vet.save();

            res.json({
                _id: updatedVet._id,
                fullName: updatedVet.fullName,
                email: updatedVet.email,
                specialization: updatedVet.specialization,
                phoneNumber: updatedVet.phoneNumber,
                notificationPrefs: updatedVet.notificationPrefs,
                // Add any other fields you want to return
            });
        } else {
            res.status(404).json({ message: 'Veterinarian not found' });
        }
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const getVetProfile = async (req, res) => {
    // req.user is attached by the 'protect' middleware
    const vet = await Veterinarian.findById(req.user._id).select('-password');
    if (vet) {
        res.json(vet);
    } else {
        res.status(404).json({ message: 'Veterinarian not found' });
    }
};

export const reportFarmer = async (req, res) => {
    try {
        const { farmerId, reason, details } = req.body;
        const vetId = req.user._id;

        const farmer = await Farmer.findById(farmerId);
        if (!farmer || farmer.vetId !== req.user.vetId) {
            return res.status(401).json({ message: 'Not authorized to report this farmer.' });
        }

        await ComplianceAlert.create({
            farmerId,
            vetId,
            reason,
            details
        });

        res.status(201).json({ message: 'Farmer reported successfully. The alert has been sent to the regulator.' });

    } catch (error) {
        // NEW: This line will print the actual error to your backend terminal
        console.error("Error reporting farmer:", error); 
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};