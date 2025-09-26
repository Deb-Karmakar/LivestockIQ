// In backend/routes/farmer.routes.js
import express from 'express';
// 1. Import the new controller function
import { getFarmerProfile, updateFarmerProfile, getMyHighAmuAlerts, getHighAmuAlertDetails, getMyDiseaseAlerts   } from '../controllers/farmer.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/profile')
    .get(protect, getFarmerProfile)
    .put(protect, updateFarmerProfile);

// 2. Add the new route for fetching alerts
router.get('/high-amu-alerts', protect, getMyHighAmuAlerts);
router.get('/high-amu-alerts/:alertId/details', protect, getHighAmuAlertDetails);
router.get('/disease-alerts', protect, getMyDiseaseAlerts);

export default router;