import Animal from '../models/animal.model.js';
import Treatment from '../models/treatment.model.js';
import Sale from '../models/sale.model.js';
// @desc    Add a new animal
// @route   POST /api/animals
// @access  Private
export const addAnimal = async (req, res) => {
    try {
        const { tagId, name, species, dob, weight, status, notes, gender  } = req.body;

        // Check if animal with this tag ID already exists
        const existingAnimal = await Animal.findOne({ tagId });
        if (existingAnimal) {
            return res.status(400).json({ message: 'Animal with this tag ID already exists' });
        }

        // Create new animal with the logged-in farmer's ID
        const animal = await Animal.create({
            farmerId: req.user._id,
            tagId,
            name,
            species,
            dob,
            weight,
            status: status || 'Active',
            notes,
            gender,
        });

        res.status(201).json(animal);
    } catch (error) {
        console.error('Add animal error:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get all animals for the logged-in farmer
// @route   GET /api/animals
// @access  Private
export const getMyAnimals = async (req, res) => {
    try {
        // Find all animals that belong to the logged-in farmer
        const animals = await Animal.find({ farmerId: req.user._id }).sort({ createdAt: -1 });
        res.json(animals);
    } catch (error) {
        console.error('Get animals error:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Update an animal
// @route   PUT /api/animals/:id
// @access  Private
export const updateAnimal = async (req, res) => {
    try {
        const animal = await Animal.findById(req.params.id);

        if (!animal) {
            return res.status(404).json({ message: 'Animal not found' });
        }

        // Ensure the animal belongs to the logged-in farmer
        if (animal.farmerId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized' });
        }
        
        const updatedAnimal = await Animal.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true }
        );
        res.json(updatedAnimal);

    } catch (error) {
        console.error('Update animal error:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Delete an animal
// @route   DELETE /api/animals/:id
// @access  Private
export const deleteAnimal = async (req, res) => {
    try {
        const animal = await Animal.findById(req.params.id);

        if (!animal) {
            return res.status(404).json({ message: 'Animal not found' });
        }

        if (animal.farmerId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await animal.deleteOne();
        res.json({ message: 'Animal removed successfully' });

    } catch (error) {
        console.error('Delete animal error:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const getAnimalHistory = async (req, res) => {
    try {
        const { animalId } = req.params;

        // 1. Fetch all data concurrently
        const [animal, treatments, sales] = await Promise.all([
            Animal.findOne({ tagId: animalId }),
            Treatment.find({ animalId: animalId, status: 'Approved' }).sort({ startDate: 'asc' }),
            Sale.find({ animalId: animalId }).sort({ saleDate: 'asc' })
        ]);

        if (!animal) {
            return res.status(404).json({ message: 'Animal not found' });
        }

        // 2. Create a unified timeline array
        const timelineEvents = [];

        // Add the birth/logging event
        timelineEvents.push({
            type: 'LOGGED',
            date: animal.createdAt,
            title: 'Animal Logged in System',
            details: `Species: ${animal.species}, Gender: ${animal.gender || 'N/A'}`
        });

        // Add approved treatment events
        treatments.forEach(t => {
            timelineEvents.push({
                type: 'TREATMENT',
                date: t.startDate,
                title: `Treatment: ${t.drugName}`,
                details: `Dose: ${t.dose}. Vet Notes: ${t.vetNotes || 'N/A'}. Withdrawal ends: ${t.withdrawalEndDate ? t.withdrawalEndDate.toLocaleDateString() : 'N/A'}`
            });
        });

        // Add sale events
        sales.forEach(s => {
            timelineEvents.push({
                type: 'SALE',
                date: s.saleDate,
                title: `Sale: ${s.productType}`,
                details: `Sold ${s.quantity} ${s.unit} for ₹${s.price.toLocaleString('en-IN')}.`
            });
        });
        
        // 3. Sort the entire timeline by date
        const sortedTimeline = timelineEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({
            animalDetails: animal,
            timeline: sortedTimeline
        });

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};