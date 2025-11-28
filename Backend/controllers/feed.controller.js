// Backend/controllers/feed.controller.js

import Feed from '../models/feed.model.js';
import FeedAdministration from '../models/feedAdministration.model.js';
import { createAuditLog } from '../services/auditLog.service.js';

// @desc    Get all medicated feed inventory for a farmer
// @route   GET /api/feed
// @access  Private (Farmer)
export const getFeedInventory = async (req, res) => {
    try {
        const { includeInactive } = req.query;

        const query = { farmerId: req.user._id };
        if (!includeInactive) {
            query.isActive = true;
        }

        const feeds = await Feed.find(query)
            .populate('vetPrescriptionId')
            .sort({ expiryDate: 'asc' });

        res.json(feeds);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get specific feed item by ID
// @route   GET /api/feed/:id
// @access  Private (Farmer)
export const getFeedById = async (req, res) => {
    try {
        const feed = await Feed.findById(req.params.id)
            .populate('vetPrescriptionId');

        if (!feed) {
            return res.status(404).json({ message: 'Feed item not found' });
        }

        // Verify ownership
        if (feed.farmerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to access this feed item' });
        }

        res.json(feed);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Add new medicated feed to inventory
// @route   POST /api/feed
// @access  Private (Farmer)
export const addFeedItem = async (req, res) => {
    try {
        const feedData = {
            ...req.body,
            farmerId: req.user._id,
            remainingQuantity: req.body.totalQuantity // Initially, remaining = total
        };

        const feed = new Feed(feedData);
        const createdFeed = await feed.save();

        // Audit log
        await createAuditLog({
            eventType: 'CREATE',
            entityType: 'Feed',
            entityId: createdFeed._id,
            farmerId: req.user._id,
            performedBy: req.user._id,
            performedByRole: 'Farmer',
            performedByModel: 'Farmer',
            dataSnapshot: createdFeed.toObject(),
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.status(201).json(createdFeed);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: `Error adding feed: ${error.message}` });
    }
};

// @desc    Update feed inventory item
// @route   PUT /api/feed/:id
// @access  Private (Farmer)
export const updateFeedItem = async (req, res) => {
    try {
        const feed = await Feed.findById(req.params.id);

        if (!feed) {
            return res.status(404).json({ message: 'Feed item not found' });
        }

        // Verify ownership
        if (feed.farmerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this feed item' });
        }

        const oldData = feed.toObject();

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined) {
                feed[key] = req.body[key];
            }
        });

        const updatedFeed = await feed.save();

        // Audit log
        const changes = {};
        Object.keys(req.body).forEach(key => {
            if (JSON.stringify(oldData[key]) !== JSON.stringify(req.body[key])) {
                changes[key] = { from: oldData[key], to: req.body[key] };
            }
        });

        await createAuditLog({
            eventType: 'UPDATE',
            entityType: 'Feed',
            entityId: feed._id,
            farmerId: req.user._id,
            performedBy: req.user._id,
            performedByRole: 'Farmer',
            performedByModel: 'Farmer',
            dataSnapshot: updatedFeed.toObject(),
            changes,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.json(updatedFeed);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: `Error updating feed: ${error.message}` });
    }
};

// @desc    Delete feed inventory item
// @route   DELETE /api/feed/:id
// @access  Private (Farmer)
export const deleteFeedItem = async (req, res) => {
    try {
        const feed = await Feed.findById(req.params.id);

        if (!feed) {
            return res.status(404).json({ message: 'Feed item not found' });
        }

        // Verify ownership
        if (feed.farmerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this feed item' });
        }

        // Check if feed has been used in any administrations
        const administrations = await FeedAdministration.find({ feedId: feed._id });
        if (administrations.length > 0) {
            return res.status(400).json({
                message: 'Cannot delete feed that has been used in administrations. Consider marking as inactive instead.'
            });
        }

        await feed.deleteOne();

        // Audit log
        await createAuditLog({
            eventType: 'DELETE',
            entityType: 'Feed',
            entityId: feed._id,
            farmerId: req.user._id,
            performedBy: req.user._id,
            performedByRole: 'Farmer',
            performedByModel: 'Farmer',
            dataSnapshot: feed.toObject(),
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                notes: 'Feed item deleted from inventory'
            }
        });

        res.json({ message: 'Feed item removed successfully' });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get expiring feed items
// @route   GET /api/feed/expiring/:days
// @access  Private (Farmer)
export const getExpiringFeed = async (req, res) => {
    try {
        const days = parseInt(req.params.days) || 30;
        const expiringFeed = await Feed.findExpiringFeed(req.user._id, days);

        res.json(expiringFeed);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get active medicated feed
// @route   GET /api/feed/active
// @access  Private (Farmer)
export const getActiveFeed = async (req, res) => {
    try {
        const activeFeed = await Feed.findActiveFeed(req.user._id);
        res.json(activeFeed);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Update feed quantity after consumption
// @route   PATCH /api/feed/:id/consume
// @access  Private (Farmer/System)
export const consumeFeed = async (req, res) => {
    try {
        const { quantityUsed } = req.body;

        if (!quantityUsed || quantityUsed <= 0) {
            return res.status(400).json({ message: 'Valid quantity is required' });
        }

        const feed = await Feed.findById(req.params.id);

        if (!feed) {
            return res.status(404).json({ message: 'Feed item not found' });
        }

        // Verify ownership
        if (feed.farmerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const updatedFeed = await feed.consumeFeed(quantityUsed);

        res.json(updatedFeed);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get feed inventory statistics
// @route   GET /api/feed/stats
// @access  Private (Farmer)
export const getFeedStats = async (req, res) => {
    try {
        const feeds = await Feed.find({ farmerId: req.user._id, isActive: true });

        const stats = {
            totalItems: feeds.length,
            totalValue: feeds.reduce((sum, feed) => sum + (feed.costPerUnit * feed.remainingQuantity || 0), 0),
            lowStockItems: feeds.filter(feed => feed.isLowStock).length,
            expiringItems: feeds.filter(feed => feed.isExpiringSoon).length,
            expiredItems: feeds.filter(feed => feed.isExpired).length,
            byAntimicrobial: {}
        };

        // Group by antimicrobial
        feeds.forEach(feed => {
            // Ensure antimicrobialName exists
            if (feed.antimicrobialName) {
                if (!stats.byAntimicrobial[feed.antimicrobialName]) {
                    stats.byAntimicrobial[feed.antimicrobialName] = {
                        count: 0,
                        totalQuantity: 0,
                        totalAntimicrobialContent: 0
                    };
                }
                stats.byAntimicrobial[feed.antimicrobialName].count++;
                stats.byAntimicrobial[feed.antimicrobialName].totalQuantity += feed.remainingQuantity || 0;

                // Safely calculate total antimicrobial content
                try {
                    const content = feed.getTotalAntimicrobialContent();
                    stats.byAntimicrobial[feed.antimicrobialName].totalAntimicrobialContent += content || 0;
                } catch (err) {
                    console.error('Error calculating antimicrobial content:', err);
                    stats.byAntimicrobial[feed.antimicrobialName].totalAntimicrobialContent += 0;
                }
            }
        });

        res.json(stats);
    } catch (error) {
        console.error('getFeedStats error:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};
