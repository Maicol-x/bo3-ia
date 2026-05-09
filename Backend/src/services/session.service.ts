import { pool } from '../config/db.js';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type SessionStatus = 'waiting' | 'in_progress' | 'finished';

export interface SessionMember {
  user_id: number;
  username: string;
  avatar: string;
  joined_at: string;
  is_leader: boolean;
}

export interface Session {
  id: number;
  code: string;
  leader_id: number;
  status: SessionStatus;
  max_players: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  members: SessionMember[];
}

// ─── Generador de código ──────────────────────────────────────────────────────

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para evitar confusión
  let code = 'SOE-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

async function getMemberCount(sessionId: number): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    'SELECT COUNT(*) FROM session_members WHERE session_id = $1',
    [sessionId],
  );
  return parseInt(rows[0]!.count, 10);
}

async function getSessionWithMembers(sessionId: number): Promise<Session | null> {
  const { rows } = await pool.query<{
    id: number;
    code: string;
    leader_id: number;
    status: SessionStatus;
    max_players: number;
    created_at: string;
    started_at: string | null;
    finished_at: string | null;
    members: SessionMember[] | null;
  }>(
    `SELECT
       s.id, s.code, s.leader_id, s.status, s.max_players,
       s.created_at, s.started_at, s.finished_at,
       JSON_AGG(
         JSON_BUILD_OBJECT(
           'user_id',   u.id,
           'username',  u.username,
           'avatar',    u.avatar,
           'joined_at', sm.joined_at,
           'is_leader', (u.id = s.leader_id)
         ) ORDER BY sm.joined_at ASC
       ) FILTER (WHERE u.id IS NOT NULL) AS members
     FROM sessions s
     LEFT JOIN session_members sm ON sm.session_id = s.id
     LEFT JOIN users u ON u.id = sm.user_id
     WHERE s.id = $1
     GROUP BY s.id`,
    [sessionId],
  );
  if (!rows[0]) return null;
  const row = rows[0];
  return { ...row, members: row.members ?? [] };
}

// ─── Crear sesión ─────────────────────────────────────────────────────────────

export async function createSession(leaderId: number): Promise<Session> {
  let code = generateCode();

  // Reintento si colisión de código (muy improbable)
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await pool.query('SELECT id FROM sessions WHERE code = $1', [code]);
    if (existing.rows.length === 0) break;
    code = generateCode();
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO sessions (code, leader_id) VALUES ($1, $2) RETURNING id`,
      [code, leaderId],
    );
    const sessionId = rows[0]!.id;

    // El líder entra automáticamente
    await client.query(
      `INSERT INTO session_members (session_id, user_id) VALUES ($1, $2)`,
      [sessionId, leaderId],
    );

    await client.query('COMMIT');

    const session = await getSessionWithMembers(sessionId);
    return session!;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Unirse a sesión ──────────────────────────────────────────────────────────

export type JoinError =
  | 'NOT_FOUND'
  | 'ALREADY_MEMBER'
  | 'FULL'
  | 'NOT_WAITING';

export interface JoinResult {
  ok: boolean;
  error?: JoinError;
  session?: Session;
}

export async function joinSession(code: string, userId: number): Promise<JoinResult> {
  const { rows } = await pool.query<{ id: number; status: SessionStatus; max_players: number }>(
    `SELECT id, status, max_players FROM sessions WHERE code = $1`,
    [code.toUpperCase()],
  );

  if (!rows[0]) return { ok: false, error: 'NOT_FOUND' };
  const { id: sessionId, status, max_players } = rows[0];

  if (status !== 'waiting') return { ok: false, error: 'NOT_WAITING' };

  // ¿Ya es miembro?
  const existing = await pool.query(
    `SELECT 1 FROM session_members WHERE session_id = $1 AND user_id = $2`,
    [sessionId, userId],
  );
  if (existing.rows.length > 0) return { ok: false, error: 'ALREADY_MEMBER' };

  // ¿Sala llena?
  const count = await getMemberCount(sessionId);
  if (count >= max_players) return { ok: false, error: 'FULL' };

  await pool.query(
    `INSERT INTO session_members (session_id, user_id) VALUES ($1, $2)`,
    [sessionId, userId],
  );

  const session = await getSessionWithMembers(sessionId);
  return { ok: true, session: session! };
}

// ─── Iniciar sesión (solo líder) ──────────────────────────────────────────────

export type StartError = 'NOT_FOUND' | 'NOT_LEADER' | 'NOT_WAITING' | 'NOT_ENOUGH_PLAYERS';

export interface StartResult {
  ok: boolean;
  error?: StartError;
  session?: Session;
}

export async function startSession(code: string, userId: number): Promise<StartResult> {
  const { rows } = await pool.query<{ id: number; leader_id: number; status: SessionStatus }>(
    `SELECT id, leader_id, status FROM sessions WHERE code = $1`,
    [code.toUpperCase()],
  );

  if (!rows[0]) return { ok: false, error: 'NOT_FOUND' };
  const { id: sessionId, leader_id, status } = rows[0];

  if (leader_id !== userId) return { ok: false, error: 'NOT_LEADER' };
  if (status !== 'waiting') return { ok: false, error: 'NOT_WAITING' };

  const count = await getMemberCount(sessionId);
  if (count < 1) return { ok: false, error: 'NOT_ENOUGH_PLAYERS' };

  await pool.query(
    `UPDATE sessions SET status = 'in_progress', started_at = NOW() WHERE id = $1`,
    [sessionId],
  );

  const session = await getSessionWithMembers(sessionId);
  return { ok: true, session: session! };
}

// ─── Obtener sesión por código ────────────────────────────────────────────────

export async function getSessionByCode(code: string): Promise<Session | null> {
  const { rows } = await pool.query<{ id: number }>(
    `SELECT id FROM sessions WHERE code = $1`,
    [code.toUpperCase()],
  );
  if (!rows[0]) return null;
  return getSessionWithMembers(rows[0].id);
}

// ─── Terminar sesión (solo líder) ─────────────────────────────────────────────

export type EndError = 'NOT_FOUND' | 'NOT_LEADER' | 'NOT_IN_PROGRESS';

export interface EndResult {
  ok: boolean;
  error?: EndError;
  session?: Session;
  duration_seconds?: number;
}

export async function endSession(code: string, userId: number): Promise<EndResult> {
  const { rows } = await pool.query<{
    id: number; leader_id: number; status: SessionStatus; started_at: string | null;
  }>(
    `SELECT id, leader_id, status, started_at FROM sessions WHERE code = $1`,
    [code.toUpperCase()],
  );

  if (!rows[0]) return { ok: false, error: 'NOT_FOUND' };
  const { id: sessionId, leader_id, status, started_at } = rows[0];

  if (leader_id !== userId) return { ok: false, error: 'NOT_LEADER' };
  if (status !== 'in_progress') return { ok: false, error: 'NOT_IN_PROGRESS' };

  await pool.query(
    `UPDATE sessions SET status = 'finished', finished_at = NOW() WHERE id = $1`,
    [sessionId],
  );

  const session = await getSessionWithMembers(sessionId);

  // Calcular duración en segundos
  let duration_seconds = 0;
  if (started_at && session?.finished_at) {
    const start = new Date(started_at).getTime();
    const end   = new Date(session.finished_at).getTime();
    duration_seconds = Math.floor((end - start) / 1000);
  }

  return { ok: true, session: session!, duration_seconds };
}

// ─── Chat de sala ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: number;
  session_id: number;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
}

export async function addChatMessage(
  sessionId: number,
  userId: number,
  username: string,
  content: string,
): Promise<ChatMessage> {
  const { rows } = await pool.query<ChatMessage>(
    `INSERT INTO session_messages (session_id, user_id, username, content)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [sessionId, userId, username, content.trim()],
  );
  return rows[0]!;
}

export async function getChatMessages(sessionId: number): Promise<ChatMessage[]> {
  const { rows } = await pool.query<ChatMessage>(
    `SELECT * FROM session_messages WHERE session_id = $1 ORDER BY created_at ASC`,
    [sessionId],
  );
  return rows;
}

// ─── Estadísticas grupales de sesión ─────────────────────────────────────────

export interface PlayerGame {
  round: number;
  character: string | null;
  cause_of_death: string;
  zone: string;
  perks: string[];
  pack_a_punch: boolean;
  rituals_completed: number;
  points_at_death: number | null;
  notes: string | null;
}

export interface PlayerStat {
  user_id: number;
  username: string;
  avatar: string;
  games: PlayerGame[];
  best_round: number;
  total_games: number;
}

export interface SessionStats {
  session_id: number;
  code: string;
  duration_seconds: number | null;
  started_at: string | null;
  finished_at: string | null;
  player_count: number;
  total_games: number;
  best_round_overall: number;
  players: PlayerStat[];
}

export async function getSessionStats(code: string): Promise<SessionStats | null> {
  // 1. Obtener sesión
  const { rows: sRows } = await pool.query<{
    id: number; code: string; started_at: string | null; finished_at: string | null;
  }>(
    `SELECT id, code, started_at, finished_at FROM sessions WHERE code = $1`,
    [code.toUpperCase()],
  );
  if (!sRows[0]) return null;
  const sess = sRows[0];

  // 2. Calcular duración
  let duration_seconds: number | null = null;
  if (sess.started_at && sess.finished_at) {
    duration_seconds = Math.floor(
      (new Date(sess.finished_at).getTime() - new Date(sess.started_at).getTime()) / 1000,
    );
  }

  // 3. Obtener todos los games de la sesión con detalle completo
  const { rows: gRows } = await pool.query<{
    user_id: number;
    username: string;
    avatar: string;
    round: number;
    character: string | null;
    cause_of_death: string;
    zone: string;
    perks: string;
    pack_a_punch: boolean;
    rituals_completed: number;
    points_at_death: number | null;
    notes: string | null;
  }>(
    `SELECT g.user_id, u.username, u.avatar, g.round, g.character, g.cause_of_death,
            g.zone, g.perks, g.pack_a_punch, g.rituals_completed,
            g.points_at_death, g.notes
     FROM games g
     JOIN users u ON u.id = g.user_id
     WHERE g.session_id = $1
     ORDER BY g.user_id, g.created_at ASC`,
    [sess.id],
  );

  if (gRows.length === 0) {
    return {
      session_id: sess.id, code: sess.code,
      duration_seconds, started_at: sess.started_at, finished_at: sess.finished_at,
      player_count: 0, total_games: 0, best_round_overall: 0, players: [],
    };
  }

  // 4. Agrupar por jugador
  const byPlayer = new Map<number, { username: string; avatar: string; games: PlayerGame[] }>();

  for (const g of gRows) {
    if (!byPlayer.has(g.user_id)) {
      byPlayer.set(g.user_id, { username: g.username, avatar: g.avatar, games: [] });
    }
    let perks: string[] = [];
    try { perks = typeof g.perks === 'string' ? (JSON.parse(g.perks) as string[]) : (g.perks as unknown as string[] ?? []); } catch { perks = []; }
    byPlayer.get(g.user_id)!.games.push({
      round:              g.round,
      character:          g.character,
      cause_of_death:     g.cause_of_death,
      zone:               g.zone,
      perks,
      pack_a_punch:       g.pack_a_punch,
      rituals_completed:  g.rituals_completed,
      points_at_death:    g.points_at_death,
      notes:              g.notes,
    });
  }

  const players: PlayerStat[] = [...byPlayer.entries()].map(([user_id, p]) => ({
    user_id,
    username:    p.username,
    avatar:      p.avatar,
    games:       p.games,
    best_round:  Math.max(...p.games.map((g) => g.round)),
    total_games: p.games.length,
  }));

  return {
    session_id:         sess.id,
    code:               sess.code,
    duration_seconds,
    started_at:         sess.started_at,
    finished_at:        sess.finished_at,
    player_count:       players.length,
    total_games:        gRows.length,
    best_round_overall: Math.max(...players.map((p) => p.best_round)),
    players,
  };
}

// ─── Resumen IA de la sesión ──────────────────────────────────────────────────

export async function generateSessionSummary(code: string): Promise<string | null> {
  const stats = await getSessionStats(code);
  if (!stats) return null;

  // Obtener mensajes del chat IA (session_messages)
  const { rows: msgs } = await pool.query<{ username: string; content: string }>(
    `SELECT sm.username, sm.content
     FROM session_messages sm
     WHERE sm.session_id = $1
     ORDER BY sm.created_at ASC
     LIMIT 40`,
    [stats.session_id],
  );

  const GROQ_URL  = 'https://api.groq.com/openai/v1/chat/completions';
  const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';
  const apiKey    = process.env.GROQ_API_KEY ?? '';
  if (!apiKey || apiKey === 'pega_tu_key_aqui') return null;

  // Construir contexto de partidas
  const gamesContext = stats.players.map((p) =>
    p.games.map((g) =>
      `${p.username}: ronda ${g.round}, personaje ${g.character ?? 'desconocido'}, ` +
      `murió por ${g.cause_of_death} en ${g.zone}, perks [${g.perks.join(', ') || 'ninguno'}]` +
      (g.pack_a_punch ? ', tenía PaP' : ', sin PaP') +
      (g.rituals_completed > 0 ? `, rituales: ${g.rituals_completed}` : '') +
      (g.notes ? `, nota: "${g.notes}"` : ''),
    ).join('\n'),
  ).join('\n');

  const chatContext = msgs.length > 0
    ? msgs.map((m) => `${m.username}: ${m.content}`).join('\n')
    : '(sin mensajes de chat)';

  const prompt = `Analiza esta sesión grupal de Shadows of Evil (BO3 Zombies) y da un resumen CONCISO de 3-4 oraciones en español explicando:
1. Qué tan lejos llegaron y qué falló (basado en los resultados de cada jugador)
2. Un error táctico específico que explica la muerte (perks faltantes, zona incorrecta, etc.)
3. Un consejo práctico para mejorar en la próxima sesión.

RESULTADOS DE LAS PARTIDAS:
${gamesContext}

CHAT DURANTE LA SESIÓN:
${chatContext}

Responde SOLO con el análisis, sin saludos ni títulos.`;

  const response = await fetch(GROQ_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 450,
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message.content.trim() ?? null;
}
