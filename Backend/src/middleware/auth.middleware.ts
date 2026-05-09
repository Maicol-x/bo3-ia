import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service.js';
import type { AuthPayload } from '../models/auth.model.js';

// Extiende el tipo Request de Express para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autenticado. Se requiere token.' });
    return;
  }

  const token = header.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}
