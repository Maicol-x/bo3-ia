import { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip,
  CircularProgress, Divider, Avatar, Collapse,
} from '@mui/material';
import EmojiEventsIcon  from '@mui/icons-material/EmojiEvents';
import PersonIcon       from '@mui/icons-material/Person';
import TimerIcon        from '@mui/icons-material/Timer';
import SmartToyIcon     from '@mui/icons-material/SmartToy';
import type { SessionStats, PlayerGame } from '../services/sessionService';
import { getSessionStats, getSessionSummary } from '../services/sessionService';
import { ZONE_LABELS, CHARACTER_LABELS, CAUSE_LABELS, PERK_LABELS, label } from '../constants/labels';
import { getAvatar } from '../constants/avatars';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function medalColor(rank: number): string {
  if (rank === 0) return '#FFD700';
  if (rank === 1) return '#C0C0C0';
  if (rank === 2) return '#CD7F32';
  return '#546e7a';
}

function GameCard({ game, index }: { game: PlayerGame; index: number }) {
  return (
    <Box sx={{
      p: 1.5, borderRadius: 1.5, mb: 1,
      bgcolor: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(186,104,200,0.15)',
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
        <Typography variant="caption" sx={{ color: '#78909c' }}>Partida {index + 1}</Typography>
        <Chip label={`Ronda ${game.round}`} size="small"
          sx={{ bgcolor: 'rgba(206,147,216,0.15)', color: '#ce93d8', fontWeight: 700, fontSize: 11 }} />
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 0.75 }}>
        {game.character && <InfoBit icon="🎭" text={label(CHARACTER_LABELS, game.character)} />}
        <InfoBit icon="📍" text={label(ZONE_LABELS, game.zone)} />
        <InfoBit icon="💀" text={`Murió por: ${label(CAUSE_LABELS, game.cause_of_death)}`} color="#ef9a9a" />
        {game.pack_a_punch && <InfoBit icon="⚡" text="Pack-a-Punch" color="#80cbc4" />}
      </Box>

      {game.perks.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
          {game.perks.map((p) => (
            <Chip key={p} label={label(PERK_LABELS, p)} size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#b0bec5', fontSize: 10, height: 20 }} />
          ))}
        </Box>
      )}

      {game.rituals_completed > 0 && (
        <Typography variant="caption" sx={{ color: '#78909c', display: 'block' }}>
          Rituales completados: {game.rituals_completed}
        </Typography>
      )}
      {game.points_at_death != null && (
        <Typography variant="caption" sx={{ color: '#78909c', display: 'block' }}>
          Puntos al morir: {game.points_at_death.toLocaleString()}
        </Typography>
      )}
      {game.notes && (
        <Typography variant="caption" sx={{ color: '#90a4ae', fontStyle: 'italic', display: 'block', mt: 0.5 }}>
          "{game.notes}"
        </Typography>
      )}
    </Box>
  );
}

function InfoBit({ icon, text, color = '#b0bec5' }: { icon: string; text: string; color?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
      <Typography sx={{ fontSize: 12 }}>{icon}</Typography>
      <Typography variant="caption" sx={{ color }}>{text}</Typography>
    </Box>
  );
}

interface Props {
  code: string;
}

export default function SessionStatsPanel({ code }: Props) {
  const [stats,          setStats]          = useState<SessionStats | null>(null);
  const [summary,        setSummary]        = useState<string | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    getSessionStats(code)
      .then((s) => {
        setStats(s);
        if (s.total_games > 0) {
          setSummaryLoading(true);
          getSessionSummary(code)
            .then(setSummary)
            .catch(() => setSummary(null))
            .finally(() => setSummaryLoading(false));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress sx={{ color: '#ce93d8' }} />
      </Box>
    );
  }

  if (!stats) {
    return (
      <Typography sx={{ color: '#78909c', textAlign: 'center', py: 4 }}>
        No se encontraron estadísticas.
      </Typography>
    );
  }

  const sorted = [...stats.players].sort((a, b) => b.best_round - a.best_round);

  return (
    <Box>
      {/* Header de sesión */}
      <Box sx={{
        display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center',
        mb: 3, p: 2, borderRadius: 2, bgcolor: 'rgba(206,147,216,0.08)',
        border: '1px solid rgba(186,104,200,0.25)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TimerIcon sx={{ color: '#ce93d8', fontSize: 18 }} />
          <Typography variant="body2" sx={{ color: '#cfd8dc' }}>
            {stats.duration_seconds != null ? formatDuration(stats.duration_seconds) : '—'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PersonIcon sx={{ color: '#ce93d8', fontSize: 18 }} />
          <Typography variant="body2" sx={{ color: '#cfd8dc' }}>
            {stats.player_count} jugador{stats.player_count !== 1 ? 'es' : ''}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <EmojiEventsIcon sx={{ color: '#FFD700', fontSize: 18 }} />
          <Typography variant="body2" sx={{ color: '#cfd8dc' }}>
            Mejor ronda: <strong style={{ color: '#FFD700' }}>{stats.best_round_overall}</strong>
          </Typography>
        </Box>
      </Box>

      {/* Análisis IA */}
      <Collapse in={summaryLoading || summary !== null}>
        <Box sx={{
          mb: 3, p: 2, borderRadius: 2,
          bgcolor: 'rgba(123,31,162,0.15)',
          border: '1px solid rgba(186,104,200,0.35)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SmartToyIcon sx={{ color: '#ce93d8', fontSize: 18 }} />
            <Typography variant="caption" sx={{ color: '#ce93d8', fontWeight: 700, letterSpacing: 1 }}>
              ANÁLISIS IA
            </Typography>
          </Box>
          {summaryLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={14} sx={{ color: '#ce93d8' }} />
              <Typography variant="caption" sx={{ color: '#78909c' }}>Generando análisis…</Typography>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: '#e1bee7', lineHeight: 1.7 }}>
              {summary}
            </Typography>
          )}
        </Box>
      </Collapse>

      {sorted.length === 0 ? (
        <Typography sx={{ color: '#78909c', textAlign: 'center', py: 2 }}>
          Nadie guardó partidas en esta sesión.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {sorted.map((p, idx) => (
            <Grid size={{ xs: 12, md: sorted.length === 1 ? 12 : 6 }} key={p.user_id}>
              <Card sx={{
                bgcolor: 'rgba(255,255,255,0.03)',
                border: `1px solid ${idx === 0 ? 'rgba(255,215,0,0.35)' : 'rgba(186,104,200,0.2)'}`,
                borderRadius: 2,
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar sx={{
                      width: 36, height: 36,
                      bgcolor: medalColor(idx), color: '#0d0a1e', fontWeight: 700, fontSize: 20,
                    }}>
                      {getAvatar(p.avatar)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ color: '#e1bee7', fontWeight: 700 }}>
                        {p.username}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#78909c' }}>
                        {p.total_games} {p.total_games === 1 ? 'partida' : 'partidas'} · mejor ronda {p.best_round}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mb: 1.5 }} />

                  {p.games.map((g, i) => (
                    <GameCard key={i} game={g} index={i} />
                  ))}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
