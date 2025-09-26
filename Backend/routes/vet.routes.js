import express from 'express';
// 1. Import the new controller function
import { getMyFarmers, getVetByCode, getTreatmentRequests, getAnimalsForFarmerByVet, getVetProfile, updateVetProfile, reportFarmer, getVetDashboardData   } from '../controllers/vet.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.get('/dashboard', protect, getVetDashboardData);
router.get('/my-farmers', protect, getMyFarmers);
router.get('/code/:vetId', protect, getVetByCode);
// 2. Add the new route to get treatment requests
router.get('/treatment-requests', protect, getTreatmentRequests);

router.get('/farmers/:farmerId/animals', protect, getAnimalsForFarmerByVet);

router.route('/profile')
    .get(protect, getVetProfile)
    .put(protect, updateVetProfile);

router.post('/report-farmer', protect, reportFarmer);

export default router;