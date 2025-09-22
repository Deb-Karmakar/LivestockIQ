import Animal from '../models/animal.model.js';

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