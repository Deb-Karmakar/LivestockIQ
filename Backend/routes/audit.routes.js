import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
    getEntityAuditTrail,
    verifyEntityIntegrity,
    getFarmAuditTrail,
    verifyFarmAuditIntegrity,
    getRecentAudits,
    getMyAuditLogs,
} from '../controllers/audit.controller.js';

const router = express.Router();

// Get audit trail for a specific entity
router.get('/trail/:entityType/:entityId', protect, getEntityAuditTrail);

// Verify integrity of audit trail for an entity
router.get('/verify/:entityType/:entityId', protect, verifyEntityIntegrity);

// Get all audit logs for a specific farm
router.get('/farm/:farmerId', protect, getFarmAuditTrail);

// Verify integrity of entire farm's audit trail
router.get('/verify-farm/:farmerId', protect, verifyFarmAuditIntegrity);

// Get recent audit logs across all farms (admin/regulator only)
router.get('/recent', protect, getRecentAudits);

// Get audit logs for logged-in farmer
router.get('/my-logs', protect, getMyAuditLogs);

export default router;
