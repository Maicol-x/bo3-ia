import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Chip, Divider,
  Avatar, Alert, CircularProgress, Tooltip, Paper,
  IconButton, Snackbar, Tabs, Tab,
} from '@mui/material';
import AddIcon            from '@mui/icons-material/Add';
import GroupAddIcon        from '@mui/icons-material/GroupAdd';
import EmojiPeopleIcon     from '@mui/icons-material/EmojiPeople';
import PlayArrowIcon       from '@mui/icons-material/PlayArrow';
import ContentCopyIcon     from '@mui/icons-material/ContentCopy';
import WifiIcon            from '@mui/icons-material/Wifi';
import WifiOffIcon         from '@mui/icons-material/WifiOff';
import StopCircleIcon      from '@mui/icons-material/StopCircle';
import SendIcon            from '@mui/icons-material/Send';
import AccessTimeIcon      from '@mui/icons-material/AccessTime';
import SmartToyIcon        from '@mui/icons-material/SmartToy';
import ForumIcon           from '@mui/icons-material/Forum';
import { useAppSelector }  from '../hooks/useAppStore';
import { createSession, joinSession, type SessionData } from '../services/sessionService';
import { useSessionSocket } from '../hooks/useSessionSocket';
import GameForm             from '../components/GameForm';
import ChatPanel            from '../components/ChatPanel';
import SessionStatsPanel    from '../components/SessionStatsPanel';
import { getAvatar }        from '../constants/avatars';

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function SessionPage() {
  const navigate = useNavigate();
  const user  = useAppSelector((s) => s.auth.user);
  const token = useAppSelector((s) => s.auth.token);

  const [view, setView] = useState<'home' | 'lobby' | 'game' | 'form' | 'stats'>(() =>
    sessionStorage.getItem('bo3ia_session_code') ? 'lobby' : 'home'
  );
  const [sessionCode, setSessionCode] = useState<string | null>(
    () => sessionStorage.getItem('bo3ia_session_code')
  );
  const [sessionId, setSessionId] = useState<number | null>(null);

  const [joinCode,  setJoinCode]  = useState('');
  const [httpError, setHttpError] = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [copied,    setCopied]    = useState(false);

  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [durationSeconds, setDurationSeconds] = useState(0);
  const [rightTab, setRightTab] = useState<0 | 1>(0);
  const [joinToast, setJoinToast] = useState<string | null>(null);
  const [formsProgress, setFormsProgress] = useState<{ submitted: number; total: number } | null>(null);

  function enterLobby(code: string, id?: number) {
    sessionStorage.setItem('bo3ia_session_code', code);
    setSessionCode(code);
    if (id) setSessionId(id);
    setView('lobby');
  }

  function leaveLobby() {
    sessionStorage.removeItem('bo3ia_session_code');
    setSessionCode(null);
    setSessionId(null);
    setView('home');
    if (timerRef.current) clearInterval(timerRef.current);
  }

  const onGameStarted = useCallback((s: SessionData) => {
    setSessionId(s.id);
    setElapsed(0);
    setView('game');
  }, []);

  const onGameEnded = useCallback((data: { session: SessionData; duration_seconds: number }) => {
    setDurationSeconds(data.duration_seconds);
    setFormsProgress(null);
    setView('form');
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const onPlayerJoined = useCallback((username: string) => {
    setJoinToast(`${username} se unió a la sala 🟢`);
  }, []);

  const onPlayerLeft = useCallback((username: string) => {
    setJoinToast(`${username} salió de la sala`);
  }, []);

  const onFormsProgress = useCallback((data: { submitted: number; total: number }) => {
    setFormsProgress(data);
  }, []);

  const onAllFormsReady = useCallback((code: string) => {
    sessionStorage.removeItem('bo3ia_session_code');
    sessionStorage.setItem('bo3ia_completed_session', JSON.stringify({ duration_seconds: durationSeconds, code }));
    setView('stats');
  }, [durationSeconds]);

  const { session, messages, socketError, connected, socket } = useSessionSocket({
    code: sessionCode, token, onGameStarted, onGameEnded, onPlayerJoined, onPlayerLeft,
    onFormsProgress, onAllFormsReady,
  });

  // Cronómetro
  useEffect(() => {
    if (view !== 'game') return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (session?.started_at) {
      const start = new Date(session.started_at).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // Auto-scroll chat
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const isLeader    = session?.leader_id === user?.id;
  const memberCount = session?.members.length ?? 0;
  const maxPlayers  = session?.max_players ?? 4;

  async function handleCreate() {
    setLoading(true); setHttpError(null);
    try { const s: SessionData = await createSession(); enterLobby(s.code, s.id); }
    catch { setHttpError('No se pudo crear la sala.'); }
    finally { setLoading(false); }
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setLoading(true); setHttpError(null);
    try {
      const s: SessionData = await joinSession(joinCode.trim().toUpperCase());
      enterLobby(joinCode.trim().toUpperCase(), s.id);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      const map: Record<string, string> = { NOT_FOUND: 'Sala no encontrada.', FULL: 'La sala está llena.', NOT_WAITING: 'La partida ya comenzó.' };
      setHttpError(map[msg ?? ''] ?? 'No se pudo unir.');
    } finally { setLoading(false); }
  }

  function handleStart()   { if (sessionCode && token && socket) socket.emit('start_game',   { code: sessionCode, token }); }
  function handleEndGame() { if (sessionCode && token && socket) socket.emit('end_game',     { code: sessionCode, token }); }
  function handleSendChat() {
    if (!chatInput.trim() || !sessionCode || !token || !socket) return;
    socket.emit('chat_message', { code: sessionCode, token, content: chatInput.trim() });
    setChatInput('');
  }
  function handleCopy() {
    if (!sessionCode) return;
    navigator.clipboard.writeText(sessionCode);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  function handleFormSuccess() {
    // Guardar duración en sessionStorage por si el socket tarda o solo hay 1 jugador
    if (sessionCode) {
      sessionStorage.setItem('bo3ia_completed_session', JSON.stringify({ duration_seconds: durationSeconds, code: sessionCode }));
    }
    // Notificar al servidor que este jugador ya entregó el formulario
    if (socket && sessionCode && token) {
      socket.emit('form_submitted', { code: sessionCode, token });
    }
    // Si es solo 1 jugador, el servidor emitirá all_forms_ready de todas formas
  }
  function handleLeaveStats() {
    setSessionCode(null); setSessionId(null);
    navigate('/', { replace: true });
  }

  // ═══ VISTA: home ═══════════════════════════════════════════════════════════
  if (view === 'home') {
    return (
      <Box sx={{ background: 'linear-gradient(135deg,#0d0a1e,#1a0e2a)', border: '1px solid rgba(186,104,200,0.2)', borderRadius: 2, p: 3, mb: 3 }}>
        <Typography variant="overline" sx={{ color: '#ce93d8', fontWeight: 700, letterSpacing: 2, fontSize: 11 }}>
          ▸ THE SHADOW SOCIETY — SALA MULTIJUGADOR
        </Typography>
        {httpError && <Alert severity="error" sx={{ mt: 1.5, mb: 1 }}>{httpError}</Alert>}
        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            disabled={loading} onClick={() => void handleCreate()}
            sx={{ bgcolor: '#7b1fa2', '&:hover': { bgcolor: '#8e24aa' } }}>
            Crear sala
          </Button>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField size="small" placeholder="Código (SOE-XXXX)" value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && void handleJoin()}
              slotProps={{ htmlInput: { maxLength: 8, style: { fontFamily: 'monospace', letterSpacing: 2 } } }}
              sx={{ width: 180 }} />
            <Button variant="outlined" startIcon={<GroupAddIcon />}
              disabled={loading || !joinCode.trim()} onClick={() => void handleJoin()}>
              Unirse
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  // ═══ VISTA: form (formulario post-partida) ═════════════════════════════════
  if (view === 'form') {
    const submitted = formsProgress?.submitted ?? 0;
    const total     = formsProgress?.total ?? (session?.members.length ?? 1);
    const waiting   = formsProgress !== null && submitted < total;

    return (
      <Box>
        <Alert severity="info" icon={<AccessTimeIcon />} sx={{ mb: 2, fontWeight: 600 }}>
          ¡Partida terminada! Duración: <strong>{formatDuration(durationSeconds)}</strong>. Completá el formulario para registrar tu game.
        </Alert>
        {waiting && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ✅ Formulario enviado — esperando a otros jugadores… ({submitted}/{total})
          </Alert>
        )}
        <GameForm sessionId={sessionId ?? undefined} onSuccess={handleFormSuccess} />
      </Box>
    );
  }

  // ═══ VISTA: stats grupales ═════════════════════════════════════════════════
  if (view === 'stats') {
    const statsCode = sessionCode ?? (() => {
      try { return (JSON.parse(sessionStorage.getItem('bo3ia_completed_session') ?? '{}') as { code?: string }).code ?? ''; } catch { return ''; }
    })();
    return (
      <Box sx={{ background: 'linear-gradient(135deg,#0d0a1e,#1a0e2a)', border: '1px solid rgba(186,104,200,0.2)', borderRadius: 2, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" sx={{ color: '#ce93d8', fontWeight: 700 }}>
            📊 ESTADÍSTICAS DE LA SESIÓN
          </Typography>
          <Button variant="outlined" size="small" onClick={handleLeaveStats}
            sx={{ borderColor: 'rgba(186,104,200,0.4)', color: '#ce93d8', '&:hover': { borderColor: '#ce93d8' } }}>
            Volver al inicio
          </Button>
        </Box>
        {statsCode && <SessionStatsPanel code={statsCode} />}
      </Box>
    );
  }

  // ═══ VISTA: game (partida en curso) ════════════════════════════════════════
  if (view === 'game') {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '260px 1fr' }, gap: 2, minHeight: '70vh' }}>

        {/* Panel izquierdo */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper sx={{ p: 2, bgcolor: '#0d0a1e', border: '1px solid rgba(186,104,200,0.25)' }}>
            <Typography variant="caption" sx={{ color: '#ce93d8', letterSpacing: 2 }}>SALA</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Typography sx={{ fontFamily: 'monospace', color: '#e3f2fd', fontSize: 18, letterSpacing: 3 }}>{sessionCode}</Typography>
              <IconButton size="small" onClick={handleCopy} sx={{ color: '#546e7a' }}>
                <ContentCopyIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <AccessTimeIcon sx={{ fontSize: 14, color: '#4caf50' }} />
              <Typography sx={{ fontFamily: 'monospace', color: '#4caf50', fontSize: 14 }}>{formatDuration(elapsed)}</Typography>
            </Box>
            <Snackbar open={copied} autoHideDuration={1500} message="¡Código copiado!" anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
          </Paper>

          <Paper sx={{ p: 2, bgcolor: '#0d0a1e', border: '1px solid rgba(186,104,200,0.25)', flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#78909c', letterSpacing: 2, display: 'block', mb: 1 }}>
              JUGADORES ({memberCount}/{maxPlayers})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {session?.members.map((m) => (
                <Box key={m.user_id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.04)' }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: m.is_leader ? '#7b1fa2' : '#37474f', fontSize: 16 }}>
                    {getAvatar(m.avatar)}
                  </Avatar>
                  <Typography variant="body2" sx={{ color: '#cfd8dc', flex: 1, fontSize: 12 }}>{m.username}</Typography>
                  {m.is_leader && <Chip label="LÍDER" size="small" sx={{ bgcolor: '#7b1fa255', color: '#ce93d8', fontSize: 9 }} />}
                  {Number(m.user_id) === Number(user?.id) && <Chip label="TÚ" size="small" sx={{ bgcolor: '#37474f55', color: '#90a4ae', fontSize: 9 }} />}
                </Box>
              ))}
              {Array.from({ length: maxPlayers - memberCount }).map((_, i) => (
                <Box key={`empty-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, borderRadius: 1, border: '1px dashed rgba(255,255,255,0.07)' }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'transparent', border: '1px dashed rgba(255,255,255,0.15)' }}>
                    <EmojiPeopleIcon sx={{ fontSize: 14, color: '#546e7a' }} />
                  </Avatar>
                  <Typography variant="body2" sx={{ color: '#546e7a', fontStyle: 'italic', fontSize: 12 }}>Slot vacío</Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
              {connected ? <WifiIcon sx={{ fontSize: 14, color: '#4caf50' }} /> : <WifiOffIcon sx={{ fontSize: 14, color: '#f44336' }} />}
              <Typography variant="caption" sx={{ color: connected ? '#4caf50' : '#f44336' }}>
                {connected ? 'Conectado' : 'Reconectando...'}
              </Typography>
            </Box>
          </Paper>

          {isLeader ? (
            <Button variant="contained" color="error" startIcon={<StopCircleIcon />}
              onClick={handleEndGame} fullWidth sx={{ fontWeight: 700, py: 1.5 }}>
              TERMINAR PARTIDA
            </Button>
          ) : (
            <Typography variant="caption" sx={{ color: '#546e7a', textAlign: 'center', display: 'block' }}>
              Esperando que el líder termine la partida...
            </Typography>
          )}
          {socketError && <Alert severity="error" sx={{ mt: 1 }}>{socketError}</Alert>}
        </Box>

        {/* Panel derecho: chat de jugadores + IA */}
        <Paper sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#0d0a1e', border: '1px solid rgba(186,104,200,0.25)', overflow: 'hidden' }}>
          {/* Pestañas */}
          <Tabs
            value={rightTab}
            onChange={(_, v: 0 | 1) => setRightTab(v)}
            sx={{
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              minHeight: 40,
              '& .MuiTab-root': { minHeight: 40, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#78909c', py: 0 },
              '& .Mui-selected': { color: '#ce93d8 !important' },
              '& .MuiTabs-indicator': { bgcolor: '#ce93d8' },
            }}
          >
            <Tab icon={<ForumIcon sx={{ fontSize: 14 }} />} iconPosition="start" label="CHAT EN VIVO" value={0} />
            <Tab icon={<SmartToyIcon sx={{ fontSize: 14 }} />} iconPosition="start" label="IA TÁCTICA" value={1} />
          </Tabs>

          {/* Pestaña 0: Chat de jugadores */}
          <Box sx={{ display: rightTab === 0 ? 'flex' : 'none', flex: 1, flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1, minHeight: 0 }}>
                {messages.length === 0 && (
                  <Typography variant="caption" sx={{ color: '#546e7a', textAlign: 'center', mt: 4 }}>
                    No hay mensajes. ¡Empezá la conversación!
                  </Typography>
                )}
                {messages.map((msg) => {
                  const isMe = !!user && Number(msg.user_id) === Number(user.id);
                  return (
                    <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      {!isMe && <Typography variant="caption" sx={{ color: '#ce93d8', mb: 0.25, fontSize: 10 }}>{msg.username}</Typography>}
                      <Box sx={{
                        maxWidth: '80%', px: 1.5, py: 0.75, borderRadius: 2,
                        bgcolor: isMe ? '#6a1b9a' : 'rgba(255,255,255,0.08)', color: '#e3f2fd', fontSize: 13,
                        borderBottomRightRadius: isMe ? 2 : 8, borderBottomLeftRadius: isMe ? 8 : 2,
                      }}>
                        {msg.content}
                      </Box>
                      <Typography variant="caption" sx={{ color: '#546e7a', fontSize: 10, mt: 0.25 }}>
                        {new Date(msg.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  );
                })}
                <div ref={chatBottomRef} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, p: 1.5, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <TextField fullWidth size="small" placeholder="Escribe un mensaje..." value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                  slotProps={{ htmlInput: { maxLength: 300 } }}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.04)', fontSize: 13 } }} />
                <IconButton onClick={handleSendChat} disabled={!chatInput.trim()} sx={{ color: '#ce93d8' }}>
                  <SendIcon />
                </IconButton>
              </Box>
          </Box>

          {/* Pestaña 1: IA Táctica — siempre montada para no perder historial */}
          <Box sx={{ display: rightTab === 1 ? 'flex' : 'none', flex: 1, minHeight: 0, flexDirection: 'column', overflow: 'hidden' }}>
            <ChatPanel embedded />
          </Box>
        </Paper>
      </Box>
    );
  }

  // ═══ VISTA: lobby (sala de espera) ═════════════════════════════════════════
  return (
    <Box sx={{ background: 'linear-gradient(135deg,#0d0a1e,#1a0e2a)', border: '1px solid rgba(186,104,200,0.3)', borderRadius: 2, p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="overline" sx={{ color: '#ce93d8', fontWeight: 700, letterSpacing: 2, fontSize: 11 }}>▸ THE SHADOW SOCIETY</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="h5" sx={{ fontFamily: 'monospace', color: '#e3f2fd', letterSpacing: 3 }}>{sessionCode}</Typography>
            <Tooltip title={copied ? '¡Copiado!' : 'Copiar código'}>
              <Button size="small" onClick={handleCopy} sx={{ minWidth: 0, color: '#ce93d8' }}><ContentCopyIcon fontSize="small" /></Button>
            </Tooltip>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={connected ? 'Conectado' : 'Conectando...'}>
            <Box>{connected ? <WifiIcon sx={{ color: '#4caf50', fontSize: 18 }} /> : <WifiOffIcon sx={{ color: '#f44336', fontSize: 18 }} />}</Box>
          </Tooltip>
          <Chip label="Esperando jugadores" color="warning" size="small" />
          <Tooltip title="Salir de la sala">
            <Button size="small" onClick={leaveLobby} sx={{ minWidth: 0, color: '#78909c', fontSize: 11 }}>✕ Salir</Button>
          </Tooltip>
        </Box>
      </Box>

      {(socketError ?? httpError) && <Alert severity="error" sx={{ mt: 1.5 }}>{socketError ?? httpError}</Alert>}
      <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.07)' }} />

      <Typography variant="caption" sx={{ color: '#78909c', mb: 1, display: 'block' }}>JUGADORES ({memberCount}/{maxPlayers})</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {session?.members.map((m) => (
          <Box key={m.user_id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.04)' }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: m.is_leader ? '#7b1fa2' : '#37474f', fontSize: 18 }}>{getAvatar(m.avatar)}</Avatar>
            <Typography variant="body2" sx={{ color: '#cfd8dc', flex: 1 }}>{m.username}</Typography>
            {m.is_leader && <Chip label="LÍDER" size="small" sx={{ bgcolor: '#7b1fa255', color: '#ce93d8', fontSize: 10 }} />}
            {Number(m.user_id) === Number(user?.id) && <Chip label="TÚ" size="small" sx={{ bgcolor: '#37474f55', color: '#90a4ae', fontSize: 10 }} />}
          </Box>
        ))}
        {Array.from({ length: maxPlayers - memberCount }).map((_, i) => (
          <Box key={`empty-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'transparent', border: '1px dashed rgba(255,255,255,0.15)' }}>
              <EmojiPeopleIcon sx={{ fontSize: 16, color: '#546e7a' }} />
            </Avatar>
            <Typography variant="body2" sx={{ color: '#546e7a', fontStyle: 'italic' }}>Esperando jugador...</Typography>
          </Box>
        ))}
      </Box>

      {isLeader ? (
        <Box sx={{ mt: 2.5 }}>
          <Button variant="contained" color="success" startIcon={<PlayArrowIcon />}
            onClick={handleStart} fullWidth sx={{ fontWeight: 700 }}>
            INICIAR PARTIDA
          </Button>
        </Box>
      ) : (
        <Typography variant="caption" sx={{ color: '#546e7a', mt: 2, display: 'block', textAlign: 'center' }}>
          Esperando que el líder inicie la partida...
        </Typography>
      )}

      {/* Toast: alguien se unió / salió */}
      <Snackbar
        open={joinToast !== null}
        autoHideDuration={3000}
        onClose={() => setJoinToast(null)}
        message={joinToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

