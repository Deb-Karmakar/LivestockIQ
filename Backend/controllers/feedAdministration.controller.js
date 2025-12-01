// Backend/controllers/feedAdministration.controller.js
import FeedAdministration from '../models/feedAdministration.model.js';
import Feed from '../models/feed.model.js';
import Animal from '../models/animal.model.js';
import Farmer from '../models/farmer.model.js';
import Vet from '../models/vet.model.js';
import Prescription from '../models/prescription.model.js';
import { createAuditLog } from '../services/auditLog.service.js';
import { generateFarmerFeedConfirmation, generateVetFeedApprovalPDF, generateFeedPrescriptionPDF } from '../services/pdfGenerator.service.js';
import sendEmail from '../utils/sendEmail.js';
// @desc Get all feed administrations for a farmer
// @route GET /api/feed-admin
// @access Private (Farmer)
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
// @desc Get specific feed administration by ID
// @route GET /api/feed-admin/:id
// @access Private (Farmer/Vet)
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
// @desc Record new feed administration
// @route POST /api/feed-admin
// @access Private (Farmer)
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

        // Check MRL status for each animal - only for MEDICATED feeds
        // Non-medicated feeds can be given to any animal regardless of MRL status
        if (feed.prescriptionRequired) {
            const { calculateAnimalMRLStatus } = await import('../utils/mrlStatusCalculator.js');
            const ineligibleAnimals = [];
            for (const animal of animals) {
                const mrlStatus = await calculateAnimalMRLStatus(animal, req.user._id);
                // Only SAFE and NEW animals can receive feed medications
                if (mrlStatus.mrlStatus && !['SAFE', 'NEW'].includes(mrlStatus.mrlStatus)) {
                    ineligibleAnimals.push({
                        tagId: animal.tagId,
                        name: animal.name || animal.tagId,
                        mrlStatus: mrlStatus.mrlStatus,
                        reason: mrlStatus.statusMessage
                    });
                }
            }
            // If any animals are ineligible, reject the entire operation
            if (ineligibleAnimals.length > 0) {
                return res.status(400).json({
                    message: `Cannot administer feed: ${ineligibleAnimals.length} animal(s) are not eligible`,
                    ineligibleAnimals,
                    details: 'Only animals with "Safe for Sale" or "New Animal" status can receive feed medications.'
                });
            }
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
        // Clear the "New" tag for all animals in this feed administration
        await Animal.updateMany(
            { tagId: { $in: animalIds }, farmerId: req.user._id, isNew: true },
            { isNew: false }
        );
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
        // Generate farmer confirmation PDF
        const farmer = await Farmer.findById(req.user._id);
        let pdfBuffer = null;
        try {
            pdfBuffer = await generateFarmerFeedConfirmation(
                savedAdministration,
                farmer,
                feed,
                animals
            );
        } catch (pdfError) {
            console.error('Error generating PDF:', pdfError);
        }
        // If prescription required, send email to supervising vet
        // For non-medicated feeds, skip vet notification as they don't need approval
        if (feed.prescriptionRequired && farmer.vetId) {
            try {
                const vet = await Vet.findOne({ vetId: farmer.vetId });
                if (vet) {
                    await sendEmail({
                        to: vet.email,
                        subject: 'New Feed Administration Pending Your Approval',
                        html: `
                            <h2>New Feed Administration Pending Approval</h2>
                            <p>Dear Dr. ${vet.fullName},</p>
                            <p>A new feed-based antimicrobial administration has been submitted by <strong>${farmer.farmOwner}</strong> from <strong>${farmer.farmName}</strong> and requires your approval.</p>
                            <h3>Details:</h3>
                            <ul>
                                <li>Feed: ${feed.feedName}</li>
                                <li>Antimicrobial: ${feed.antimicrobialName}</li>
                                <li>Animals: ${animals.length}</li>
                                <li>Group: ${groupName || 'Individual animals'}</li>
                            </ul>
                            <p>Please log in to LivestockIQ to review and approve this administration.</p>
                        `
                    });
                }
            } catch (emailError) {
                console.error('Error sending vet notification:', emailError);
            }
        }
        // Populate and return with PDF
        const populatedAdmin = await FeedAdministration.findById(savedAdministration._id)
            .populate('feedId');
        res.status(201).json({
            administration: populatedAdmin,
            pdfBuffer: pdfBuffer ? pdfBuffer.toString('base64') : null
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: `Error recording feed administration: ${error.message}` });
    }
};
// @desc Update feed administration
// @route PUT /api/feed-admin/:id
// @access Private (Farmer/Vet)
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
// @desc Delete feed administration
// @route DELETE /api/feed-admin/:id
// @access Private (Farmer)
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
// @desc Get active feeding programs
// @route GET /api/feed-admin/active
// @access Private (Farmer)
export const getActivePrograms = async (req, res) => {
    try {
        const activePrograms = await FeedAdministration.findActivePrograms(req.user._id);
        res.json(activePrograms);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};
// @desc Complete feeding program
// @route POST /api/feed-admin/:id/complete
// @access Private (Farmer)
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
// @desc Get feed administration history for specific animal
// @route GET /api/feed-admin/animal/:animalId
// @access Private (Farmer/Vet)
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
// @desc Get animals currently in withdrawal period from feed
// @route GET /api/feed-admin/withdrawal-status
// @access Private (Farmer)
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
// @desc Get pending feed administration requests (Vet only)
// @route GET /api/feed-admin/pending
// @access Private (Vet)
export const getPendingFeedRequests = async (req, res) => {
    try {
        if (req.user.role !== 'veterinarian') {
            return res.status(403).json({ message: 'Only veterinarians can access this endpoint' });
        }
        // Get farmers supervised by this vet
        // Get farmers supervised by this vet  
        const farmers = await Farmer.find({ vetId: req.user.vetId });
        const farmerIds = farmers.map(farmer => farmer._id);

        // Get all feeds that require prescription
        const prescriptionFeeds = await Feed.find({ prescriptionRequired: true }).select('_id');
        const prescriptionFeedIds = prescriptionFeeds.map(f => f._id);

        // Get feed administrations from supervised farmers - only medicated feeds
        const feedRequests = await FeedAdministration.find({
            farmerId: { $in: farmerIds },
            feedId: { $in: prescriptionFeedIds }  // Only show medicated feeds
        })
            .populate('farmerId', 'farmOwner farmName email')
            .populate('feedId')
            .sort({ createdAt: -1 })
            .lean();
        // Get all unique animal Tag IDs
        const animalTagIds = [...new Set(feedRequests.flatMap(req => req.animalIds))];
        // Find all corresponding animal documents
        const animals = await Animal.find({ tagId: { $in: animalTagIds } }).select('tagId species dob weight gender');
        // Create a lookup map for efficient merging
        const animalMap = new Map(animals.map(a => [a.tagId, a]));
        // Combine feed request data with animal data
        const enrichedRequests = feedRequests.map(request => ({
            ...request,
            animals: request.animalIds.map(id => animalMap.get(id) || null).filter(a => a !== null)
        }));
        res.json(enrichedRequests);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};
// @desc Approve feed administration (Vet only)
// @route POST /api/feed-admin/:id/approve
// @access Private (Vet)
export const approveFeedAdministration = async (req, res) => {
    try {
        if (req.user.role !== 'veterinarian') {
            return res.status(403).json({ message: 'Only veterinarians can approve feed administrations' });
        }
        const { vetNotes } = req.body;
        const administration = await FeedAdministration.findById(req.params.id)
            .populate('farmerId', 'farmOwner farmName email')
            .populate('feedId');
        if (!administration) {
            return res.status(404).json({ message: 'Feed administration not found' });
        }
        if (administration.status !== 'Pending Approval') {
            return res.status(400).json({ message: 'This administration is not pending approval' });
        }
        administration.status = 'Active';
        administration.vetApproved = true;
        administration.vetApprovalDate = new Date();
        administration.vetId = req.user.vetId;
        administration.approvedBy = req.user._id.toString();
        if (vetNotes) {
            administration.notes = (administration.notes ? administration.notes + '\n\n' : '') + `[Vet Notes]: ${vetNotes}`;
        }
        const approved = await administration.save();

        // --- NEW: Create Prescription Record ---
        try {
            await Prescription.create({
                feedAdministrationId: approved._id,
                farmerId: administration.farmerId._id,
                vetId: req.user._id,
                issueDate: new Date()
            });
            console.log('✅ Prescription record created for feed administration:', approved._id);
        } catch (prescError) {
            console.error('❌ Error creating prescription record:', prescError);
            // Don't fail the whole request, just log error
        }
        // ---------------------------------------
        // Clear the "New" tag for all animals in this feed administration
        await Animal.updateMany(
            { tagId: { $in: approved.animalIds }, farmerId: administration.farmerId._id, isNew: true },
            { isNew: false }
        );
        // Get populated data for PDFs
        const animals = await Animal.find({ tagId: { $in: approved.animalIds } });
        const vet = await Vet.findById(req.user._id);
        // Generate vet confirmation PDF
        let vetPdfBuffer = null;
        try {
            vetPdfBuffer = await generateVetFeedApprovalPDF(
                approved,
                vet,
                administration.farmerId,
                administration.feedId,
                animals
            );
        } catch (pdfError) {
            console.error('Error generating vet PDF:', pdfError);
        }
        // Generate and send prescription PDF to farmer
        try {
            const prescriptionBuffer = await generateFeedPrescriptionPDF(
                approved,
                vet,
                administration.farmerId,
                administration.feedId,
                animals
            );
            await sendEmail({
                to: administration.farmerId.email,
                subject: 'Feed Administration Prescription Approved',
                html: `
                    <h2>Feed Administration Prescription Approved</h2>
                    <p>Dear ${administration.farmerId.farmOwner},</p>
                    <p>Your feed administration for <strong>${administration.feedId.feedName}</strong> has been approved by Dr. ${vet.fullName}.</p>
                    <p><strong>Withdrawal End Date:</strong> ${new Date(approved.withdrawalEndDate).toLocaleDateString()}</p>
                    <p>Please find the attached prescription PDF. Ensure all animals complete the withdrawal period before sale or slaughter.</p>
                    <p>MRL testing will be required after the withdrawal period ends.</p>
                `,
                attachments: [{
                    filename: `Feed_Prescription_${approved._id}.pdf`,
                    content: prescriptionBuffer
                }]
            });
            console.log('✅ Prescription email sent to farmer:', administration.farmerId.email);
        } catch (emailError) {
            console.error('❌ Error sending prescription email:', emailError);
            console.error('Email error details:', {
                to: administration.farmerId?.email,
                vet: vet?.fullName,
                error: emailError.message
            });
        }
        // Update all animals to withdrawal status - ONLY for medicated feeds
        if (administration.feedId.prescriptionRequired && administration.feedId.withdrawalPeriodDays > 0) {
            try {
                console.log('📝 Updating animal statuses for tagIds:', approved.animalIds);
                const updateResult = await Animal.updateMany(
                    { tagId: { $in: approved.animalIds } },
                    {
                        withdrawalActive: true,
                        withdrawalEndDate: approved.withdrawalEndDate,
                        $push: { activeFeedAdministrations: approved._id }
                    }
                );
                console.log('✅ Animal status update result:', {
                    matched: updateResult.matchedCount,
                    modified: updateResult.modifiedCount,
                    animalIds: approved.animalIds
                });
            } catch (animalError) {
                console.error('❌ Error updating animal statuses:', animalError);
                console.error('Animal update error details:', {
                    animalIds: approved.animalIds,
                    error: animalError.message
                });
            }
        } else {
            console.log('ℹ️ Skipping animal status update for non-medicated feed');
        }
        // Send email notification to farmer
        await sendEmail({
            to: administration.farmerId.email,
            subject: 'Feed Administration Approved',
            text: `Your feed administration for ${administration.groupName || administration.animalIds.join(', ')} has been approved by Dr. ${req.user.fullName}.
Feed: ${administration.feedId.feedName}
Antimicrobial: ${administration.feedId.antimicrobialName}
Quantity: ${administration.feedQuantityUsed} ${administration.feedId.unit}
Start Date: ${new Date(administration.startDate).toLocaleDateString()}
Withdrawal End Date: ${new Date(administration.withdrawalEndDate).toLocaleDateString()}
${vetNotes ? 'Vet Notes: ' + vetNotes : ''}
Best regards,
${req.user.fullName}
LivestockIQ System`
        });
        // Audit log
        await createAuditLog({
            eventType: 'APPROVE',
            entityType: 'FeedAdministration',
            entityId: administration._id,
            farmerId: administration.farmerId._id,
            performedBy: req.user._id,
            performedByRole: 'Veterinarian',
            performedByModel: 'Veterinarian',
            dataSnapshot: approved.toObject(),
            changes: {
                status: { from: 'Pending Approval', to: 'Active' },
                vetApproved: true,
                approvedBy: req.user.vetId,
                approvalDate: approved.vetApprovalDate
            },
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                vetNotes: vetNotes || ''
            }
        });
        const populated = await FeedAdministration.findById(approved._id)
            .populate('feedId')
            .populate('farmerId', 'farmOwner farmName email');
        res.json({
            administration: populated,
            vetPdfBuffer: vetPdfBuffer ? vetPdfBuffer.toString('base64') : null
        });
    } catch (error) {
        console.error('Error approving feed administration:', error);
        res.status(500).json({ message: `Error approving feed administration: ${error.message}` });
    }
};
// @desc Reject feed administration (Vet only)
// @route POST /api/feed-admin/:id/reject
// @access Private (Vet)
export const rejectFeedAdministration = async (req, res) => {
    try {
        if (req.user.role !== 'veterinarian') {
            return res.status(403).json({ message: 'Only veterinarians can reject feed administrations' });
        }
        const { rejectionReason } = req.body;
        if (!rejectionReason || rejectionReason.trim() === '') {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }
        const administration = await FeedAdministration.findById(req.params.id)
            .populate('farmerId', 'farmOwner farmName email')
            .populate('feedId');
        if (!administration) {
            return res.status(404).json({ message: 'Feed administration not found' });
        }
        if (administration.status !== 'Pending Approval') {
            return res.status(400).json({ message: 'This administration is not pending approval' });
        }
        administration.status = 'Rejected';
        administration.vetId = req.user.vetId;
        administration.approvedBy = req.user._id.toString();
        administration.notes = (administration.notes ? administration.notes + '\n\n' : '') + `[Rejection Reason]: ${rejectionReason}`;
        const rejected = await administration.save();
        // Restore feed quantity since it was rejected
        const feed = await Feed.findById(administration.feedId);
        if (feed) {
            feed.remainingQuantity += administration.feedQuantityUsed;
            await feed.save();
        }
        // Send email notification to farmer
        await sendEmail({
            to: administration.farmerId.email,
            subject: 'Feed Administration Rejected',
            text: `Your feed administration for ${administration.groupName || administration.animalIds.join(', ')} has been rejected by Dr. ${req.user.fullName}.
Feed: ${administration.feedId.feedName}
Antimicrobial: ${administration.feedId.antimicrobialName}
Quantity: ${administration.feedQuantityUsed} ${administration.feedId.unit}
Rejection Reason: ${rejectionReason}
The feed quantity has been restored to your inventory.
Please contact your veterinarian for further guidance.
Best regards,
${req.user.fullName}
LivestockIQ System`
        });
        // Audit log
        await createAuditLog({
            eventType: 'REJECT',
            entityType: 'FeedAdministration',
            entityId: administration._id,
            farmerId: administration.farmerId._id,
            performedBy: req.user._id,
            performedByRole: 'Veterinarian',
            performedByModel: 'Veterinarian',
            dataSnapshot: rejected.toObject(),
            changes: {
                status: { from: 'Pending Approval', to: 'Rejected' },
                rejectionReason,
                rejectedBy: req.user.vetId
            },
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                rejectionReason
            }
        });
        const populated = await FeedAdministration.findById(rejected._id)
            .populate('feedId')
            .populate('farmerId', 'farmOwner farmName email');
        res.json(populated);
    } catch (error) {
        console.error('Error rejecting feed administration:', error);
        res.status(500).json({ message: `Error rejecting feed administration: ${error.message}` });
    }
};