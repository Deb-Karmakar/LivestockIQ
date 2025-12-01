// Backend/routes/farmManagement.routes.js

import express from 'express';
import {
    getAllFarms,
    getFarmDetails,
    getFarmAnimals,
    getFarmTreatments,
    getFarmCompliance,
    getFarmFeedBatches
} from '../controllers/farmManagement.controller.js';
import { protect, protectRegulator } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication and regulator role
router.use(protect, protectRegulator);

// Farm management routes
router.get('/', getAllFarms);
router.get('/:id', getFarmDetails);
router.get('/:id/animals', getFarmAnimals);
router.get('/:id/treatments', getFarmTreatments);
router.get('/:id/compliance', getFarmCompliance);
router.get('/:id/feed-batches', getFarmFeedBatches);

export default router;
