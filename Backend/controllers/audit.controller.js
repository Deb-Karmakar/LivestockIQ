import {
    createAuditLog,
    getAuditTrail,
    getFarmAuditLogs,
    verifyIntegrity,
    verifyFarmIntegrity,
    getRecentAuditLogs,
} from '../services/auditLog.service.js';

// @desc    Get audit trail for a specific entity
// @route   GET /api/audit/trail/:entityType/:entityId
// @access  Private (Farmer, Vet, Regulator, Admin)
export const getEntityAuditTrail = async (req, res) => {
    try {
        const { entityType, entityId } = req.params;

        const auditLogs = await getAuditTrail(entityType, entityId);

        res.json({
            success: true,
            count: auditLogs.length,
            data: auditLogs,
        });
    } catch (error) {
        console.error('Error getting audit trail:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Verify integrity of audit trail for an entity
// @route   GET /api/audit/verify/:entityType/:entityId
// @access  Private (Farmer, Vet, Regulator, Admin)
export const verifyEntityIntegrity = async (req, res) => {
    try {
        const { entityType, entityId } = req.params;

        const verificationResult = await verifyIntegrity(entityType, entityId);

        res.json({
            success: true,
            verification: verificationResult,
        });
    } catch (error) {
        console.error('Error verifying integrity:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get all audit logs for a farm
// @route   GET /api/audit/farm/:farmerId
// @access  Private (Regulator, Admin, or own farm)
export const getFarmAuditTrail = async (req, res) => {
    try {
        const { farmerId } = req.params;

        // Authorization: Only regulators, admins, or the farmer themselves can access
        const isAuthorized =
            req.user.role === 'Regulator' ||
            req.user.role === 'Admin' ||
            req.user._id.toString() === farmerId;

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized to access this farm\'s audit logs' });
        }

        const options = {
            limit: parseInt(req.query.limit) || 100,
            skip: parseInt(req.query.skip) || 0,
            eventType: req.query.eventType,
            entityType: req.query.entityType,
        };

        const auditLogs = await getFarmAuditLogs(farmerId, options);

        res.json({
            success: true,
            count: auditLogs.length,
            data: auditLogs,
        });
    } catch (error) {
        console.error('Error getting farm audit logs:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Verify integrity of entire farm's audit trail
// @route   GET /api/audit/verify-farm/:farmerId
// @access  Private (Regulator, Admin, or own farm)
export const verifyFarmAuditIntegrity = async (req, res) => {
    try {
        const { farmerId } = req.params;

        // Authorization check
        const isAuthorized =
            req.user.role === 'Regulator' ||
            req.user.role === 'Admin' ||
            req.user._id.toString() === farmerId;

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized to verify this farm\'s audit logs' });
        }

        const verificationResult = await verifyFarmIntegrity(farmerId);

        res.json({
            success: true,
            verification: verificationResult,
        });
    } catch (error) {
        console.error('Error verifying farm integrity:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get recent audit logs (for dashboard)
// @route   GET /api/audit/recent
// @access  Private (Regulator, Admin)
export const getRecentAudits = async (req, res) => {
    try {
        // Only regulators and admins can access recent audits across all farms
        const userRole = req.user.role.toLowerCase();
        if (userRole !== 'regulator' && userRole !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to access recent audit logs' });
        }

        const limit = parseInt(req.query.limit) || 50;
        const auditLogs = await getRecentAuditLogs(limit);

        res.json({
            success: true,
            count: auditLogs.length,
            data: auditLogs,
        });
    } catch (error) {
        console.error('Error getting recent audit logs:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get audit logs for logged-in farmer
// @route   GET /api/audit/my-logs
// @access  Private (Farmer)
export const getMyAuditLogs = async (req, res) => {
    try {
        const options = {
            limit: parseInt(req.query.limit) || 100,
            skip: parseInt(req.query.skip) || 0,
            eventType: req.query.eventType,
            entityType: req.query.entityType,
        };

        const auditLogs = await getFarmAuditLogs(req.user._id, options);

        res.json({
            success: true,
            count: auditLogs.length,
            data: auditLogs,
        });
    } catch (error) {
        console.error('Error getting my audit logs:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};
