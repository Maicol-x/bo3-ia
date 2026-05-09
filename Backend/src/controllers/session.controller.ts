import { Request, Response } from 'express';
import {
  createSession,
  joinSession,
  startSession,
  getSessionByCode,
  getSessionStats,
  generateSessionSummary,
} from '../services/session.service.js';

// POST /api/sessions — crear sala
export async function createSessionHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await createSession(req.user!.id);
    res.status(201).json(session);
  } catch (err) {
    console.error('[createSession]', err);
    res.status(500).json({ error: 'Error al crear la sala' });
  }
}

// POST /api/sessions/:code/join — unirse a sala
export async function joinSessionHandler(req: Request, res: Response): Promise<void> {
  const { code } = req.params as { code: string };
  try {
    const result = await joinSession(code, req.user!.id);
    if (!result.ok) {
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        ALREADY_MEMBER: 409,
        FULL: 409,
        NOT_WAITING: 409,
      };
      res.status(statusMap[result.error!] ?? 400).json({ error: result.error });
      return;
    }
    res.json(result.session);
  } catch (err) {
    console.error('[joinSession]', err);
    res.status(500).json({ error: 'Error al unirse a la sala' });
  }
}

// POST /api/sessions/:code/start — iniciar partida (solo líder)
export async function startSessionHandler(req: Request, res: Response): Promise<void> {
  const { code } = req.params as { code: string };
  try {
    const result = await startSession(code, req.user!.id);
    if (!result.ok) {
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        NOT_LEADER: 403,
        NOT_WAITING: 409,
        NOT_ENOUGH_PLAYERS: 409,
      };
      res.status(statusMap[result.error!] ?? 400).json({ error: result.error });
      return;
    }
    res.json(result.session);
  } catch (err) {
    console.error('[startSession]', err);
    res.status(500).json({ error: 'Error al iniciar la partida' });
  }
}

// GET /api/sessions/:code — obtener estado de la sala
export async function getSessionHandler(req: Request, res: Response): Promise<void> {
  const { code } = req.params as { code: string };
  try {
    const session = await getSessionByCode(code);
    if (!session) {
      res.status(404).json({ error: 'Sala no encontrada' });
      return;
    }
    res.json(session);
  } catch (err) {
    console.error('[getSession]', err);
    res.status(500).json({ error: 'Error al obtener la sala' });
  }
}

// GET /api/sessions/:code/stats — estadísticas grupales de la sesión
export async function getSessionStatsHandler(req: Request, res: Response): Promise<void> {
  const { code } = req.params as { code: string };
  try {
    const stats = await getSessionStats(code);
    if (!stats) {
      res.status(404).json({ error: 'Sala no encontrada' });
      return;
    }
    res.json(stats);
  } catch (err) {
    console.error('[getSessionStats]', err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
}

// GET /api/sessions/:code/summary — resumen IA de la sesión
export async function getSessionSummaryHandler(req: Request, res: Response): Promise<void> {
  const { code } = req.params as { code: string };
  try {
    const summary = await generateSessionSummary(code);
    if (summary === null) {
      res.status(404).json({ error: 'No se pudo generar el resumen' });
      return;
    }
    res.json({ summary });
  } catch (err) {
    console.error('[getSessionSummary]', err);
    res.status(500).json({ error: 'Error al generar el resumen' });
  }
}
