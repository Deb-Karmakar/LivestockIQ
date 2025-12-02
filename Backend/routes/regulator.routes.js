// backend/routes/regulator.routes.js

import express from 'express';
import { getDashboardStats, getComplianceData, getTrendAnalysisData, getDemographicsData, getMapData, generateReport, getRegulatorProfile, updateRegulatorProfile, getHighAmuAlerts } from '../controllers/regulator.controller.js';
import { getDemographicsDataEnhanced } from '../controllers/demographicsEnhanced.controller.js';
import { getHighAmuAlertsEnhanced, getAmuConfiguration, updateAmuConfiguration, getAmuStatistics } from '../controllers/amuEnhanced.controller.js';
import {
    getComplianceReportData,
    getAmuTrendsReportData,
    getWhoAwareReportData,
    getVetOversightReportData,
    getFarmRiskReportData,
    getFeedVsTherapeuticReportData
} from '../controllers/reports.analytics.controller.js';
import { protect, protectRegulator } from '../middlewares/auth.middleware.js';

const router = express.Router();

// This route is protected, ensuring only logged-in regulators can access it
router.get('/dashboard-stats', protect, protectRegulator, getDashboardStats);
router.get('/compliance-data', protect, protectRegulator, getComplianceData);
router.get('/trends', protect, protectRegulator, getTrendAnalysisData);
router.get('/demographics', protect, protectRegulator, getDemographicsData);
router.get('/demographics-enhanced', protect, protectRegulator, getDemographicsDataEnhanced);
router.get('/map-data', protect, protectRegulator, getMapData);
router.post('/reports/generate', protect, protectRegulator, generateReport);

// New Report Data Endpoints for Visualizations
router.get('/reports/compliance-data', protect, protectRegulator, getComplianceReportData);
router.get('/reports/amu-trends-data', protect, protectRegulator, getAmuTrendsReportData);
router.get('/reports/who-aware-data', protect, protectRegulator, getWhoAwareReportData);
router.get('/reports/vet-oversight-data', protect, protectRegulator, getVetOversightReportData);
router.get('/reports/farm-risk-data', protect, protectRegulator, getFarmRiskReportData);
router.get('/reports/feed-vs-therapeutic-data', protect, protectRegulator, getFeedVsTherapeuticReportData);

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