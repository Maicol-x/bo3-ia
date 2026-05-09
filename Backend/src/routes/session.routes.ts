import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  createSessionHandler,
  joinSessionHandler,
  startSessionHandler,
  getSessionHandler,
  getSessionStatsHandler,
  getSessionSummaryHandler,
} from '../controllers/session.controller.js';

const router = Router();

router.post('/sessions',                    requireAuth, createSessionHandler);
router.post('/sessions/:code/join',         requireAuth, joinSessionHandler);
router.post('/sessions/:code/start',        requireAuth, startSessionHandler);
router.get('/sessions/:code/stats',         requireAuth, getSessionStatsHandler);
router.get('/sessions/:code/summary',       requireAuth, getSessionSummaryHandler);
router.get('/sessions/:code',               requireAuth, getSessionHandler);

export default router;
