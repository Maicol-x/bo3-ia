import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Divider,
  Tooltip,
  Skeleton,
  Alert,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useTrends } from '../hooks/useTrends';
import type { TrendMetric, OverallTrend, TrendDirection } from '../services/trendService';

// ─── Helpers de color / ícono ─────────────────────────────────────────────────

function trendColor(dir: TrendDirection): string {
  if (dir === 'up') return '#4caf50';
  if (dir === 'down') return '#f44336';
  return '#9e9e9e';
}

function overallColor(trend: OverallTrend): string {
  if (trend === 'mejorando') return '#4caf50';
  if (trend === 'empeorando') return '#f44336';
  return '#9e9e9e';
}

function OverallIcon({ trend }: { trend: OverallTrend }) {
  const color = overallColor(trend);
  const sx = { fontSize: 40, color };
  if (trend === 'mejorando') return <TrendingUpIcon sx={sx} />;
  if (trend === 'empeorando') return <TrendingDownIcon sx={sx} />;
  if (trend === 'estable') return <TrendingFlatIcon sx={sx} />;
  return <HourglassEmptyIcon sx={{ ...sx, color: '#78909c' }} />;
}

function MetricTrendIcon({ dir }: { dir: TrendDirection }) {
  const color = trendColor(dir);
  const sx = { fontSize: 18, color, ml: 0.5 };
  if (dir === 'up') return <TrendingUpIcon sx={sx} />;
  if (dir === 'down') return <TrendingDownIcon sx={sx} />;
  return <TrendingFlatIcon sx={sx} />;
}

// ─── Fila de métrica ──────────────────────────────────────────────────────────

function MetricRow({ metric }: { metric: TrendMetric }) {
  const color = trendColor(metric.trend);
  const sign = metric.change_pct >= 0 ? '+' : '';
  const unitLabel = metric.unit === '%' ? '%' : ` ${metric.unit}`;

  return (
    <Tooltip title={metric.interpretation} placement="right" arrow>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          alignItems: 'center',
          gap: 1,
          py: 0.8,
          px: 1,
          borderRadius: 1,
          cursor: 'default',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
        }}
      >
        {/* Nombre */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <MetricTrendIcon dir={metric.trend} />
          <Typography variant="body2" sx={{ color: '#cfd8dc', fontSize: 13 }}>
            {metric.label}
          </Typography>
        </Box>

        {/* Valores antiguo → nuevo */}
        <Typography variant="body2" sx={{ color: '#78909c', fontSize: 12, whiteSpace: 'nowrap' }}>
          {metric.old_value}{unitLabel} → {metric.new_value}{unitLabel}
        </Typography>

        {/* % cambio */}
        <Chip
          label={`${sign}${metric.change_pct}%`}
          size="small"
          sx={{
            bgcolor: `${color}22`,
            color,
            border: `1px solid ${color}55`,
            fontWeight: 700,
            fontSize: 11,
            height: 22,
            minWidth: 56,
          }}
        />
      </Box>
    </Tooltip>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

export default function TrendPanel() {
  const { data, isLoading, isError } = useTrends();

  // Loading
  if (isLoading) {
    return (
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="rounded" height={160} sx={{ bgcolor: 'rgba(255,255,255,0.07)' }} />
      </Box>
    );
  }

  // Error
  if (isError) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        No se pudo cargar el análisis de progresión.
      </Alert>
    );
  }

  if (!data) return null;

  const overallLabel: Record<OverallTrend, string> = {
    mejorando: 'MEJORANDO',
    empeorando: 'BAJANDO',
    estable: 'ESTABLE',
    sin_datos: 'SIN DATOS',
  };

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #0d1b2a 0%, #112233 100%)',
        border: '1px solid rgba(100,181,246,0.2)',
        borderRadius: 2,
        p: 2.5,
        mb: 3,
      }}
    >
      {/* Header */}
      <Typography
        variant="overline"
        sx={{ color: '#64b5f6', fontWeight: 700, letterSpacing: 2, fontSize: 11 }}
      >
        ▸ ANÁLISIS DE PROGRESIÓN
      </Typography>

      {/* Sin suficientes datos */}
      {!data.has_enough_data ? (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="body2" sx={{ color: '#90a4ae', mb: 1.5 }}>
            {data.summary}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HourglassEmptyIcon sx={{ color: '#78909c', fontSize: 16 }} />
            <Typography variant="caption" sx={{ color: '#78909c' }}>
              {data.games_analyzed} / {data.min_games_required} partidas registradas
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(data.games_analyzed / data.min_games_required) * 100}
            sx={{
              mt: 1,
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.08)',
              '& .MuiLinearProgress-bar': { bgcolor: '#64b5f6' },
            }}
          />
        </Box>
      ) : (
        <>
          {/* Overall trend + summary */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5, mb: 1.5 }}>
            <OverallIcon trend={data.overall_trend} />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  color: overallColor(data.overall_trend),
                  fontWeight: 800,
                  lineHeight: 1.1,
                  textTransform: 'uppercase',
                  fontSize: 18,
                }}
              >
                {overallLabel[data.overall_trend]}
              </Typography>
              <Typography variant="caption" sx={{ color: '#78909c' }}>
                {data.period_label} · {data.games_analyzed} partidas analizadas
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" sx={{ color: '#90a4ae', mb: 2, fontSize: 13 }}>
            {data.summary}
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mb: 1.5 }} />

          {/* Métricas individuales */}
          {data.metrics.map((m) => (
            <MetricRow key={m.key} metric={m} />
          ))}

          <Typography variant="caption" sx={{ color: '#546e7a', mt: 1, display: 'block' }}>
            * Pasá el cursor sobre cada métrica para ver la interpretación
          </Typography>
        </>
      )}
    </Box>
  );
}
