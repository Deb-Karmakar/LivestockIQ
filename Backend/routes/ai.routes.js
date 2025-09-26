// backend/routes/ai.routes.js
import express from 'express';
import { generateHealthTip } from '../controllers/ai.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/health-tip', protect, generateHealthTip);

export default router;