// backend/routes/ai.routes.js
import express from 'express';
import { generateHealthTip, generateRegulatorInsights, generateDemographicsInsights, chat } from '../controllers/ai.controller.js';
import { protect, protectRegulator } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Chatbot endpoint - available to all authenticated users
router.post('/chat', protect, chat);

router.post('/health-tip', protect, generateHealthTip);
router.post('/regulator-insights', protect, protectRegulator, generateRegulatorInsights);
router.post('/demographics-insights', protect, protectRegulator, generateDemographicsInsights);

export default router;