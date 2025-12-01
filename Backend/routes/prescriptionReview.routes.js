// Backend/routes/prescriptionReview.routes.js

import express from 'express';
import {
    getAllPrescriptions,
    getPrescriptionDetails,
    getPrescriptionStats
} from '../controllers/prescriptionReview.controller.js';
import { protect, protectRegulator } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication and regulator role
router.use(protect, protectRegulator);

// Prescription review routes
router.get('/stats', getPrescriptionStats); // Must be before /:id to avoid route conflict
router.get('/', getAllPrescriptions);
router.get('/:id', getPrescriptionDetails);

export default router;
