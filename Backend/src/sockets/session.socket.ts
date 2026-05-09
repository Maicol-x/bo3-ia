import { Server, Socket } from 'socket.io';
import { verifyToken } from '../services/auth.service.js';
import {
  joinSession,
  startSession,
  endSession,
  addChatMessage,
  getSessionByCode,
  type Session,
  type ChatMessage,
} from '../services/session.service.js';

// ─── Tipos de eventos ─────────────────────────────────────────────────────────

// Cliente → Servidor
interface ClientEvents {
  join_room:      (payload: { code: string; token: string }) => void;
  leave_room:     (payload: { code: string }) => void;
  start_game:     (payload: { code: string; token: string }) => void;
  chat_message:   (payload: { code: string; token: string; content: string }) => void;
  end_game:       (payload: { code: string; token: string }) => void;
  form_submitted: (payload: { code: string; token: string }) => void;
}

// Servidor → Cliente
interface ServerEvents {
  room_state:      (session: Session) => void;
  player_joined:   (data: { username: string; members: Session['members'] }) => void;
  player_left:     (data: { username: string; members: Session['members'] }) => void;
  game_started:    (session: Session) => void;
  new_message:     (msg: ChatMessage) => void;
  game_ended:      (data: { session: Session; duration_seconds: number }) => void;
  forms_progress:  (data: { submitted: number; total: number }) => void;
  all_forms_ready: (data: { code: string }) => void;
  error:           (data: { message: string }) => void;
}

// ─── Registro de eventos ──────────────────────────────────────────────────────

// Track de formularios enviados por sesión: code → Set<userId>
const formSubmissions = new Map<string, Set<number>>();

export function registerSessionSocket(io: Server): void {
  io.on('connection', (socket: Socket<ClientEvents, ServerEvents>) => {

    // ── join_room ─────────────────────────────────────────────────────────────
    socket.on('join_room', async ({ code, token }) => {
      // Verificar token JWT
      let userId: number;
      let username: string;
      try {
        const payload = verifyToken(token);
        userId = payload.id;
        username = payload.username;
      } catch {
        socket.emit('error', { message: 'Token inválido' });
        return;
      }

      const upperCode = code.toUpperCase();

      // Intentar unirse (o ya es miembro → simplemente entra al room de socket)
      const result = await joinSession(upperCode, userId);

      if (!result.ok && result.error !== 'ALREADY_MEMBER') {
        const msgMap: Record<string, string> = {
          NOT_FOUND:    'Sala no encontrada',
          FULL:         'La sala está llena',
          NOT_WAITING:  'La partida ya comenzó o finalizó',
        };
        socket.emit('error', { message: msgMap[result.error!] ?? 'Error al unirse' });
        return;
      }

      // Entrar al room de socket.io
      await socket.join(upperCode);

      // Obtener estado actualizado
      const session = result.session ?? await getSessionByCode(upperCode);
      if (!session) return;

      // Notificar al socket que acaba de entrar
      socket.emit('room_state', session);

      // Notificar a los demás en la sala (miembro nuevo o reconexión)
      socket.to(upperCode).emit('player_joined', {
        username,
        members: session.members,
      });
    });

    // ── leave_room ────────────────────────────────────────────────────────────
    socket.on('leave_room', async ({ code }) => {
      const upperCode = code.toUpperCase();
      await socket.leave(upperCode);

      const session = await getSessionByCode(upperCode);
      if (!session) return;

      io.to(upperCode).emit('player_left', {
        username: socket.id, // fallback; el username real viene del join
        members: session.members,
      });
    });

    // ── start_game ────────────────────────────────────────────────────────────
    socket.on('start_game', async ({ code, token }) => {
      let userId: number;
      try {
        const payload = verifyToken(token);
        userId = payload.id;
      } catch {
        socket.emit('error', { message: 'Token inválido' });
        return;
      }

      const upperCode = code.toUpperCase();
      const result = await startSession(upperCode, userId);

      if (!result.ok) {
        const msgMap: Record<string, string> = {
          NOT_FOUND:           'Sala no encontrada',
          NOT_LEADER:          'Solo el líder puede iniciar la partida',
          NOT_WAITING:         'La partida ya comenzó',
          NOT_ENOUGH_PLAYERS:  'Se necesitan al menos 2 jugadores para iniciar',
        };
        socket.emit('error', { message: msgMap[result.error!] ?? 'Error al iniciar' });
        return;
      }

      // Emitir a TODOS en la sala (incluido el líder)
      io.to(upperCode).emit('game_started', result.session!);
    });

    // ── chat_message ──────────────────────────────────────────────────────────
    socket.on('chat_message', async ({ code, token, content }) => {
      if (!content || !content.trim()) return;
      if (content.trim().length > 300) {
        socket.emit('error', { message: 'Mensaje demasiado largo' });
        return;
      }

      let userId: number;
      let username: string;
      try {
        const payload = verifyToken(token);
        userId = payload.id;
        username = payload.username;
      } catch {
        socket.emit('error', { message: 'Token inválido' });
        return;
      }

      const upperCode = code.toUpperCase();
      const session = await getSessionByCode(upperCode);
      if (!session) { socket.emit('error', { message: 'Sala no encontrada' }); return; }

      const msg = await addChatMessage(session.id, userId, username, content);
      // Broadcast a TODOS en la sala (incluido el remitente)
      io.to(upperCode).emit('new_message', msg);
    });

    // ── end_game ──────────────────────────────────────────────────────────────
    socket.on('end_game', async ({ code, token }) => {
      let userId: number;
      try {
        const payload = verifyToken(token);
        userId = payload.id;
      } catch {
        socket.emit('error', { message: 'Token inválido' });
        return;
      }

      const upperCode = code.toUpperCase();
      const result = await endSession(upperCode, userId);

      if (!result.ok) {
        const msgMap: Record<string, string> = {
          NOT_FOUND:       'Sala no encontrada',
          NOT_LEADER:      'Solo el líder puede terminar la partida',
          NOT_IN_PROGRESS: 'La partida no está en curso',
        };
        socket.emit('error', { message: msgMap[result.error!] ?? 'Error al terminar' });
        return;
      }

      // Emitir a TODOS (incluido el líder) para mostrar el formulario
      io.to(upperCode).emit('game_ended', {
        session: result.session!,
        duration_seconds: result.duration_seconds ?? 0,
      });

      // Limpiar submissions anteriores por si acaso (nueva partida)
      formSubmissions.delete(upperCode);
    });

    // ── form_submitted ────────────────────────────────────────────────────────
    socket.on('form_submitted', async ({ code, token }) => {
      let userId: number;
      try {
        const payload = verifyToken(token);
        userId = payload.id;
      } catch {
        socket.emit('error', { message: 'Token inválido' });
        return;
      }

      const upperCode = code.toUpperCase();
      if (!formSubmissions.has(upperCode)) formSubmissions.set(upperCode, new Set());
      formSubmissions.get(upperCode)!.add(userId);

      const session = await getSessionByCode(upperCode);
      if (!session) return;

      const total     = session.members.length;
      const submitted = formSubmissions.get(upperCode)!.size;

      // Notificar progreso a todos
      io.to(upperCode).emit('forms_progress', { submitted, total });

      // Si todos entregaron → todos pasan a estadísticas
      if (submitted >= total) {
        formSubmissions.delete(upperCode);
        io.to(upperCode).emit('all_forms_ready', { code: upperCode });
      }
    });
  });
}
