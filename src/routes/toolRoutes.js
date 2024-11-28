// src/routes/toolRoutes.js
import express from 'express';
import { getTools, createTool, updateTool, deleteTool } from '../controllers/toolController.js';
import { verifyToken } from '../middlewares/authMiddleware.js'; // Importa el middleware

const router = express.Router();

// Todas las rutas protegidas con verifyToken
router.get('/', verifyToken, getTools); // Obtener todas las herramientas
router.post('/', verifyToken, createTool); // Crear una herramienta
router.put('/:id', verifyToken, updateTool); // Modificar una herramienta
router.delete('/:id', verifyToken, deleteTool); // Eliminar una herramienta

export default router;
