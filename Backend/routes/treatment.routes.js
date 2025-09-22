import express from 'express';
// 1. Import the new controller function
import { addTreatment, getMyTreatments, updateTreatmentByVet } from '../controllers/treatment.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getMyTreatments)
    .post(protect, addTreatment);
    
// 2. Add the new route for a vet to update a treatment
router.put('/:id/vet-update', protect, updateTreatmentByVet);

export default router;