import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
    createVetVisitRequest,
    getVetVisitRequests,
    getVetVisitRequestById,
    respondToVetVisitRequest,
    completeVetVisit
} from '../controllers/vetVisitRequest.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Farmer creates visit request, both roles can list
router.route('/')
    .post(createVetVisitRequest)
    .get(getVetVisitRequests);

// Get single request
router.get('/:id', getVetVisitRequestById);

// Vet responds to request (accept/decline with date)
router.put('/:id/respond', respondToVetVisitRequest);

// Vet marks visit as complete
router.put('/:id/complete', completeVetVisit);

export default router;
