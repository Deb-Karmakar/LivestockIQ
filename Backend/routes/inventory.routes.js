// backend/routes/inventory.routes.js

import express from 'express';
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../controllers/inventory.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getInventory)
    .post(protect, addInventoryItem);

router.route('/:id')
    .put(protect, updateInventoryItem)
    .delete(protect, deleteInventoryItem);

export default router;