import { Box, Paper, Typography, Divider, Chip, List, ListItem, ListItemText, CircularProgress, Alert } from '@mui/material';
import { QueryStats as QueryStatsIcon, TipsAndUpdates as TipsAndUpdatesIcon } from '@mui/icons-material';
import { useStats } from '../hooks/useGames';

const ZONE_LABELS: Record<string, string> = {
  junction: 'Junction',
  canal_district: 'Canal District',
  footlight_district: 'Footlight District',
  waterfront_district: 'Waterfront District',
  the_rift: 'The Rift',
  desconocida: 'Desconocida',
};

const StatRow = ({ label, value }: { label: string; value: string | number }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
    <Typography variant="body2" color="text.secondary" sx={{ letterSpacing: '0.05em' }}>{label}</Typography>
    <Chip label={value} size="small" variant="outlined" color="primary" sx={{ fontFamily: '"Share Tech Mono", monospace' }} />
  </Box>
);

const StatsPanel: React.FC = () => {
  const { data, isLoading, isError } = useStats();

  if (isLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
      <CircularProgress color="primary" />
    </Box>
  );
  if (isError || !data) return <Alert severity="error">Error al cargar estadísticas.</Alert>;

  const { stats, tips } = data;

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <QueryStatsIcon color="primary" />
        <Typography variant="h5" color="primary" sx={{ letterSpacing: '0.1em' }}>ANÁLISIS</Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <StatRow label="PARTIDAS REGISTRADAS" value={stats.total_games} />
      <StatRow label="RONDA PROMEDIO" value={stats.avg_round} />
      <StatRow label="MEJOR ZONA" value={ZONE_LABELS[stats.best_zone] ?? stats.best_zone} />
      <StatRow label="PROMEDIO CON JUGGERNOG" value={`R${stats.juggernog_avg_round}`} />
      <StatRow label="PROMEDIO SIN JUGGERNOG" value={`R${stats.no_juggernog_avg_round}`} />
      <StatRow label="PROMEDIO CON PAP" value={`R${stats.pap_avg_round}`} />
      <StatRow label="CAUSA DE MUERTE COMÚN" value={stats.most_common_cause} />
      <StatRow label="AAT MÁS EFECTIVO" value={stats.most_effective_aat} />

      {tips.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <TipsAndUpdatesIcon color="primary" />
            <Typography variant="h6" color="primary" sx={{ letterSpacing: '0.1em' }}>RECOMENDACIONES IA</Typography>
          </Box>
          <List dense disablePadding>
            {tips.map((tip, i) => (
              <ListItem key={i} disableGutters sx={{ alignItems: 'flex-start' }}>
                <ListItemText
                  primary={`> ${tip}`}
                  slotProps={{ primary: { variant: 'body2', color: 'text.secondary', sx: { fontFamily: '"Share Tech Mono", monospace' } } }}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Paper>
  );
};

export default StatsPanel;

