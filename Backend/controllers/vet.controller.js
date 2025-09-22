import Farmer from '../models/farmer.model.js';
import Veterinarian from '../models/vet.model.js';
import Treatment from '../models/treatment.model.js';
import Animal from '../models/animal.model.js';

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