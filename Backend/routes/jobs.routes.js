// Backend/routes/jobs.routes.js

import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
    triggerWithdrawalCheck,
    triggerWeeklySummaries,
    triggerMRLReminders,
    getJobStatus
} from '../controllers/jobs.controller.js';

const router = express.Router();

// All routes require authentication (in production, should be admin-only)

router.get('/status', protect, getJobStatus);
router.post('/withdrawal-check', protect, triggerWithdrawalCheck);
router.post('/weekly-summaries', protect, triggerWeeklySummaries);
router.post('/mrl-reminders', protect, triggerMRLReminders);

export default router;
