// Backend/routes/offlineTreatment.routes.js
// Routes for offline treatment records (non-registered farmers)

import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
    createOfflineTreatment,
    getMyOfflineTreatments,
    getOfflineTreatmentById,
    updateOfflineTreatment,
    deleteOfflineTreatment,
    resendPrescriptionEmail,
    getOfflineTreatmentStats
} from '../controllers/offlineTreatment.controller.js';

const router = express.Router();

// All routes require authentication (role check in controller)
router.use(protect);

// Statistics
router.get('/stats', getOfflineTreatmentStats);

// CRUD operations
router.post('/', createOfflineTreatment);
router.get('/', getMyOfflineTreatments);
router.get('/:id', getOfflineTreatmentById);
router.put('/:id', updateOfflineTreatment);
router.delete('/:id', deleteOfflineTreatment);

// Resend email
router.post('/:id/resend-email', resendPrescriptionEmail);

export default router;
