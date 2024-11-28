// src/routes/toolRoutes.js
import express from 'express';
import { getTools, createTool, updateTool, deleteTool } from '../controllers/toolController.js';

const router = express.Router();

router.get('/', getTools); // Obtener todas las herramientas
router.post('/', createTool); // Crear una herramienta
router.put('/:id', updateTool); // Modificar una herramienta
router.delete('/:id', deleteTool); // Eliminar una herramienta

export default router;
