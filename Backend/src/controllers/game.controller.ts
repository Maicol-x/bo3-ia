import type { Request, Response } from 'express';
import { insertGame, getAllGames, fetchStats } from '../services/game.service';
import { calculateRisk } from '../services/risk.service';
import { ZONES, CAUSES_OF_DEATH, GAME_MODES, PLATFORMS } from '../models/game.model';
import type { Game } from '../models/game.model';

export const saveGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as Partial<Game>;

    // Validación de campos requeridos
    if (!body.round || !body.zone || !body.cause_of_death || !body.game_mode) {
      res.status(400).json({ error: 'Faltan campos requeridos: round, zone, cause_of_death, game_mode.' });
      return;
    }

    const round = Number(body.round);
    if (!Number.isInteger(round) || round < 1 || round > 255) {
      res.status(400).json({ error: 'La ronda debe ser un número entero entre 1 y 255.' });
      return;
    }

    if (!ZONES.includes(body.zone as typeof ZONES[number])) {
      res.status(400).json({ error: `Zona inválida. Valores válidos: ${ZONES.join(', ')}` });
      return;
    }

    if (!CAUSES_OF_DEATH.includes(body.cause_of_death as typeof CAUSES_OF_DEATH[number])) {
      res.status(400).json({ error: `Causa de muerte inválida. Valores válidos: ${CAUSES_OF_DEATH.join(', ')}` });
      return;
    }

    if (!GAME_MODES.includes(body.game_mode as typeof GAME_MODES[number])) {
      res.status(400).json({ error: `Modo inválido. Valores válidos: ${GAME_MODES.join(', ')}` });
      return;
    }

    if (body.platform !== undefined && !PLATFORMS.includes(body.platform as typeof PLATFORMS[number])) {
      res.status(400).json({ error: `Plataforma inválida. Valores válidos: ${PLATFORMS.join(', ')}` });
      return;
    }

    const gameData: Omit<Game, 'id' | 'created_at'> = {
      ...(req.user ? { user_id: req.user.id } : {}),
      map: body.map ?? 'shadows_of_evil',
      game_mode: body.game_mode,
      platform: body.platform ?? 'pc',
      ...(body.character ? { character: body.character } : {}),
      round,
      zone: body.zone,
      cause_of_death: body.cause_of_death,
      perks: body.perks ?? [],
      weapons: [],                               // Se deriva de weapons_pap en el service
      weapons_pap: body.weapons_pap ?? [],
      gobblegums: body.gobblegums ?? [],
      pack_a_punch: body.pack_a_punch ?? false,
      rituals_completed: Math.min(Math.max(0, Number(body.rituals_completed ?? 0)), 4),
      has_apothicon_servant: body.has_apothicon_servant ?? false,
      has_apothicon_sword: body.has_apothicon_sword ?? false,
      has_rocket_shield: body.has_rocket_shield ?? false,
      civil_protector_active: body.civil_protector_active ?? false,
      ...(body.points_at_death !== undefined ? { points_at_death: Math.min(Math.max(0, Number(body.points_at_death)), 1_000_000) } : {}),
      ...(body.notes !== undefined && body.notes !== '' ? { notes: String(body.notes).slice(0, 500) } : {}),
      ...(body.session_id !== undefined ? { session_id: Number(body.session_id) } : {}),
    };

    const game = await insertGame(gameData);
    const risk = calculateRisk(gameData);

    res.status(201).json({ game, risk });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar la partida.' });
  }
};

export const getGames = async (req: Request, res: Response): Promise<void> => {
  try {
    const games = await getAllGames(req.user?.id);
    res.json(games);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener partidas.' });
  }
};

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await fetchStats(req.user?.id);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas.' });
  }
};
