import express from 'express';
// 1. Import the new controller function
import { registerFarmer, registerVet, loginUser, registerRegulator } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register/farmer', registerFarmer);
router.post('/register/vet', registerVet);
router.post('/register/regulator', registerRegulator);
router.post('/login', loginUser);

export default router;