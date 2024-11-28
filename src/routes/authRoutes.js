// src/routes/authRoutes.js
import express from 'express';
import { register, login, verifyEmail, getMe } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { verifyEmail } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail);
router.get('/me', verifyToken, getMe);

export default router;

