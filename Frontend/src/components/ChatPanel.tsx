import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Chip,
  Collapse,
  Avatar,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { sendChatMessage, type ChatMessage } from '../services/chatService';

// ─── Burbuja de mensaje ───────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        alignItems: 'flex-start',
        gap: 1,
        mb: 1,
      }}
    >
      {!isUser && (
        <Avatar sx={{ width: 28, height: 28, bgcolor: '#1a237e', mt: 0.3 }}>
          <SmartToyIcon sx={{ fontSize: 16 }} />
        </Avatar>
      )}
      <Box
        sx={{
          maxWidth: '80%',
          px: 1.5,
          py: 1,
          borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
          bgcolor: isUser ? '#1565c0' : 'rgba(255,255,255,0.07)',
          border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Typography variant="body2" sx={{ color: '#e3f2fd', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {msg.content}
        </Typography>
      </Box>
      {isUser && (
        <Avatar sx={{ width: 28, height: 28, bgcolor: '#37474f', mt: 0.3 }}>
          <PersonIcon sx={{ fontSize: 16 }} />
        </Avatar>
      )}
    </Box>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

export default function ChatPanel({ embedded = false }: { embedded?: boolean }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (open || embedded) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, open, embedded]);

  async function handleSend() {
    const msg = input.trim();
    if (!msg || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: msg };
    setHistory((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const reply = await sendChatMessage(msg, history);
      setHistory((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setError('El asistente no está disponible. Verificá que Ollama esté corriendo.');
    } finally {
      setLoading(false);
    }
  }

  // Modo embebido: siempre visible, sin header ni contenedor externo
  if (embedded) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Historial */}
        <Box sx={{
          flex: 1, overflowY: 'auto', px: 2, pt: 1, pb: 0.5,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
        }}>
          {history.length === 0 && (
            <Box sx={{ textAlign: 'center', mt: 6 }}>
              <SmartToyIcon sx={{ color: '#37474f', fontSize: 36 }} />
              <Typography variant="body2" sx={{ color: '#546e7a', mt: 1, fontSize: 13 }}>Preguntame sobre la partida.</Typography>
              <Typography variant="caption" sx={{ color: '#37474f' }}>Ej: "Nos queda un escudo, qué conviene"</Typography>
            </Box>
          )}
          {history.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: '#1a237e' }}><SmartToyIcon sx={{ fontSize: 16 }} /></Avatar>
              <Box sx={{ px: 1.5, py: 1, borderRadius: '12px 12px 12px 4px', bgcolor: 'rgba(255,255,255,0.07)' }}>
                <CircularProgress size={14} sx={{ color: '#64b5f6' }} />
              </Box>
            </Box>
          )}
          {error && <Typography variant="caption" sx={{ color: '#ef9a9a', display: 'block', mb: 1 }}>⚠ {error}</Typography>}
          <div ref={bottomRef} />
        </Box>
        {/* Input */}
        <Box sx={{ display: 'flex', gap: 1, px: 1.5, py: 1.5, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <TextField fullWidth size="small" placeholder="Preguntá algo táctico..." value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
            disabled={loading}
            slotProps={{ htmlInput: { maxLength: 500 } }}
            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.04)', fontSize: 13 } }} />
          <IconButton onClick={() => void handleSend()} disabled={loading || !input.trim()} sx={{ color: '#64b5f6', '&:disabled': { color: '#37474f' } }}>
            <SendIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 100%)',
        border: '1px solid rgba(100,181,246,0.2)',
        borderRadius: 2,
        mb: 3,
        overflow: 'hidden',
      }}
    >
      {/* Header — clickeable para expandir/colapsar */}
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 1.5,
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon sx={{ color: '#64b5f6', fontSize: 18 }} />
          <Typography
            variant="overline"
            sx={{ color: '#64b5f6', fontWeight: 700, letterSpacing: 2, fontSize: 11 }}
          >
            IA TÁCTICA — ASISTENTE EN VIVO
          </Typography>
          <Chip
            label="Groq · Llama 3.3"
            size="small"
            sx={{ bgcolor: 'rgba(100,181,246,0.1)', color: '#78909c', fontSize: 10, height: 18 }}
          />
        </Box>
        {open ? (
          <ExpandLessIcon sx={{ color: '#546e7a', fontSize: 18 }} />
        ) : (
          <ExpandMoreIcon sx={{ color: '#546e7a', fontSize: 18 }} />
        )}
      </Box>

      <Collapse in={open}>
        {/* Historial de mensajes */}
        <Box
          sx={{
            height: 320,
            overflowY: 'auto',
            px: 2,
            pt: 1,
            pb: 0.5,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
          }}
        >
          {history.length === 0 && (
            <Box sx={{ textAlign: 'center', mt: 6 }}>
              <SmartToyIcon sx={{ color: '#37474f', fontSize: 40 }} />
              <Typography variant="body2" sx={{ color: '#546e7a', mt: 1, fontSize: 13 }}>
                Preguntame cualquier cosa sobre la partida.
              </Typography>
              <Typography variant="caption" sx={{ color: '#37474f' }}>
                Ej: "Se murieron mis amigos, qué hago"
              </Typography>
            </Box>
          )}

          {history.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: '#1a237e' }}>
                <SmartToyIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <Box sx={{ px: 1.5, py: 1, borderRadius: '12px 12px 12px 4px', bgcolor: 'rgba(255,255,255,0.07)' }}>
                <CircularProgress size={14} sx={{ color: '#64b5f6' }} />
              </Box>
            </Box>
          )}

          {error && (
            <Typography variant="caption" sx={{ color: '#ef9a9a', display: 'block', mb: 1 }}>
              ⚠ {error}
            </Typography>
          )}

          <div ref={bottomRef} />
        </Box>

        {/* Input */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            px: 2,
            py: 1.5,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Preguntá algo táctico..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            disabled={loading}
            slotProps={{ htmlInput: { maxLength: 500 } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255,255,255,0.04)',
                fontSize: 13,
              },
            }}
          />
          <IconButton
            onClick={() => void handleSend()}
            disabled={loading || !input.trim()}
            sx={{ color: '#64b5f6', '&:disabled': { color: '#37474f' } }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Box>
      </Collapse>
    </Box>
  );
}
