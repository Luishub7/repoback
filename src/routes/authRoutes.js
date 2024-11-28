// src/routes/authRoutes.js
import express from 'express';
import { register, login, verifyEmail, getMe } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js'; // Importa el middleware

const router = express.Router();

// Rutas públicas
router.post('/register', register); // Registro no necesita autenticación
router.post('/login', login); // Login no necesita autenticación
router.get('/verify-email/:token', verifyEmail); // Verificación de email no necesita autenticación

// Rutas protegidas
router.get('/me', verifyToken, getMe); // Protegido con verifyToken

export default router;
