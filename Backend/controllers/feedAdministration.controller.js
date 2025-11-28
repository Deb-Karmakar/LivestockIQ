// Backend/controllers/feedAdministration.controller.js

import FeedAdministration from '../models/feedAdministration.model.js';
import Feed from '../models/feed.model.js';
import Animal from '../models/animal.model.js';
import { createAuditLog } from '../services/auditLog.service.js';

// @desc    Get all feed administrations for a farmer
// @route   GET /api/feed-admin
// @access  Private (Farmer)
export const getFeedAdministrations = async (req, res) => {
    try {
        const { status, animalId, startDate, endDate } = req.query;

        const query = { farmerId: req.user._id };

        if (status) {
            query.status = status;
        }

        if (animalId) {
            query.animalIds = animalId;
        }

        if (startDate || endDate) {
            query.administrationDate = {};
            if (startDate) query.administrationDate.$gte = new Date(startDate);
            if (endDate) query.administrationDate.$lte = new Date(endDate);
        }

        const administrations = await FeedAdministration.find(query)
            .populate('feedId')
            .populate('mrlTestResults')
            .sort({ administrationDate: -1 });

        res.json(administrations);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get specific feed administration by ID
// @route   GET /api/feed-admin/:id
// @access  Private (Farmer/Vet)
export const getFeedAdministrationById = async (req, res) => {
    try {
        const administration = await FeedAdministration.findById(req.params.id)
            .populate('feedId')
            .populate('mrlTestResults');

        if (!administration) {
            return res.status(404).json({ message: 'Feed administration not found' });
        }

        // Verify ownership (farmer or assigned vet)
        const isFarmer = administration.farmerId.toString() === req.user._id.toString();
        const isVet = req.user.role === 'vet' && administration.vetId === req.user.vetCode;

        if (!isFarmer && !isVet) {
            return res.status(403).json({ message: 'Not authorized to access this record' });
        }

        res.json(administration);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Record new feed administration
// @route   POST /api/feed-admin
// @access  Private (Farmer)
export const recordFeedAdministration = async (req, res) => {
    try {
        const { feedId, animalIds, feedQuantityUsed, startDate, groupName, notes } = req.body;

        // Validate required fields
        if (!feedId) {
            return res.status(400).json({ message: 'Feed selection is required' });
        }
        if (!animalIds || !Array.isArray(animalIds) || animalIds.length === 0) {
            return res.status(400).json({ message: 'At least one animal must be selected' });
        }
        if (!feedQuantityUsed || feedQuantityUsed <= 0) {
            return res.status(400).json({ message: 'Valid feed quantity is required' });
        }

        // Validate feed exists and belongs to farmer
        const feed = await Feed.findById(feedId);
        if (!feed) {
            return res.status(404).json({ message: 'Feed not found' });
        }

        if (feed.farmerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to use this feed' });
        }

        // Check if enough feed is available
        if (feedQuantityUsed > feed.remainingQuantity) {
            return res.status(400).json({
                message: `Insufficient feed. Available: ${feed.remainingQuantity} ${feed.unit}`
            });
        }

        // Validate animals exist and belong to farmer
        const animals = await Animal.find({
            tagId: { $in: animalIds },
            farmerId: req.user._id
        });

        if (animals.length !== animalIds.length) {
            return res.status(400).json({ message: 'One or more animals not found or not owned by you' });
        }

        // Create feed administration record
        const administration = new FeedAdministration({
            farmerId: req.user._id,
            feedId,
            animalIds,
            groupName,
            feedQuantityUsed,
            startDate: startDate || new Date(),
            notes,
            createdBy: req.user._id.toString(),
            status: feed.prescriptionRequired ? 'Pending Approval' : 'Active'
        });

        const savedAdministration = await administration.save();

        // Update feed remaining quantity
        await feed.consumeFeed(feedQuantityUsed);

        // Audit log
        await createAuditLog({
            eventType: 'CREATE',
            entityType: 'FeedAdministration',
            entityId: savedAdministration._id,
            farmerId: req.user._id,
            performedBy: req.user._id,
            performedByRole: 'Farmer',
            performedByModel: 'Farmer',
            dataSnapshot: savedAdministration.toObject(),
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                feedName: feed.feedName,
                antimicrobial: feed.antimicrobialName,
                animalCount: animalIds.length
            }
        });

        // Populate and return
        const populatedAdmin = await FeedAdministration.findById(savedAdministration._id)
            .populate('feedId');

        res.status(201).json(populatedAdmin);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: `Error recording feed administration: ${error.message}` });
    }
};

// @desc    Update feed administration
// @route   PUT /api/feed-admin/:id
// @access  Private (Farmer/Vet)
export const updateFeedAdministration = async (req, res) => {
    try {
        const administration = await FeedAdministration.findById(req.params.id);

        if (!administration) {
            return res.status(404).json({ message: 'Feed administration not found' });
        }

        // Verify ownership
        const isFarmer = administration.farmerId.toString() === req.user._id.toString();
        const isVet = req.user.role === 'vet' && administration.vetId === req.user.vetCode;

        if (!isFarmer && !isVet) {
            return res.status(403).json({ message: 'Not authorized to update this record' });
        }

        const oldData = administration.toObject();

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined && key !== 'farmerId' && key !== 'feedId') {
                administration[key] = req.body[key];
            }
        });

        const updatedAdministration = await administration.save();

        // Audit log
        const changes = {};
        Object.keys(req.body).forEach(key => {
            if (JSON.stringify(oldData[key]) !== JSON.stringify(req.body[key])) {
                changes[key] = { from: oldData[key], to: req.body[key] };
            }
        });

        await createAuditLog({
            eventType: 'UPDATE',
            entityType: 'FeedAdministration',
            entityId: administration._id,
            farmerId: administration.farmerId,
            performedBy: req.user._id,
            performedByRole: req.user.role === 'vet' ? 'Vet' : 'Farmer',
            performedByModel: req.user.role === 'vet' ? 'Vet' : 'Farmer',
            dataSnapshot: updatedAdministration.toObject(),
            changes,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        const populated = await FeedAdministration.findById(updatedAdministration._id)
            .populate('feedId');

        res.json(populated);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: `Error updating feed administration: ${error.message}` });
    }
};

// @desc    Delete feed administration
// @route   DELETE /api/feed-admin/:id
// @access  Private (Farmer)
export const deleteFeedAdministration = async (req, res) => {
    try {
        const administration = await FeedAdministration.findById(req.params.id);

        if (!administration) {
            return res.status(404).json({ message: 'Feed administration not found' });
        }

        // Verify ownership
        if (administration.farmerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this record' });
        }

        // Only allow deletion if status is Pending Approval
        if (administration.status !== 'Pending Approval') {
            return res.status(400).json({
                message: 'Can only delete pending administrations. Use status update to withdraw active programs.'
            });
        }

        // Restore feed quantity
        const feed = await Feed.findById(administration.feedId);
        if (feed) {
            feed.remainingQuantity += administration.feedQuantityUsed;
            await feed.save();
        }

        await administration.deleteOne();

        // Audit log
        await createAuditLog({
            eventType: 'DELETE',
            entityType: 'FeedAdministration',
            entityId: administration._id,
            farmerId: req.user._id,
            performedBy: req.user._id,
            performedByRole: 'Farmer',
            performedByModel: 'Farmer',
            dataSnapshot: administration.toObject(),
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                notes: 'Pending feed administration deleted, feed quantity restored'
            }
        });

        res.json({ message: 'Feed administration removed successfully' });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get active feeding programs
// @route   GET /api/feed-admin/active
// @access  Private (Farmer)
export const getActivePrograms = async (req, res) => {
    try {
        const activePrograms = await FeedAdministration.findActivePrograms(req.user._id);
        res.json(activePrograms);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Complete feeding program
// @route   POST /api/feed-admin/:id/complete
// @access  Private (Farmer)
export const completeFeedingProgram = async (req, res) => {
    try {
        const { endDate } = req.body;

        const administration = await FeedAdministration.findById(req.params.id);

        if (!administration) {
            return res.status(404).json({ message: 'Feed administration not found' });
        }

        // Verify ownership
        if (administration.farmerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (administration.status !== 'Active') {
            return res.status(400).json({ message: 'Can only complete active feeding programs' });
        }

        const completed = await administration.completeFeedingProgram(endDate);

        // Audit log
        await createAuditLog({
            eventType: 'UPDATE',
            entityType: 'FeedAdministration',
            entityId: administration._id,
            farmerId: req.user._id,
            performedBy: req.user._id,
            performedByRole: 'Farmer',
            performedByModel: 'Farmer',
            dataSnapshot: completed.toObject(),
            changes: {
                status: { from: 'Active', to: 'Completed' },
                endDate: completed.endDate,
                withdrawalEndDate: completed.withdrawalEndDate
            },
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        const populated = await FeedAdministration.findById(completed._id).populate('feedId');

        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: `Error completing program: ${error.message}` });
    }
};

// @desc    Get feed administration history for specific animal
// @route   GET /api/feed-admin/animal/:animalId
// @access  Private (Farmer/Vet)
export const getAnimalFeedHistory = async (req, res) => {
    try {
        const { animalId } = req.params;

        // Verify animal belongs to farmer or vet has access
        const animal = await Animal.findOne({ tagId: animalId });
        if (!animal) {
            return res.status(404).json({ message: 'Animal not found' });
        }

        const isFarmer = animal.farmerId.toString() === req.user._id.toString();
        const isVet = req.user.role === 'vet';

        if (!isFarmer && !isVet) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const history = await FeedAdministration.findByAnimal(animalId);

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get animals currently in withdrawal period from feed
// @route   GET /api/feed-admin/withdrawal-status
// @access  Private (Farmer)
export const getWithdrawalStatus = async (req, res) => {
    try {
        const animalsInWithdrawal = await FeedAdministration.findAnimalsInWithdrawal(req.user._id);

        // Extract unique animal IDs
        const animalIds = [...new Set(animalsInWithdrawal.flatMap(admin => admin.animalIds))];

        res.json({
            count: animalIds.length,
            animalIds,
            administrations: animalsInWithdrawal
        });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Approve feed administration (Vet only)
// @route   POST /api/feed-admin/:id/approve
// @access  Private (Vet)
export const approveFeedAdministration = async (req, res) => {
    try {
        if (req.user.role !== 'vet') {
            return res.status(403).json({ message: 'Only veterinarians can approve feed administrations' });
        }

        const administration = await FeedAdministration.findById(req.params.id);

        if (!administration) {
            return res.status(404).json({ message: 'Feed administration not found' });
        }

        if (administration.status !== 'Pending Approval') {
            return res.status(400).json({ message: 'This administration is not pending approval' });
        }

        administration.status = 'Active';
        administration.vetApproved = true;
        administration.vetApprovalDate = new Date();
        administration.vetId = req.user.vetCode;
        administration.approvedBy = req.user._id.toString();

        const approved = await administration.save();

        // Audit log
        await createAuditLog({
            eventType: 'APPROVE',
            entityType: 'FeedAdministration',
            entityId: administration._id,
            farmerId: administration.farmerId,
            performedBy: req.user._id,
            performedByRole: 'Vet',
            performedByModel: 'Vet',
            dataSnapshot: approved.toObject(),
            changes: {
                status: { from: 'Pending Approval', to: 'Active' },
                vetApproved: true,
                approvedBy: req.user.vetCode,
                approvalDate: approved.vetApprovalDate
            },
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        const populated = await FeedAdministration.findById(approved._id).populate('feedId');

        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: `Error approving feed administration: ${error.message}` });
    }
};
