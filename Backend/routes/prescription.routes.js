import express from 'express';
import { createPrescription, getMyPrescriptions } from '../controllers/prescription.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createPrescription);

router.route('/my-prescriptions')
    .get(protect, getMyPrescriptions);

export default router;