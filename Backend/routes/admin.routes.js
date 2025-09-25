// backend/routes/admin.routes.js
import express from 'express';
import { triggerAmuAnalysis } from '../controllers/admin.controller.js';
import { protect, protectAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// This endpoint will be used for testing
router.post('/trigger-amu-analysis', protect, triggerAmuAnalysis);

export default router;