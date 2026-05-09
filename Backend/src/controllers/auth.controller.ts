import type { Request, Response } from 'express';
import { createUser, verifyCredentials, signToken } from '../services/auth.service.js';
import type { RegisterBody, LoginBody } from '../models/auth.model.js';

export async function register(req: Request, res: Response): Promise<void> {
  const body = req.body as Partial<RegisterBody>;

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || username.length < 3 || username.length > 20) {
    res.status(400).json({ error: 'El nombre de usuario debe tener entre 3 y 20 caracteres.' });
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    res.status(400).json({ error: 'El nombre de usuario solo puede contener letras, números y guiones bajos.' });
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Email inválido.' });
    return;
  }
  if (!password || password.length < 8) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    return;
  }

  try {
    const user = await createUser(username, email, password);
    const token = signToken({ id: user.id, username: user.username, email: user.email, avatar: user.avatar });
    res.status(201).json({ user, token });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear el usuario';
    res.status(409).json({ error: message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = req.body as Partial<LoginBody>;

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    return;
  }

  try {
    const user = await verifyCredentials(email, password);
    const token = signToken({ id: user.id, username: user.username, email: user.email, avatar: user.avatar });
    res.status(200).json({ user, token });
  } catch (err) {
    // Mismo mensaje para email o password incorrectos — no revelar cuál falló
    res.status(401).json({ error: 'Credenciales inválidas.' });
  }
}
