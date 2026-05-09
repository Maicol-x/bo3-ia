import type { Request, Response } from 'express';
import { generateUserBriefing } from '../services/briefing.service';

export const getBriefing = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const briefing = await generateUserBriefing(userId);
    res.json(briefing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar el briefing.' });
  }
};
