import type { Request, Response } from 'express';
import { pool } from '../config/db.js';
import { verifyToken } from '../services/auth.service.js';

const VALID_AVATARS = new Set([
  'ghost', 'skull', 'fire', 'sword', 'eye', 'moon',
  'storm', 'shadow', 'bat', 'wolf', 'spider', 'dragon',
  'crown', 'gem', 'zombie', 'reaper',
]);

export async function updateAvatar(req: Request, res: Response): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado.' });
    return;
  }

  let userId: number;
  try {
    const payload = verifyToken(authHeader.slice(7));
    userId = payload.id;
  } catch {
    res.status(401).json({ error: 'Token inválido.' });
    return;
  }

  const body = req.body as { avatar?: unknown };
  const avatar = typeof body.avatar === 'string' ? body.avatar : '';

  if (!VALID_AVATARS.has(avatar)) {
    res.status(400).json({ error: 'Avatar inválido.' });
    return;
  }

  await pool.query('UPDATE users SET avatar = $1 WHERE id = $2', [avatar, userId]);
  res.status(200).json({ avatar });
}
