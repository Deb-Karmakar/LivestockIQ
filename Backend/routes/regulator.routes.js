// backend/routes/regulator.routes.js

import express from 'express';
import { getDashboardStats, getComplianceData, getTrendAnalysisData, getDemographicsData, getMapData, generateComplianceReport, getRegulatorProfile, updateRegulatorProfile, getHighAmuAlerts } from '../controllers/regulator.controller.js';
import { getDemographicsDataEnhanced } from '../controllers/demographicsEnhanced.controller.js';
import { getHighAmuAlertsEnhanced, getAmuConfiguration, updateAmuConfiguration, getAmuStatistics } from '../controllers/amuEnhanced.controller.js';
import { protect, protectRegulator } from '../middlewares/auth.middleware.js';

const router = express.Router();

// This route is protected, ensuring only logged-in regulators can access it
router.get('/dashboard-stats', protect, protectRegulator, getDashboardStats);
router.get('/compliance-data', protect, protectRegulator, getComplianceData);
router.get('/trends', protect, protectRegulator, getTrendAnalysisData);
router.get('/demographics', protect, protectRegulator, getDemographicsData);
router.get('/demographics-enhanced', protect, protectRegulator, getDemographicsDataEnhanced);
router.get('/map-data', protect, protectRegulator, getMapData);
router.post('/reports/compliance', protect, protectRegulator, generateComplianceReport);
router.route('/profile')
    .get(protect, protectRegulator, getRegulatorProfile)
    .put(protect, protectRegulator, updateRegulatorProfile);

// Enhanced AMU Management Routes
router.get('/high-amu-alerts', protect, protectRegulator, getHighAmuAlerts);
router.get('/amu-alerts-enhanced', protect, protectRegulator, getHighAmuAlertsEnhanced);
router.get('/amu-config', protect, protectRegulator, getAmuConfiguration);
router.put('/amu-config', protect, protectRegulator, updateAmuConfiguration);
router.get('/amu-statistics', protect, protectRegulator, getAmuStatistics);

export default router;