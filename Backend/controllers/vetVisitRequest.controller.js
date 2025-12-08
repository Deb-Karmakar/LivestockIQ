import VetVisitRequest from '../models/vetVisitRequest.model.js';
import Farmer from '../models/farmer.model.js';
import Animal from '../models/animal.model.js';
import Veterinarian from '../models/vet.model.js';
import { sendVetVisitRequestAlert, sendVetVisitResponseAlert } from '../services/websocket.service.js';

/**
 * @desc    Create a vet visit request (Farmer)
 * @route   POST /api/vet-visits
 * @access  Private (Farmer)
 */
export const createVetVisitRequest = async (req, res) => {
    try {
        const farmerId = req.user._id;
        const { animalId, reason, notes, urgency } = req.body;

        // Validate required fields
        if (!animalId || !reason) {
            return res.status(400).json({ message: 'Animal ID and reason are required' });
        }

        // Get farmer to find their vet
        const farmer = await Farmer.findById(farmerId);
        if (!farmer) {
            return res.status(404).json({ message: 'Farmer not found' });
        }

        // Verify the animal belongs to this farmer
        const animal = await Animal.findOne({ tagId: animalId, farmerId });
        if (!animal) {
            return res.status(404).json({ message: 'Animal not found or does not belong to you' });
        }

        // Create the visit request
        const visitRequest = await VetVisitRequest.create({
            farmerId,
            vetId: farmer.vetId,
            animalId,
            animalName: animal.name || animalId,
            reason,
            notes: notes || '',
            urgency: urgency || 'Normal',
            status: 'Requested'
        });

        // Get vet details for notification
        const vet = await Veterinarian.findOne({ vetId: farmer.vetId });

        // Send WebSocket notification to vet
        if (vet) {
            sendVetVisitRequestAlert(farmer.vetId, {
                visitRequestId: visitRequest._id,
                farmerId: farmerId,
                farmerName: farmer.farmOwner,
                farmName: farmer.farmName,
                animalId,
                animalName: animal.name || animalId,
                reason,
                urgency: urgency || 'Normal'
            });
        }

        res.status(201).json({
            message: 'Vet visit request submitted successfully',
            visitRequest
        });

    } catch (error) {
        console.error('Error creating vet visit request:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Get vet visit requests
 * @route   GET /api/vet-visits
 * @access  Private (Farmer/Vet)
 */
export const getVetVisitRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = {};

        // Check if user is a farmer or vet based on user object structure
        if (req.user.farmOwner) {
            // Farmer - see their own requests
            query.farmerId = req.user._id;
        } else if (req.user.vetId) {
            // Vet - see requests for their supervised farmers
            query.vetId = req.user.vetId;
        } else {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        // Filter by status if provided
        if (status && status !== 'all') {
            query.status = status;
        }

        const [visitRequests, totalCount] = await Promise.all([
            VetVisitRequest.find(query)
                .populate('farmerId', 'farmOwner farmName phoneNumber email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            VetVisitRequest.countDocuments(query)
        ]);

        // Enrich with animal details
        const animalTagIds = [...new Set(visitRequests.map(r => r.animalId))];
        const animals = await Animal.find({ tagId: { $in: animalTagIds } }).select('tagId name species dob');
        const animalMap = new Map(animals.map(a => [a.tagId, a]));

        const enrichedRequests = visitRequests.map(request => ({
            ...request,
            animal: animalMap.get(request.animalId) || null
        }));

        res.json({
            data: enrichedRequests,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching vet visit requests:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Respond to vet visit request (Accept/Decline)
 * @route   PUT /api/vet-visits/:id/respond
 * @access  Private (Vet)
 */
export const respondToVetVisitRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, scheduledDate, vetNotes } = req.body;

        if (!action || !['accept', 'decline'].includes(action)) {
            return res.status(400).json({ message: 'Valid action (accept/decline) is required' });
        }

        const visitRequest = await VetVisitRequest.findById(id).populate('farmerId', 'farmOwner farmName');
        if (!visitRequest) {
            return res.status(404).json({ message: 'Visit request not found' });
        }

        // Verify vet owns this request
        if (visitRequest.vetId !== req.user.vetId) {
            return res.status(403).json({ message: 'Not authorized to respond to this request' });
        }

        if (visitRequest.status !== 'Requested') {
            return res.status(400).json({ message: 'This request has already been responded to' });
        }

        if (action === 'accept') {
            if (!scheduledDate) {
                return res.status(400).json({ message: 'Scheduled date is required when accepting' });
            }
            visitRequest.status = 'Accepted';
            visitRequest.scheduledDate = new Date(scheduledDate);
        } else {
            visitRequest.status = 'Declined';
        }

        visitRequest.vetNotes = vetNotes || '';
        await visitRequest.save();

        // Get vet name for notification
        const vet = await Veterinarian.findOne({ vetId: req.user.vetId });

        // Send notification to farmer
        sendVetVisitResponseAlert(visitRequest.farmerId._id.toString(), {
            visitRequestId: visitRequest._id,
            animalId: visitRequest.animalId,
            animalName: visitRequest.animalName,
            status: visitRequest.status,
            scheduledDate: visitRequest.scheduledDate,
            vetName: vet?.fullName || 'Your veterinarian',
            vetNotes: visitRequest.vetNotes
        });

        res.json({
            message: `Visit request ${action === 'accept' ? 'accepted' : 'declined'} successfully`,
            visitRequest
        });

    } catch (error) {
        console.error('Error responding to vet visit request:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Complete vet visit (after physical visit)
 * @route   PUT /api/vet-visits/:id/complete
 * @access  Private (Vet)
 */
export const completeVetVisit = async (req, res) => {
    try {
        const { id } = req.params;
        const { treatmentId, vetNotes } = req.body;

        const visitRequest = await VetVisitRequest.findById(id);
        if (!visitRequest) {
            return res.status(404).json({ message: 'Visit request not found' });
        }

        if (visitRequest.vetId !== req.user.vetId) {
            return res.status(403).json({ message: 'Not authorized to complete this request' });
        }

        if (visitRequest.status !== 'Accepted') {
            return res.status(400).json({ message: 'Only accepted requests can be marked as complete' });
        }

        visitRequest.status = 'Completed';
        visitRequest.completedAt = new Date();
        if (treatmentId) {
            visitRequest.treatmentId = treatmentId;
        }
        if (vetNotes) {
            visitRequest.vetNotes = vetNotes;
        }

        await visitRequest.save();

        res.json({
            message: 'Visit marked as complete',
            visitRequest
        });

    } catch (error) {
        console.error('Error completing vet visit:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Get single vet visit request by ID
 * @route   GET /api/vet-visits/:id
 * @access  Private (Farmer/Vet)
 */
export const getVetVisitRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        const visitRequest = await VetVisitRequest.findById(id)
            .populate('farmerId', 'farmOwner farmName phoneNumber email')
            .populate('treatmentId')
            .lean();

        if (!visitRequest) {
            return res.status(404).json({ message: 'Visit request not found' });
        }

        // Authorization check
        const isFarmer = req.user.farmOwner && visitRequest.farmerId._id.toString() === req.user._id.toString();
        const isVet = req.user.vetId && visitRequest.vetId === req.user.vetId;

        if (!isFarmer && !isVet) {
            return res.status(403).json({ message: 'Not authorized to view this request' });
        }

        // Get animal details
        const animal = await Animal.findOne({ tagId: visitRequest.animalId });

        res.json({
            ...visitRequest,
            animal: animal || null
        });

    } catch (error) {
        console.error('Error fetching vet visit request:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};
