// backend/routes/admin.routes.js

import express from 'express';
// 1. Import the new controller function
import { triggerAmuAnalysis, triggerPeerAnalysis, triggerDiseasePrediction  } from '../controllers/admin.controller.js';
import { protect, protectAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// This endpoint triggers the HISTORICAL spike analysis
router.post('/trigger-amu-analysis', protect, protectAdmin, triggerAmuAnalysis);

// 2. Add the new route for the PEER-GROUP analysis
router.post('/trigger-peer-analysis', protect, protectAdmin, triggerPeerAnalysis);
router.post('/trigger-disease-prediction', protect, protectAdmin, triggerDiseasePrediction);


export default router;