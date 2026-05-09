import { Router } from 'express';
import { updateAvatar } from '../controllers/user.controller.js';

const router = Router();

router.put('/users/avatar', updateAvatar);

export default router;
