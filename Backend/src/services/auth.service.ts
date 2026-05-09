import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import type { User, UserPublic, AuthPayload } from '../models/auth.model.js';

const SALT_ROUNDS = 12;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET no está definido en las variables de entorno');
  return secret;
}

export async function createUser(username: string, email: string, password: string): Promise<UserPublic> {
  const existing = await pool.query<User>(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email.toLowerCase(), username.toLowerCase()],
  );
  if (existing.rows.length > 0) {
    throw new Error('El email o nombre de usuario ya está en uso');
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await pool.query<User>(
    'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, avatar',
    [username.toLowerCase(), email.toLowerCase(), hash],
  );
  return result.rows[0] as unknown as UserPublic;
}

export async function verifyCredentials(email: string, password: string): Promise<UserPublic> {
  const result = await pool.query<User>(
    'SELECT id, username, email, password, avatar FROM users WHERE email = $1',
    [email.toLowerCase()],
  );
  if (result.rows.length === 0) {
    throw new Error('Credenciales inválidas');
  }

  const user = result.rows[0]!;
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new Error('Credenciales inválidas');
  }

  return { id: user.id, username: user.username, email: user.email, avatar: user.avatar };
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, getJwtSecret()) as AuthPayload;
}
