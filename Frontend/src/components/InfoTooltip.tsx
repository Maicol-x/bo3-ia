import { Box, Typography, Chip } from '@mui/material';
import { ENEMY_INFO, PERK_INFO } from '../data/gameData';

// Props compartidas para el slotProps del Tooltip de MUI
export const richTooltipSlotProps = {
  tooltip: {
    sx: {
      bgcolor: '#0d001a',
      border: '1px solid rgba(170,59,255,0.35)',
      borderRadius: 2,
      maxWidth: 320,
      p: 1,
      boxShadow: '0 4px 24px rgba(0,0,0,0.7)',
    },
  },
  arrow: {
    sx: { color: 'rgba(170,59,255,0.35)' },
  },
};

// Tarjeta flotante de enemigo
export const EnemyTooltipContent = ({ cause }: { cause: string }) => {
  const info = ENEMY_INFO[cause];
  if (!info) return null;

  return (
    <Box sx={{ p: 0.5 }}>
      {/* Header: emoji + nombre + nivel de peligro */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Typography sx={{ fontSize: '2.2rem', lineHeight: 1 }}>{info.emoji}</Typography>
        <Box>
          <Typography sx={{
            fontFamily: '"Share Tech Mono", monospace',
            color: '#fff', fontWeight: 'bold',
            fontSize: '0.88rem', letterSpacing: '0.12em',
          }}>
            {info.name.toUpperCase()}
          </Typography>
          <Chip
            label={`⚠ PELIGRO: ${info.dangerLabel}`}
            size="small"
            sx={{ bgcolor: info.dangerColor, color: '#fff', fontSize: '0.62rem', height: 18, mt: 0.3 }}
          />
        </Box>
      </Box>

      {/* Descripción */}
      <Typography sx={{ fontSize: '0.75rem', color: '#ccc', mb: 1.5, lineHeight: 1.55 }}>
        {info.description}
      </Typography>

      {/* Tips */}
      <Typography sx={{
        color: info.dangerColor, fontSize: '0.62rem',
        letterSpacing: '0.18em', fontFamily: '"Share Tech Mono", monospace',
        display: 'block', mb: 0.6,
      }}>
        TIPS
      </Typography>
      {info.tips.map((tip, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 0.75, mb: 0.4 }}>
          <Typography sx={{ color: info.dangerColor, fontSize: '0.72rem', lineHeight: 1.4, flexShrink: 0 }}>•</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#bbb', lineHeight: 1.4 }}>{tip}</Typography>
        </Box>
      ))}

      {/* Mejores armas */}
      {info.bestWeapons.length > 0 && (
        <>
          <Typography sx={{
            color: '#aa3bff', fontSize: '0.62rem',
            letterSpacing: '0.18em', fontFamily: '"Share Tech Mono", monospace',
            display: 'block', mt: 1.5, mb: 0.75,
          }}>
            MEJORES ARMAS
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {info.bestWeapons.map((w) => (
              <Chip key={w} label={w} size="small" variant="outlined"
                sx={{ fontSize: '0.62rem', height: 18, borderColor: 'rgba(170,59,255,0.4)', color: '#cc88ff' }} />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

// Tarjeta flotante de perks
export const PerksTooltipContent = ({ perks }: { perks: string[] }) => {
  if (perks.length === 0) {
    return (
      <Typography sx={{ fontSize: '0.75rem', color: '#888', fontFamily: '"Share Tech Mono", monospace', p: 0.5 }}>
        Sin perks al morir
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 0.5, minWidth: 220 }}>
      {perks.map((perk) => {
        const info = PERK_INFO[perk];
        if (!info) return null;
        return (
          <Box key={perk} sx={{
            display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.75,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            '&:last-child': { borderBottom: 'none', pb: 0 },
          }}>
            <Typography sx={{ fontSize: '1.4rem', lineHeight: 1, pt: 0.2, flexShrink: 0 }}>{info.emoji}</Typography>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                <Typography sx={{ color: info.color, fontFamily: '"Share Tech Mono", monospace', fontSize: '0.76rem', fontWeight: 'bold' }}>
                  {info.name}
                </Typography>
                <Chip label={info.priorityLabel} size="small" sx={{
                  bgcolor: info.priorityColor + '22',
                  color: info.priorityColor,
                  fontSize: '0.58rem', height: 16,
                  border: `1px solid ${info.priorityColor}55`,
                }} />
              </Box>
              <Typography sx={{ color: '#999', fontSize: '0.68rem', mt: 0.25 }}>
                {info.effect}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
