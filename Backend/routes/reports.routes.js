// backend/routes/reports.routes.js

import express from 'express';
import { generateAmuReport, generateFarmAmuReportForVet, generateVetSignedLog } from '../controllers/reports.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/amu', protect, generateAmuReport);

router.post('/farm-amu', protect, generateFarmAmuReportForVet);
router.post('/vet-log', protect, generateVetSignedLog);

export default router;