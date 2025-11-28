// Backend/routes/mrl.routes.js

import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
    getMRLLimits,
    lookupMRL,
    submitLabTest,
    getAnimalMRLStatus,
    getMyLabTests,
    getAnimalsPendingMRLTest
} from '../controllers/mrl.controller.js';

const router = express.Router();

// Public routes (for reference)
router.get('/limits', getMRLLimits);
router.get('/lookup', lookupMRL);

// Protected routes (Farmer only)
router.post('/test-result', protect, submitLabTest);
router.get('/animal/:animalId/status', protect, getAnimalMRLStatus);
router.get('/my-tests', protect, getMyLabTests);
router.get('/pending-tests', protect, getAnimalsPendingMRLTest);

export default router;
