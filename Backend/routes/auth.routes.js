import express from 'express';
// 1. Import the new controller function
import { registerFarmer, registerVet, loginUser } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register/farmer', registerFarmer);
router.post('/register/vet', registerVet); // 2. Add the new vet registration route
router.post('/login', loginUser);

export default router;