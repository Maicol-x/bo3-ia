import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { SessionData, SessionMember, ChatMsg } from '../services/sessionService';

const SOCKET_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface UseSessionSocketOptions {
  code: string | null;
  token: string | null;
  onGameStarted?:   (session: SessionData) => void;
  onGameEnded?:     (data: { session: SessionData; duration_seconds: number }) => void;
  onPlayerJoined?:  (username: string) => void;
  onPlayerLeft?:    (username: string) => void;
  onFormsProgress?: (data: { submitted: number; total: number }) => void;
  onAllFormsReady?: (code: string) => void;
}

interface SessionSocketState {
  session:     SessionData | null;
  messages:    ChatMsg[];
  socketError: string | null;
  connected:   boolean;
  socket:      Socket | null;
}

export function useSessionSocket({
  code, token, onGameStarted, onGameEnded, onPlayerJoined, onPlayerLeft,
  onFormsProgress, onAllFormsReady,
}: UseSessionSocketOptions): SessionSocketState {
  const socketRef            = useRef<Socket | null>(null);
  const onGameStartedRef     = useRef(onGameStarted);
  const onGameEndedRef       = useRef(onGameEnded);
  const onPlayerJoinedRef    = useRef(onPlayerJoined);
  const onPlayerLeftRef      = useRef(onPlayerLeft);
  const onFormsProgressRef   = useRef(onFormsProgress);
  const onAllFormsReadyRef   = useRef(onAllFormsReady);
  onGameStartedRef.current    = onGameStarted;
  onGameEndedRef.current      = onGameEnded;
  onPlayerJoinedRef.current   = onPlayerJoined;
  onPlayerLeftRef.current     = onPlayerLeft;
  onFormsProgressRef.current  = onFormsProgress;
  onAllFormsReadyRef.current  = onAllFormsReady;

  const [session,     setSession]     = useState<SessionData | null>(null);
  const [messages,    setMessages]    = useState<ChatMsg[]>([]);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [connected,   setConnected]   = useState(false);

  useEffect(() => {
    if (!code || !token) return;

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setSocketError(null);
      socket.emit('join_room', { code, token });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('room_state', (s: SessionData) => setSession(s));

    socket.on('player_joined', ({ username, members }: { username: string; members: SessionMember[] }) => {
      setSession((prev) => prev ? { ...prev, members } : prev);
      onPlayerJoinedRef.current?.(username);
    });

    socket.on('player_left', ({ username, members }: { username: string; members: SessionMember[] }) => {
      setSession((prev) => prev ? { ...prev, members } : prev);
      onPlayerLeftRef.current?.(username);
    });

    socket.on('game_started', (s: SessionData) => {
      setSession(s);
      onGameStartedRef.current?.(s);
    });

    socket.on('new_message', (msg: ChatMsg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('game_ended', (data: { session: SessionData; duration_seconds: number }) => {
      setSession(data.session);
      onGameEndedRef.current?.(data);
    });

    socket.on('forms_progress', (data: { submitted: number; total: number }) => {
      onFormsProgressRef.current?.(data);
    });

    socket.on('all_forms_ready', ({ code: readyCode }: { code: string }) => {
      onAllFormsReadyRef.current?.(readyCode);
    });

    socket.on('error', ({ message }: { message: string }) => {
      setSocketError(message);
    });

    return () => {
      socket.emit('leave_room', { code });
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, token]);

  return { session, messages, socketError, connected, socket: socketRef.current };
}
