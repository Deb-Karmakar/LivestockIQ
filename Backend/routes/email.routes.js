// Backend/routes/email.routes.js

import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
    testEmailConfiguration,
    triggerWithdrawalAlert,
    triggerMRLViolationAlert,
    triggerWeeklySummary
} from '../controllers/email.controller.js';

const router = express.Router();

// All routes require authentication
// In production, these should be admin-only

router.post('/test', protect, testEmailConfiguration);
router.post('/withdrawal-alert', protect, triggerWithdrawalAlert);
router.post('/mrl-violation-alert', protect, triggerMRLViolationAlert);
router.post('/weekly-summary', protect, triggerWeeklySummary);

export default router;
