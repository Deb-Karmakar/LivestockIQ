// Additional controller functions for AMU management

import AmuConfig from '../models/amuConfig.model.js';
import HighAmuAlert from '../models/highAmuAlert.model.js';
import * as amuStats from '../services/amuStatistics.service.js';
import { subMonths } from 'date-fns';
import Treatment from '../models/treatment.model.js';

// Get Enhanced High AMU Alerts with filtering
export const getHighAmuAlertsEnhanced = async (req, res) => {
    try {
        const { status, severity, alertType } = req.query;

        const query = {};
        if (status) query.status = status;
        if (severity) query.severity = severity;
        if (alertType) query.alertType = alertType;

        const alerts = await HighAmuAlert.find(query)
            .populate('farmerId', 'farmName farmOwner herdSize speciesReared')
            .sort({ severity: -1, createdAt: -1 });
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Get AMU Configuration
export const getAmuConfiguration = async (req, res) => {
    try {
        let config = await AmuConfig.findOne({ isActive: true });

        if (!config) {
            // Create default if none exists
            config = await AmuConfig.create({
                historicalSpikeThreshold: 2.0,
                peerComparisonThreshold: 1.5,
                absoluteIntensityThreshold: 0.5,
                trendIncreaseThreshold: 0.30,
                criticalDrugThreshold: 0.40,
                sustainedHighUsageDuration: 4,
                minimumEventsThreshold: 5,
                isActive: true
            });
        }

        res.json(config);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Update AMU Configuration
export const updateAmuConfiguration = async (req, res) => {
    try {
        console.log('Update AMU Config Request Body:', req.body);
        console.log('User:', req.user);

        // Validate request body
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                message: 'Request body is empty. Please provide configuration fields to update.',
                example: {
                    historicalSpikeThreshold: 2.5,
                    peerComparisonThreshold: 1.8,
                    absoluteIntensityThreshold: 0.6
                }
            });
        }

        const config = await AmuConfig.findOne({ isActive: true });

        if (!config) {
            return res.status(404).json({ message: 'AMU configuration not found' });
        }

        // Update allowed fields
        const allowedFields = [
            'historicalSpikeThreshold',
            'peerComparisonThreshold',
            'absoluteIntensityThreshold',
            'trendIncreaseThreshold',
            'criticalDrugThreshold',
            'sustainedHighUsageDuration',
            'minimumEventsThreshold'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                config[field] = req.body[field];
            }
        });

        // Only set updatedBy if req.user exists
        if (req.user && req.user._id) {
            config.updatedBy = req.user._id;
        }

        await config.save();

        res.json(config);
    } catch (error) {
        console.error('Error updating AMU configuration:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Get Enhanced AMU Statistics
export const getAmuStatistics = async (req, res) => {
    try {
        const { farmerId, months = 6 } = req.query;
        const oneMonthAgo = subMonths(new Date(), 1);
        const now = new Date();

        if (farmerId) {
            // Get statistics for specific farm
            const [intensityData, trendData, drugBreakdown] = await Promise.all([
                amuStats.calculateAmuIntensity(farmerId, oneMonthAgo, now),
                amuStats.getAmuTrend(farmerId, parseInt(months)),
                amuStats.getDrugClassBreakdown(farmerId, oneMonthAgo, now)
            ]);

            res.json({
                farmerId,
                currentIntensity: intensityData,
                trend: trendData,
                drugClassBreakdown: drugBreakdown
            });
        } else {
            // Get aggregate statistics
            const [alertStats, drugClassStats] = await Promise.all([
                HighAmuAlert.aggregate([
                    { $match: { status: 'New' } },
                    { $group: { _id: '$alertType', count: { $sum: 1 } } }
                ]),
                Treatment.aggregate([
                    { $match: { status: 'Approved', createdAt: { $gte: oneMonthAgo } } },
                    { $group: { _id: '$drugClass', count: { $sum: 1 } } }
                ])
            ]);

            res.json({
                alertTypeDistribution: alertStats,
                drugClassDistribution: drugClassStats
            });
        }
    } catch (error) {
        console.error('Error getting AMU statistics:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};
