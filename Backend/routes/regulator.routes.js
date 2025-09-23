// backend/routes/regulator.routes.js

import express from 'express';
import { getDashboardStats, getComplianceData, getTrendAnalysisData, getDemographicsData, getMapData   } from '../controllers/regulator.controller.js';
import { protect, protectRegulator } from '../middlewares/auth.middleware.js';

const router = express.Router();

// This route is protected, ensuring only logged-in regulators can access it
router.get('/dashboard-stats', protect, protectRegulator, getDashboardStats);
router.get('/compliance-data', protect, protectRegulator, getComplianceData);
router.get('/trends', protect, protectRegulator, getTrendAnalysisData);
router.get('/demographics', protect, protectRegulator, getDemographicsData);
router.get('/map-data', protect, protectRegulator, getMapData)


export default router;