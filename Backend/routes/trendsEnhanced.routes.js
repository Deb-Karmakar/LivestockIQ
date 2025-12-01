// New Enhanced Trends Routes - Backend/routes/trendsEnhanced.routes.js

import express from 'express';
import { getTrendAnalysisDataEnhanced } from '../controllers/trendsEnhanced.controller.js';
import { protect, protectRegulator } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Enhanced trends endpoint with time period support
router.get('/enhanced', protect, protectRegulator, getTrendAnalysisDataEnhanced);

export default router;
