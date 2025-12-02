// backend/routes/reports.routes.js

import express from 'express';
import { generateAmuReport, generateFarmAmuReportForVet, generateVetSignedLog } from '../controllers/reports.controller.js';
import {
    getFarmerAmuReportData,
    getFarmerAnimalHealthReportData,
    getFarmerHerdDemographicsData,
    getFarmerTreatmentHistoryData,
    getFarmerMrlComplianceData
} from '../controllers/farmer.reports.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// PDF Generation Routes
router.post('/amu', protect, generateAmuReport);
router.post('/farm-amu', protect, generateFarmAmuReportForVet);
router.post('/vet-log', protect, generateVetSignedLog);

// Farmer Report Data Endpoints for Visualizations
router.get('/farmer/amu-data', protect, getFarmerAmuReportData);
router.get('/farmer/animal-health-data', protect, getFarmerAnimalHealthReportData);
router.get('/farmer/herd-demographics-data', protect, getFarmerHerdDemographicsData);
router.get('/farmer/treatment-history-data', protect, getFarmerTreatmentHistoryData);
router.get('/farmer/mrl-compliance-data', protect, getFarmerMrlComplianceData);

export default router;