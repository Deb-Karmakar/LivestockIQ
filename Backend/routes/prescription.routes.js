// backend/routes/prescription.routes.js

import express from 'express';
import { getMyPrescriptions } from '../controllers/prescription.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/').get(protect, getMyPrescriptions);

export default router;