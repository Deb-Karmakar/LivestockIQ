// backend/routes/sales.routes.js

import express from 'express';
import { addSale, getMySales, verifyPreSaleCompliance, bulkVerifyCompliance } from '../controllers/sales.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protected routes (Farmer only)
router.post('/', protect, addSale);              // Log new sale
router.get('/', protect, getMySales);            // Get farmer's sales
router.post('/verify-compliance', protect, verifyPreSaleCompliance);  // Pre-sale MRL check
router.post('/bulk-verify', protect, bulkVerifyCompliance);           // Bulk compliance check

export default router;