import { Request, Response } from 'express';
import { fetchTrends } from '../services/trend.service.js';

export async function getTrends(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const data = await fetchTrends(userId);
    res.json(data);
  } catch (err) {
    console.error('[getTrends]', err);
    res.status(500).json({ error: 'Error al calcular tendencias' });
  }
}
