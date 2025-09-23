// backend/routes/sales.routes.js

import express from 'express';
import { addSale, getMySales } from '../controllers/sales.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
    .post(protect, addSale)
    .get(protect, getMySales);

export default router;