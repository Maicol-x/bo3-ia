import { Router } from 'express';
import { getBriefing } from '../controllers/briefing.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/briefing', requireAuth, getBriefing);

export default router;
