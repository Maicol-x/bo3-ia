import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { chatHandler } from '../controllers/chat.controller.js';

const router = Router();

router.post('/chat', requireAuth, chatHandler);

export default router;
