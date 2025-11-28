// Backend/controllers/regulatorAlerts.controller.js

import RegulatorAlert from '../models/regulatorAlert.model.js';
import Farmer from '../models/farmer.model.js';
import LabTest from '../models/labTest.model.js';

/**
 * Regulator Alert Management Controller
 */

// @desc    Get all regulator alerts with pagination and filtering
// @route   GET /api/regulator/alerts
// @access  Private (Regulator)
export const getRegulatorAlerts = async (req, res) => {
    try {
        const {
            status,
            severity,
            alertType,
            riskLevel,
            farmerId,
            page = 1,
            limit = 20
        } = req.query;

        // Build query
        let query = {};

        if (status) query.status = status;
        if (severity) query.severity = severity;
        if (alertType) query.alertType = alertType;
        if (riskLevel) query.riskLevel = riskLevel;
        if (farmerId) query.farmerId = farmerId;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [alerts, total] = await Promise.all([
            RegulatorAlert.find(query)
                .populate('farmerId', 'farmName farmOwner phoneNumber email location')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            RegulatorAlert.countDocuments(query)
        ]);

        res.json({
            alerts,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get alerts dashboard statistics for regulators
// @route   GET /api/regulator/alert-stats
// @access  Private (Regulator)
export const getAlertDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get alert statistics
        const [
            totalAlerts,
            newAlerts,
            criticalAlerts,
            alertsByType,
            alertsBySeverity,
            recentViolations
        ] = await Promise.all([
            RegulatorAlert.countDocuments(),
            RegulatorAlert.countDocuments({ status: 'NEW' }),
            RegulatorAlert.countDocuments({ severity: 'CRITICAL', status: { $ne: 'RESOLVED' } }),

            // Alerts by type
            RegulatorAlert.aggregate([
                { $group: { _id: '$alertType', count: { $sum: 1 } } }
            ]),

            // Alerts by severity
            RegulatorAlert.aggregate([
                { $group: { _id: '$severity', count: { $sum: 1 } } }
            ]),

            // Recent violations (last 30 days)
            RegulatorAlert.countDocuments({
                alertType: 'MRL_VIOLATION',
                createdAt: { $gte: thirtyDaysAgo }
            })
        ]);

        // Get top violating farms
        const topViolators = await RegulatorAlert.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: '$farmerId',
                    violationCount: { $sum: 1 },
                    farmName: { $first: '$farmName' },
                    lastViolation: { $max: '$createdAt' }
                }
            },
            { $sort: { violationCount: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            summary: {
                totalAlerts,
                newAlerts,
                criticalAlerts,
                recentViolations
            },
            alertsByType: alertsByType.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            alertsBySeverity: alertsBySeverity.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            topViolators
        });

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get single alert with full details
// @route   GET /api/regulator/alerts/:id
// @access  Private (Regulator)
export const getAlertById = async (req, res) => {
    try {
        const alert = await RegulatorAlert.findById(req.params.id)
            .populate('farmerId', 'farmName farmOwner phoneNumber email location')
            .populate('violationDetails.labTestId')
            .populate('acknowledgedBy', 'fullName email')
            .populate('resolvedBy', 'fullName email');

        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        // Get related alerts for this farm
        const relatedAlerts = await RegulatorAlert.find({
            farmerId: alert.farmerId,
            _id: { $ne: alert._id }
        })
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            alert,
            relatedAlerts
        });

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Acknowledge alert
// @route   PUT /api/regulator/alerts/:id/acknowledge
// @access  Private (Regulator)
export const acknowledgeAlert = async (req, res) => {
    try {
        const alert = await RegulatorAlert.findById(req.params.id);

        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        alert.status = 'ACKNOWLEDGED';
        alert.acknowledgedBy = req.user._id;
        alert.acknowledgedAt = new Date();

        await alert.save();

        res.json({
            message: 'Alert acknowledged',
            alert
        });

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Update alert status (investigating, resolved, escalated)
// @route   PUT /api/regulator/alerts/:id/status
// @access  Private (Regulator)
export const updateAlertStatus = async (req, res) => {
    try {
        const { status, notes, actionTaken } = req.body;
        const alert = await RegulatorAlert.findById(req.params.id);

        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        alert.status = status;

        if (notes) {
            alert.investigationNotes = notes;
        }

        if (actionTaken) {
            alert.actionTaken = actionTaken;
        }

        if (status === 'RESOLVED') {
            alert.resolvedBy = req.user._id;
            alert.resolvedAt = new Date();
            alert.resolutionNotes = notes;

            // If this is an MRL violation, mark the lab test as resolved so farmer can re-test
            if (alert.alertType === 'MRL_VIOLATION' && alert.violationDetails?.labTestId) {
                await LabTest.findByIdAndUpdate(alert.violationDetails.labTestId, {
                    violationResolved: true
                });
            }
        }

        await alert.save();

        res.json({
            message: `Alert status updated to ${status}`,
            alert
        });

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get farm violation history
// @route   GET /api/regulator/farms/:farmerId/violations
// @access  Private (Regulator)
export const getFarmViolationHistory = async (req, res) => {
    try {
        const { farmerId } = req.params;

        const farmer = await Farmer.findById(farmerId);
        if (!farmer) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        // Get all alerts for this farm
        const alerts = await RegulatorAlert.find({ farmerId })
            .sort({ createdAt: -1 });

        // Get MRL test history
        const mrlTests = await LabTest.find({ farmerId })
            .sort({ testDate: -1 })
            .limit(20);

        // Calculate statistics
        const stats = {
            totalAlerts: alerts.length,
            criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length,
            resolvedAlerts: alerts.filter(a => a.status === 'RESOLVED').length,
            pendingAlerts: alerts.filter(a => a.status !== 'RESOLVED').length,
            mrlViolations: alerts.filter(a => a.alertType === 'MRL_VIOLATION').length,
            blockedSaleAttempts: alerts.filter(a => a.alertType === 'BLOCKED_SALE_ATTEMPT').length,
            totalMRLTests: mrlTests.length,
            passedTests: mrlTests.filter(t => t.isPassed).length,
            failedTests: mrlTests.filter(t => !t.isPassed).length
        };

        res.json({
            farm: {
                id: farmer._id,
                name: farmer.farmName || farmer.farmOwner,
                owner: farmer.farmOwner,
                location: farmer.location,
                contact: farmer.phoneNumber,
                email: farmer.email
            },
            statistics: stats,
            alerts,
            recentMRLTests: mrlTests
        });

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Export compliance report (CSV/PDF)
// @route   GET /api/regulator/export-violations
// @access  Private (Regulator)
export const exportViolationReport = async (req, res) => {
    try {
        const { startDate, endDate, format = 'json' } = req.query;

        const query = {};
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const alerts = await RegulatorAlert.find(query)
            .populate('farmerId', 'farmName farmOwner location')
            .sort({ createdAt: -1 });

        if (format === 'csv') {
            // Generate CSV
            const csv = generateCSV(alerts);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=violation-report.csv');
            res.send(csv);
        } else {
            // Return JSON with summary
            res.json({
                period: { startDate, endDate },
                summary: {
                    totalAlerts: alerts.length,
                    byType: getCountByField(alerts, 'alertType'),
                    bySeverity: getCountByField(alerts, 'severity'),
                    byStatus: getCountByField(alerts, 'status')
                },
                alerts
            });
        }

    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Helper: Generate CSV from alerts
const generateCSV = (alerts) => {
    const headers = ['Date', 'Farm Name', 'Alert Type', 'Severity', 'Status', 'Message', 'Location'];
    const rows = alerts.map(alert => [
        new Date(alert.createdAt).toLocaleDateString(),
        alert.farmName || 'Unknown',
        alert.alertType,
        alert.severity,
        alert.status,
        alert.message,
        alert.farmLocation || 'Unknown'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
};

// Helper: Count by field
const getCountByField = (alerts, field) => {
    return alerts.reduce((acc, alert) => {
        acc[alert[field]] = (acc[alert[field]] || 0) + 1;
        return acc;
    }, {});
};
