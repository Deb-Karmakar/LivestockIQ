// Backend/routes/labTechnician.routes.js

import express from 'express';
import { protect, protectLabTechnician } from '../middlewares/auth.middleware.js';
import {
    getLabTechProfile,
    uploadMRLTest,
    getMyMRLTests,
    getLabDashboard,
    findAnimalByTagId
} from '../controllers/labTechnician.controller.js';

const router = express.Router();

// All routes require authentication and lab technician role
router.use(protect);
router.use(protectLabTechnician);

// Profile
router.get('/profile', getLabTechProfile);

// Dashboard
router.get('/dashboard', getLabDashboard);

// MRL Tests
router.post('/mrl-tests', uploadMRLTest);
router.get('/mrl-tests', getMyMRLTests);

// Animal lookup
router.get('/animals/:tagId', findAnimalByTagId);

export default router;
