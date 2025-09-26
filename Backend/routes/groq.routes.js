// backend/routes/groq.routes.js

import express from 'express';
import { handleGroqChat } from '../controllers/groq.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// This endpoint will be used by the Groq-powered chatbot
router.post('/chat', protect, handleGroqChat);

export default router;