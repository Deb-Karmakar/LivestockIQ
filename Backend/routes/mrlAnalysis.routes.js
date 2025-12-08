// Backend/routes/mrlAnalysis.routes.js
// Routes for regulator MRL analysis

import express from 'express';
import { protect, protectRegulator } from '../middlewares/auth.middleware.js';
import {
    getMRLAnalysisDashboard,
    getAllLabTests,
    reviewLabTest,
    getFilterOptions,
    exportMRLDataToCSV
} from '../controllers/mrlAnalysis.controller.js';

const router = express.Router();

// All routes require authentication and regulator role
router.use(protect);
router.use(protectRegulator);

// Dashboard with analytics
router.get('/dashboard', getMRLAnalysisDashboard);

// Get all tests with pagination and filters
router.get('/tests', getAllLabTests);

// Get filter options for dropdowns
router.get('/filters', getFilterOptions);

// Review (approve/reject/flag) a test
router.patch('/tests/:id/review', reviewLabTest);

// Export MRL data to CSV
router.get('/export-csv', exportMRLDataToCSV);

export default router;
