// backend/routes/tts.routes.js
import express from 'express';
import { synthesizeSpeech, getVoices } from '../controllers/tts.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Text-to-speech endpoint
router.post('/synthesize', protect, synthesizeSpeech);

// Get available voices
router.get('/voices', protect, getVoices);

export default router;
