// backend/routes/stt.routes.js
import express from 'express';
import { transcribeSpeech } from '../controllers/stt.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Speech-to-text endpoint
router.post('/transcribe', protect, transcribeSpeech);

export default router;
