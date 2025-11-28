// Backend/routes/regulatorAlerts.routes.js

import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
    getRegulatorAlerts,
    getAlertDashboardStats,
    getAlertById,
    acknowledgeAlert,
    updateAlertStatus,
    getFarmViolationHistory,
    exportViolationReport
} from '../controllers/regulatorAlerts.controller.js';

const router = express.Router();

// All routes require authentication (should be regulator role in production)

router.get('/alerts', protect, getRegulatorAlerts);
router.get('/alert-stats', protect, getAlertDashboardStats);
router.get('/alerts/:id', protect, getAlertById);
router.put('/alerts/:id/acknowledge', protect, acknowledgeAlert);
router.put('/alerts/:id/status', protect, updateAlertStatus);
router.get('/farms/:farmerId/violations', protect, getFarmViolationHistory);
router.get('/export-violations', protect, exportViolationReport);

export default router;
