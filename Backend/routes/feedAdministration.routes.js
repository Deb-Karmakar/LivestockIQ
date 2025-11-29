// Backend/routes/feedAdministration.routes.js

import express from 'express';
import {
    getFeedAdministrations,
    getFeedAdministrationById,
    recordFeedAdministration,
    updateFeedAdministration,
    deleteFeedAdministration,
    getActivePrograms,
    completeFeedingProgram,
    getAnimalFeedHistory,
    getWithdrawalStatus,
    getPendingFeedRequests,
    approveFeedAdministration,
    rejectFeedAdministration
} from '../controllers/feedAdministration.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/feed-admin/active
// @desc    Get active feeding programs
// @access  Private (Farmer)
router.get('/active', getActivePrograms);

// @route   GET /api/feed-admin/withdrawal-status
// @desc    Get animals in withdrawal period from feed
// @access  Private (Farmer)
router.get('/withdrawal-status', getWithdrawalStatus);

// @route   GET /api/feed-admin/pending
// @desc    Get pending feed administration requests (Vet only)
// @access  Private (Vet)
router.get('/pending', getPendingFeedRequests);

// @route   GET /api/feed-admin/animal/:animalId
// @desc    Get feed history for specific animal
// @access  Private (Farmer/Vet)
router.get('/animal/:animalId', getAnimalFeedHistory);

// @route   GET /api/feed-admin
// @desc    Get all feed administrations
// @access  Private (Farmer)
router.get('/', getFeedAdministrations);

// @route   POST /api/feed-admin
// @desc    Record new feed administration
// @access  Private (Farmer)
router.post('/', recordFeedAdministration);

// @route   GET /api/feed-admin/:id
// @desc    Get specific feed administration
// @access  Private (Farmer/Vet)
router.get('/:id', getFeedAdministrationById);

// @route   PUT /api/feed-admin/:id
// @desc    Update feed administration
// @access  Private (Farmer/Vet)
router.put('/:id', updateFeedAdministration);

// @route   DELETE /api/feed-admin/:id
// @desc    Delete feed administration
// @access  Private (Farmer)
router.delete('/:id', deleteFeedAdministration);

// @route   POST /api/feed-admin/:id/complete
// @desc    Complete feeding program
// @access  Private (Farmer)
router.post('/:id/complete', completeFeedingProgram);

// @route   POST /api/feed-admin/:id/approve
// @desc    Approve feed administration (Vet only)
// @access  Private (Vet)
router.post('/:id/approve', approveFeedAdministration);

// @route   POST /api/feed-admin/:id/reject
// @desc    Reject feed administration (Vet only)
// @access  Private (Vet)
router.post('/:id/reject', rejectFeedAdministration);

export default router;
