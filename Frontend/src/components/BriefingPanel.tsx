import { useState } from 'react';
import {
  Box, Typography, Chip, Skeleton, Alert, Collapse,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';
import LightbulbIcon    from '@mui/icons-material/Lightbulb';
import ExpandMoreIcon   from '@mui/icons-material/ExpandMore';
import { useBriefing } from '../hooks/useBriefing';
import type { BriefingItem } from '../services/briefingService';

type Sev = 'error' | 'success' | 'info';

const SEV_CONFIG = {
  error:   { bg: 'rgba(244,67,54,0.08)',   border: 'rgba(244,67,54,0.22)',   text: '#ef9a9a',  label: 'ALERTAS',      Icon: WarningAmberIcon },
  success: { bg: 'rgba(76,175,80,0.08)',   border: 'rgba(76,175,80,0.22)',   text: '#a5d6a7',  label: 'FORTALEZAS',   Icon: CheckCircleIcon  },
  info:    { bg: 'rgba(186,104,200,0.08)', border: 'rgba(186,104,200,0.22)', text: '#ce93d8',  label: 'CONOCIMIENTO', Icon: LightbulbIcon    },
} as const;

function ItemCard({ item, color }: { item: BriefingItem; color: Sev }) {
  const [open, setOpen] = useState(false);
  const c = SEV_CONFIG[color];
  return (
    <Box
      onClick={() => setOpen((v) => !v)}
      sx={{
        cursor: 'pointer', px: 1.5, py: 1.25, borderRadius: 1.5,
        bgcolor: open ? c.bg.replace('0.08', '0.14') : c.bg,
        border: `1px solid ${c.border}`,
        transition: 'background 0.15s',
        '&:hover': { bgcolor: c.bg.replace('0.08', '0.12') },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ color: c.text, fontWeight: 600, fontSize: 12.5, lineHeight: 1.3 }}>
          {item.title}
        </Typography>
        <ExpandMoreIcon sx={{
          fontSize: 15, color: c.text, opacity: 0.65, flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s',
        }} />
      </Box>
      <Collapse in={open} timeout={180}>
        <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, mt: 0.75, lineHeight: 1.55 }}>
          {item.message}
        </Typography>
        {item.detail && (
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, mt: 0.5, lineHeight: 1.4 }}>
            {item.detail}
          </Typography>
        )}
      </Collapse>
    </Box>
  );
}

function Section({ items, color }: { items: BriefingItem[]; color: Sev }) {
  if (items.length === 0) return null;
  const { label, text, Icon } = SEV_CONFIG[color];
  return (
    <Box sx={{ flex: '1 1 200px', minWidth: 180 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
        <Icon sx={{ fontSize: 13, color: text }} />
        <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: text }}>
          {label}
        </Typography>
        <Chip
          label={items.length}
          size="small"
          sx={{ height: 16, fontSize: 10, bgcolor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', ml: 'auto', px: 0.5 }}
        />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {items.map((item, i) => <ItemCard key={i} item={item} color={color} />)}
      </Box>
    </Box>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const BriefingPanel = () => {
  const { data, isLoading, isError } = useBriefing();

  if (isLoading) {
    return (
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="rectangular" height={72} sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error" sx={{ mb: 3 }}>No se pudo cargar el briefing.</Alert>;
  }

  if (!data) return null;

  return (
    <Box
      sx={{
        mb: 3, p: 2, borderRadius: 2,
        background: 'linear-gradient(135deg, rgba(20,8,40,0.95) 0%, rgba(8,4,20,0.98) 100%)',
        border: '1px solid rgba(186,104,200,0.2)',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: data.games_analyzed === 0 ? 0 : 2 }}>
        <Typography
          sx={{ fontFamily: '"Cinzel", serif', color: '#ce93d8', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.06em' }}
        >
          ▸ BRIEFING PRE-PARTIDA
        </Typography>
        {data.games_analyzed > 0 && (
          <Chip
            label={`${data.games_analyzed} partidas`}
            size="small"
            sx={{ bgcolor: 'rgba(186,104,200,0.12)', color: '#ba68c8', fontSize: 10, height: 18 }}
          />
        )}
      </Box>

      {data.games_analyzed === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 1 }}>
          Registrá tu primera partida para obtener análisis personalizados.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Section items={data.warnings}   color="error"   />
          <Section items={data.strengths}  color="success" />
          <Section items={data.base_tips}  color="info"    />
        </Box>
      )}
    </Box>
  );
};

export default BriefingPanel;
