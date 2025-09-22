import express from 'express';
// 1. Import the new controller function
import { getMyFarmers, getVetByCode, getTreatmentRequests } from '../controllers/vet.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/my-farmers', protect, getMyFarmers);
router.get('/code/:vetId', protect, getVetByCode);
// 2. Add the new route to get treatment requests
router.get('/treatment-requests', protect, getTreatmentRequests);

export default router;