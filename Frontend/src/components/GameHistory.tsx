import {
  Box, Paper, Typography, Divider, Chip, CircularProgress,
  Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip,
} from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import { useGames } from '../hooks/useGames';
import { EnemyTooltipContent, PerksTooltipContent, richTooltipSlotProps } from './InfoTooltip';

const ZONE_LABELS: Record<string, string> = {
  junction: 'Junction',
  canal_district: 'Canal District',
  footlight_district: 'Footlight District',
  waterfront_district: 'Waterfront District',
  the_rift: 'The Rift',
};

const CAUSE_LABELS: Record<string, string> = {
  zombie: 'Zombie', margwa: 'Margwa', parasite: 'Parasite',
  meatball: 'Meatball', keeper: 'Keeper', unknown: 'Desconocida',
};

const PLATFORM_LABELS: Record<string, string> = {
  pc: 'PC', ps4: 'PS4', ps3: 'PS3',
};

const causeColor = (cause: string): 'error' | 'warning' | 'default' => {
  if (cause === 'margwa' || cause === 'keeper') return 'error';
  if (cause === 'parasite' || cause === 'meatball') return 'warning';
  return 'default';
};

const GameHistory: React.FC = () => {
  const { data: games, isLoading, isError } = useGames();

  if (isLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
      <CircularProgress color="primary" />
    </Box>
  );
  if (isError || !games) return <Alert severity="error">Error al cargar el historial.</Alert>;
  if (games.length === 0) return (
    <Paper sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: '"Share Tech Mono", monospace' }}>
        &gt; Sin partidas registradas todavía.
      </Typography>
    </Paper>
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <HistoryIcon color="primary" />
        <Typography variant="h5" color="primary" sx={{ letterSpacing: '0.1em' }}>HISTORIAL</Typography>
        <Chip label={games.length} size="small" color="primary" sx={{ ml: 'auto' }} />
      </Box>
      <Divider sx={{ mb: 2 }} />

      <TableContainer sx={{ maxHeight: 420 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {['#', 'Ronda', 'Zona', 'Causa', 'Perks', 'PaP', 'Plataforma', 'Fecha', 'Nota'].map((h) => (
                <TableCell key={h} sx={{ bgcolor: 'background.paper', color: 'primary.main', fontFamily: '"Share Tech Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {games.map((g, idx) => (
              <TableRow key={g.id ?? idx} hover sx={{ '&:hover': { bgcolor: 'rgba(170,59,255,0.06)' } }}>
                <TableCell sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>{games.length - idx}</TableCell>
                <TableCell>
                  <Chip label={`R${g.round}`} size="small" color="primary" variant="outlined"
                    sx={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.75rem' }} />
                </TableCell>
                <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                  {ZONE_LABELS[g.zone] ?? g.zone}
                </TableCell>
                <TableCell>
                  <Tooltip
                    title={<EnemyTooltipContent cause={g.cause_of_death} />}
                    arrow placement="top"
                    slotProps={richTooltipSlotProps}
                  >
                    <Chip label={CAUSE_LABELS[g.cause_of_death] ?? g.cause_of_death}
                      size="small" color={causeColor(g.cause_of_death)}
                      sx={{ fontSize: '0.72rem', cursor: 'help' }} />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip
                    title={<PerksTooltipContent perks={g.perks} />}
                    arrow placement="top"
                    slotProps={richTooltipSlotProps}
                  >
                    <Chip label={g.perks.length} size="small" variant="outlined"
                      color={g.perks.includes('juggernog') ? 'success' : 'default'}
                      sx={{ fontSize: '0.72rem', cursor: 'help' }} />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Chip label={g.pack_a_punch ? 'SÍ' : 'NO'} size="small"
                    color={g.pack_a_punch ? 'success' : 'default'} sx={{ fontSize: '0.72rem' }} />
                </TableCell>
                <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                  {PLATFORM_LABELS[g.platform] ?? g.platform}
                </TableCell>
                <TableCell sx={{ fontSize: '0.72rem', color: 'text.disabled', whiteSpace: 'nowrap' }}>
                  {g.created_at ? new Date(g.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.72rem', color: 'text.secondary', maxWidth: 160 }}>
                  {g.notes
                    ? <Tooltip title={g.notes} arrow><Typography variant="body2" noWrap sx={{ fontSize: '0.72rem', fontFamily: '"Share Tech Mono", monospace', cursor: 'default' }}>{g.notes}</Typography></Tooltip>
                    : <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.72rem' }}>—</Typography>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default GameHistory;
