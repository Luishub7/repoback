// src/routes/toolRoutes.js
import express from 'express';
import { getTools, createTool, updateTool, deleteTool } from '../controllers/toolController.js';

const router = express.Router();

router.get('/', getTools);
router.post('/', createTool);
router.put('/:id', updateTool);
router.delete('/:id', deleteTool);

export default router;
