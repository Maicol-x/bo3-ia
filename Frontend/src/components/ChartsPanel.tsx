import { Box, Paper, Typography, Divider, CircularProgress, Alert } from '@mui/material';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useGames } from '../hooks/useGames';

const CHART_COLOR = '#aa3bff';
const CHART_SECONDARY = '#ff6b35';
const GRID_COLOR = 'rgba(170,59,255,0.12)';
const TICK_STYLE = { fill: '#888', fontSize: 11, fontFamily: '"Share Tech Mono", monospace' };

const CAUSE_LABELS: Record<string, string> = {
  zombie: 'Zombie', margwa: 'Margwa', parasite: 'Parasite',
  meatball: 'Meatball', keeper: 'Keeper', unknown: 'Desconocida',
};

const PLATFORM_LABELS: Record<string, string> = { pc: 'PC', ps4: 'PS4', ps3: 'PS3' };

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="overline" color="primary" sx={{ letterSpacing: '0.2em', display: 'block', mb: 2 }}>
    {children}
  </Typography>
);

const ChartsPanel: React.FC = () => {
  const { data: games, isLoading, isError } = useGames();

  if (isLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
      <CircularProgress color="primary" />
    </Box>
  );
  if (isError || !games) return <Alert severity="error">Error al cargar datos para gráficas.</Alert>;
  if (games.length < 2) return (
    <Paper sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: '"Share Tech Mono", monospace' }}>
        &gt; Necesitas al menos 2 partidas para ver gráficas.
      </Typography>
    </Paper>
  );

  // --- Datos: evolución de rondas (últimas 20 partidas, orden cronológico) ---
  const roundData = [...games]
    .reverse()
    .slice(-20)
    .map((g, i) => ({ partida: i + 1, ronda: g.round }));

  // --- Datos: causas de muerte ---
  const causeCounts = games.reduce<Record<string, number>>((acc, g) => {
    acc[g.cause_of_death] = (acc[g.cause_of_death] ?? 0) + 1;
    return acc;
  }, {});
  const causeData = Object.entries(causeCounts)
    .map(([cause, count]) => ({ causa: CAUSE_LABELS[cause] ?? cause, count }))
    .sort((a, b) => b.count - a.count);

  // --- Datos: promedio de ronda por plataforma ---
  const platformMap = games.reduce<Record<string, number[]>>((acc, g) => {
    const key = g.platform ?? 'pc';
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(g.round);
    return acc;
  }, {});
  const platformData = Object.entries(platformMap).map(([plat, rounds]) => ({
    plataforma: PLATFORM_LABELS[plat] ?? plat,
    promedio: parseFloat((rounds.reduce((a, b) => a + b, 0) / rounds.length).toFixed(1)),
    partidas: rounds.length,
  }));

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box component="span" sx={{ color: 'primary.main', display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
          </svg>
        </Box>
        <Typography variant="h5" color="primary" sx={{ letterSpacing: '0.1em' }}>GRÁFICAS</Typography>
      </Box>
      <Divider sx={{ mb: 3 }} />

      {/* Evolución de rondas */}
      <SectionTitle>EVOLUCIÓN DE RONDAS (ÚLTIMAS {roundData.length})</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={roundData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis dataKey="partida" tick={TICK_STYLE} label={{ value: 'Partida', position: 'insideBottom', offset: -2, style: TICK_STYLE }} />
          <YAxis tick={TICK_STYLE} />
          <Tooltip
            contentStyle={{ background: '#110020', border: '1px solid #aa3bff', borderRadius: 4, fontFamily: '"Share Tech Mono", monospace', fontSize: 12 }}
            labelStyle={{ color: '#aa3bff' }}
          />
          <Line type="monotone" dataKey="ronda" stroke={CHART_COLOR} strokeWidth={2} dot={{ r: 3, fill: CHART_COLOR }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>

      <Divider sx={{ my: 3 }} />

      {/* Causa de muerte */}
      <SectionTitle>CAUSAS DE MUERTE</SectionTitle>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={causeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis dataKey="causa" tick={TICK_STYLE} />
          <YAxis tick={TICK_STYLE} />
          <Tooltip
            contentStyle={{ background: '#110020', border: '1px solid #aa3bff', borderRadius: 4, fontFamily: '"Share Tech Mono", monospace', fontSize: 12 }}
            labelStyle={{ color: '#aa3bff' }}
          />
          <Bar dataKey="count" name="Veces" fill={CHART_COLOR} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Comparativa por plataforma — solo si hay más de una */}
      {platformData.length > 1 && (
        <>
          <Divider sx={{ my: 3 }} />
          <SectionTitle>RONDA PROMEDIO POR PLATAFORMA</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={platformData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="plataforma" tick={TICK_STYLE} />
              <YAxis tick={TICK_STYLE} />
              <Tooltip
                contentStyle={{ background: '#110020', border: '1px solid #aa3bff', borderRadius: 4, fontFamily: '"Share Tech Mono", monospace', fontSize: 12 }}
                labelStyle={{ color: '#aa3bff' }}
              />
              <Legend wrapperStyle={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 11 }} />
              <Bar dataKey="promedio" name="Ronda prom." fill={CHART_COLOR} radius={[3, 3, 0, 0]} />
              <Bar dataKey="partidas" name="Partidas" fill={CHART_SECONDARY} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </Paper>
  );
};

export default ChartsPanel;
