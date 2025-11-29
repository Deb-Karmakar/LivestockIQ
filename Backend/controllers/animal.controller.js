import Animal from '../models/animal.model.js';
import Treatment from '../models/treatment.model.js';
import Sale from '../models/sale.model.js';
import { createAuditLog } from '../services/auditLog.service.js';
import { calculateAnimalMRLStatus } from '../utils/mrlStatusCalculator.js';


// @desc    Add a new animal
// @route   POST /api/animals
// @access  Private
export const addAnimal = async (req, res) => {
    try {
        const { tagId, name, species, dob, weight, status, notes, gender } = req.body;

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

        // Create audit log for animal creation
        await createAuditLog({
            eventType: 'CREATE',
            entityType: 'Animal',
            entityId: animal._id,
            farmerId: req.user._id,
            performedBy: req.user._id,
            performedByRole: 'Farmer',
            performedByModel: 'Farmer',
            dataSnapshot: animal.toObject(),
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            },
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

        // Calculate MRL status for each animal
        const animalsWithMRLStatus = await Promise.all(
            animals.map(async (animal) => {
                const mrlStatus = await calculateAnimalMRLStatus(animal, req.user._id);
                return {
                    ...animal.toObject(),
                    mrlStatus: mrlStatus.mrlStatus,
                    mrlStatusMessage: mrlStatus.statusMessage,
                    canSellProducts: mrlStatus.canSellProducts
                };
            })
        );
        res.json(animalsWithMRLStatus);
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

        // Store original state for audit trail
        const originalState = animal.toObject();

        const updatedAnimal = await Animal.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        // Track what changed
        const changes = {};
        Object.keys(req.body).forEach(key => {
            if (JSON.stringify(originalState[key]) !== JSON.stringify(req.body[key])) {
                changes[key] = {
                    from: originalState[key],
                    to: req.body[key],
                };
            }
        });

        // Create audit log for animal update
        await createAuditLog({
            eventType: 'UPDATE',
            entityType: 'Animal',
            entityId: updatedAnimal._id,
            farmerId: req.user._id,
            performedBy: req.user._id,
            performedByRole: 'Farmer',
            performedByModel: 'Farmer',
            dataSnapshot: updatedAnimal.toObject(),
            changes,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            },
        });

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

        // Store animal data before deletion for audit trail
        const animalSnapshot = animal.toObject();

        await animal.deleteOne();

        // Create audit log for animal deletion
        await createAuditLog({
            eventType: 'DELETE',
            entityType: 'Animal',
            entityId: animal._id,
            farmerId: req.user._id,
            performedBy: req.user._id,
            performedByRole: 'Farmer',
            performedByModel: 'Farmer',
            dataSnapshot: animalSnapshot,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                notes: 'Animal deleted from system',
            },
        });

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