// backend/routes/admin.routes.js

import express from 'express';
import {
    triggerAmuAnalysis,
    triggerPeerAnalysis,
    triggerDiseasePrediction,
    getAllUsers,
    updateUserStatus,
    deleteUser,
    getDashboardStats
} from '../controllers/admin.controller.js';
import { protect, protectAdmin, protectAdminOrRegulator } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Analysis Routes
router.post('/trigger-amu-analysis', protect, protectAdmin, triggerAmuAnalysis);
router.post('/trigger-peer-analysis', protect, protectAdmin, triggerPeerAnalysis);
router.post('/trigger-disease-prediction', protect, protectAdmin, triggerDiseasePrediction);

// User Management Routes
router.get('/users', protect, protectAdminOrRegulator, getAllUsers);
router.patch('/users/:id/status', protect, protectAdminOrRegulator, updateUserStatus);
router.delete('/users/:id', protect, protectAdmin, deleteUser);

// Dashboard Stats
router.get('/dashboard-stats', protect, protectAdmin, getDashboardStats);

export default router;