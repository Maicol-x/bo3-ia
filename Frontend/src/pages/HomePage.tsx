import { useState, useEffect } from 'react';
import { Box, Typography, Divider, Button, Tooltip, Snackbar, Alert } from '@mui/material';
import { LogoutOutlined } from '@mui/icons-material';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { logout } from '../store/authSlice';
import StatsPanel from '../components/StatsPanel';
import GameHistory from '../components/GameHistory';
import ChartsPanel from '../components/ChartsPanel';
import BriefingPanel from '../components/BriefingPanel';
import TrendPanel from '../components/TrendPanel';
import AvatarPickerModal from '../components/AvatarPickerModal';
import { getAvatar } from '../constants/avatars';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h} hora${h > 1 ? 's' : ''} ${m}m ${s}s`;
  if (m > 0) return `${m} minuto${m > 1 ? 's' : ''} y ${s} segundo${s !== 1 ? 's' : ''}`;
  return `${s} segundo${s !== 1 ? 's' : ''}`;
}

const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const [congrats, setCongrats] = useState<{ duration_seconds: number } | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('bo3ia_completed_session');
    if (raw) {
      try { setCongrats(JSON.parse(raw) as { duration_seconds: number }); }
      catch { /* ignorar */ }
      sessionStorage.removeItem('bo3ia_completed_session');
    }
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
  <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', px: { xs: 2, md: 6 }, py: 4 }}>
    {/* Banner felicitaciones post-partida */}
    <Snackbar
      open={congrats !== null}
      autoHideDuration={3500}
      onClose={() => setCongrats(null)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        severity="success"
        icon={<EmojiEventsIcon />}
        onClose={() => setCongrats(null)}
        sx={{ fontWeight: 600, fontSize: 15 }}
      >
        ¡Felicidades! Aguantaron <strong>{formatDuration(congrats?.duration_seconds ?? 0)}</strong> en Shadows of Evil 🎉
      </Alert>
    </Snackbar>

    {/* Header */}
    <Box sx={{ mb: 4, textAlign: 'center', position: 'relative' }}>
      <Typography variant="h3" color="primary" sx={{ letterSpacing: '0.15em', textShadow: '0 0 20px rgba(170,59,255,0.6)' }}>
        BO3-IA
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ letterSpacing: '0.3em', mt: 0.5 }}>
        SHADOWS OF EVIL // SISTEMA DE ANÁLISIS TÁCTICO
      </Typography>

      {/* Usuario + logout */}
      <Box sx={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title="Cambiar avatar">
          <Button
            size="small"
            onClick={() => setAvatarOpen(true)}
            sx={{
              minWidth: 0, px: 0.5, py: 0.5,
              fontSize: 20, lineHeight: 1,
              color: 'text.primary',
            }}
          >
            {getAvatar(user?.avatar)}
          </Button>
        </Tooltip>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: '"Share Tech Mono", monospace' }}>
          {user?.username ?? ''}
        </Typography>
        <Tooltip title="Sala multijugador">
          <Button size="small" variant="outlined" color="info" onClick={() => navigate('/session')} sx={{ minWidth: 0, px: 1, py: 0.5 }}>
            <GroupsIcon fontSize="small" />
          </Button>
        </Tooltip>
        <Tooltip title="Cerrar sesión">
          <Button size="small" variant="outlined" color="secondary" onClick={handleLogout} sx={{ minWidth: 0, px: 1, py: 0.5 }}>
            <LogoutOutlined fontSize="small" />
          </Button>
        </Tooltip>
      </Box>

      <AvatarPickerModal open={avatarOpen} onClose={() => setAvatarOpen(false)} />

      <Divider sx={{ mt: 2 }} />
    </Box>

    {/* Briefing pre-partida */}
    <BriefingPanel />

    {/* Análisis de progresión */}
    <TrendPanel />

    {/* Estadísticas + historial */}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 4, alignItems: 'start' }}>
      <StatsPanel />
      <Box>
        <ChartsPanel />
      </Box>
    </Box>

    {/* Historial completo */}
    <Box sx={{ mt: 4 }}>
      <GameHistory />
    </Box>
  </Box>
  );
};

export default HomePage;
