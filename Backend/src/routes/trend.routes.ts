import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getTrends } from '../controllers/trend.controller.js';

const router = Router();

router.get('/trends', requireAuth, getTrends);

export default router;
