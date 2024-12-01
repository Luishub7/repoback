import express from 'express';
import { register, login, verifyEmail, getMe } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail);
router.get('/me', verifyToken, getMe); // Nueva ruta para obtener los datos del usuario

export default router;
