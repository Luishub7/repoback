import express from 'express';
import { register, login, verifyEmail, getMe, forgotPassword, resetPassword } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail);
router.get('/me', verifyToken, getMe); // Nueva ruta para obtener los datos del usuario
router.post('/forgot-password', forgotPassword); // Nueva ruta
router.post('/reset-password', resetPassword); // Nueva ruta

export default router;
