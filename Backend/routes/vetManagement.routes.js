// Backend/routes/vetManagement.routes.js

import express from 'express';
import {
    getAllVets,
    getVetDetails,
    getVetFarms,
    getVetPrescriptions,
    getVetCompliance
} from '../controllers/vetManagement.controller.js';
import { protect, protectRegulator } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication and regulator role
router.use(protect, protectRegulator);

// Vet management routes
router.get('/', getAllVets);
router.get('/:id', getVetDetails);
router.get('/:id/farms', getVetFarms);
router.get('/:id/prescriptions', getVetPrescriptions);
router.get('/:id/compliance', getVetCompliance);

export default router;
