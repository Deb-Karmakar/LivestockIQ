// Backend/controllers/systemAmuAlert.controller.js
// Controller for system-wide AMU alerts (regulator only)

import HighAmuAlert from '../models/highAmuAlert.model.js';

/**
 * Get all system-wide AMU alerts
 * Supports filtering by status, severity, alertType
 */
export const getSystemAmuAlerts = async (req, res) => {
    try {
        const { status, severity, alertType } = req.query;

        // Build query for system-wide alerts only
        const query = {
            $or: [
                { isSystemWide: true },
                { alertType: { $in: ['SYSTEM_CRITICAL_DRUG_USAGE', 'SYSTEM_HIGH_AMU_INTENSITY'] } }
            ]
        };

        // Apply filters
        if (status) query.status = status;
        if (severity) query.severity = severity;
        if (alertType) query.alertType = alertType;

        const alerts = await HighAmuAlert.find(query)
            .sort({ severity: -1, createdAt: -1 })
            .lean();

        // Calculate stats
        const stats = {
            total: alerts.length,
            new: alerts.filter(a => a.status === 'New').length,
            acknowledged: alerts.filter(a => a.status === 'Acknowledged').length,
            resolved: alerts.filter(a => a.status === 'Resolved').length,
            critical: alerts.filter(a => a.severity === 'Critical').length,
            high: alerts.filter(a => a.severity === 'High').length,
        };

        res.json({ alerts, stats });
    } catch (error) {
        console.error('Error fetching system AMU alerts:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * Acknowledge a system AMU alert
 */
export const acknowledgeSystemAmuAlert = async (req, res) => {
    try {
        const { id } = req.params;

        const alert = await HighAmuAlert.findByIdAndUpdate(
            id,
            {
                status: 'Acknowledged',
                acknowledgedBy: req.user._id,
                acknowledgedAt: new Date()
            },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        res.json({ message: 'Alert acknowledged', alert });
    } catch (error) {
        console.error('Error acknowledging system AMU alert:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * Update system AMU alert status
 */
export const updateSystemAmuAlertStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        if (!['New', 'Acknowledged', 'Resolved'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const updateData = { status };
        if (notes) updateData.notes = notes;
        if (status === 'Acknowledged') {
            updateData.acknowledgedBy = req.user._id;
            updateData.acknowledgedAt = new Date();
        }

        const alert = await HighAmuAlert.findByIdAndUpdate(id, updateData, { new: true });

        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        res.json({ message: 'Alert status updated', alert });
    } catch (error) {
        console.error('Error updating system AMU alert status:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};
