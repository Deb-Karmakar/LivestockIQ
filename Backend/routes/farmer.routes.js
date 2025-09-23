// backend/routes/farmer.routes.js
import express from 'express';
import { getFarmerProfile } from '../controllers/farmer.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// This route will get the profile of the currently authenticated user
router.get('/profile', protect, getFarmerProfile);

export default router;