// backend/routes/regulator.routes.js

import express from 'express';
import { getDashboardStats, getComplianceData, getTrendAnalysisData, getDemographicsData, getMapData, generateComplianceReport, getRegulatorProfile, updateRegulatorProfile   } from '../controllers/regulator.controller.js';
import { protect, protectRegulator } from '../middlewares/auth.middleware.js';

const router = express.Router();

// This route is protected, ensuring only logged-in regulators can access it
router.get('/dashboard-stats', protect, protectRegulator, getDashboardStats);
router.get('/compliance-data', protect, protectRegulator, getComplianceData);
router.get('/trends', protect, protectRegulator, getTrendAnalysisData);
router.get('/demographics', protect, protectRegulator, getDemographicsData);
router.get('/map-data', protect, protectRegulator, getMapData);
router.post('/reports/compliance', protect, protectRegulator, generateComplianceReport);
router.route('/profile')
    .get(protect, protectRegulator, getRegulatorProfile)
    .put(protect, protectRegulator, updateRegulatorProfile);

export default router;