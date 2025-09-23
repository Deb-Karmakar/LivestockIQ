// backend/routes/regulator.routes.js

import express from 'express';
import { getDashboardStats, getComplianceData  } from '../controllers/regulator.controller.js';
import { protect, protectRegulator } from '../middlewares/auth.middleware.js';

const router = express.Router();

// This route is protected, ensuring only logged-in regulators can access it
router.get('/dashboard-stats', protect, protectRegulator, getDashboardStats);
router.get('/compliance-data', protect, protectRegulator, getComplianceData);

export default router;