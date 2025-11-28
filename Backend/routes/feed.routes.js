// Backend/routes/feed.routes.js

import express from 'express';
import {
    getFeedInventory,
    getFeedById,
    addFeedItem,
    updateFeedItem,
    deleteFeedItem,
    getExpiringFeed,
    getActiveFeed,
    consumeFeed,
    getFeedStats
} from '../controllers/feed.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/feed/stats
// @desc    Get feed inventory statistics
// @access  Private (Farmer)
router.get('/stats', getFeedStats);

// @route   GET /api/feed/active
// @desc    Get active medicated feed
// @access  Private (Farmer)
router.get('/active', getActiveFeed);

// @route   GET /api/feed/expiring/:days
// @desc    Get expiring feed items
// @access  Private (Farmer)
router.get('/expiring/:days', getExpiringFeed);

// @route   GET /api/feed
// @desc    Get all medicated feed inventory
// @access  Private (Farmer)
router.get('/', getFeedInventory);

// @route   POST /api/feed
// @desc    Add new medicated feed
// @access  Private (Farmer)
router.post('/', addFeedItem);

// @route   GET /api/feed/:id
// @desc    Get specific feed item
// @access  Private (Farmer)
router.get('/:id', getFeedById);

// @route   PUT /api/feed/:id
// @desc    Update feed item
// @access  Private (Farmer)
router.put('/:id', updateFeedItem);

// @route   DELETE /api/feed/:id
// @desc    Delete feed item
// @access  Private (Farmer)
router.delete('/:id', deleteFeedItem);

// @route   PATCH /api/feed/:id/consume
// @desc    Update feed quantity after consumption
// @access  Private (Farmer/System)
router.patch('/:id/consume', consumeFeed);

export default router;
