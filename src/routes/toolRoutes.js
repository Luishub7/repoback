// src/routes/toolRoutes.js
import express from 'express';
import { getTools, createTool, updateTool, deleteTool } from '../controllers/toolController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, getTools);
router.post('/', verifyToken, createTool);
router.put('/:id', verifyToken, updateTool);
router.delete('/:id', verifyToken, deleteTool);

export default router;