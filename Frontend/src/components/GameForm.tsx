import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  FormControlLabel, Checkbox, Button, Divider, IconButton, Chip, Alert,
  FormGroup, CircularProgress,
} from '@mui/material';
import { AddCircleOutlined as AddCircleOutlineIcon, DeleteOutlined as DeleteOutlineIcon, Games as GamesIcon } from '@mui/icons-material';
import { useSaveGame } from '../hooks/useGames';
import { ZONES, CAUSES_OF_DEATH, PERKS, CHARACTERS, GAME_MODES, PLATFORMS, GOBBLEGUMS, AATS, SOE_WEAPONS } from '../types';
import type { Game, Perk, Gobblegum, AAT } from '../types';

const ZONE_LABELS: Record<string, string> = {
  junction: 'Junction (Spawn)',
  canal_district: 'Canal District (Ruby Rabbit)',
  footlight_district: 'Footlight District (Teatro)',
  waterfront_district: 'Waterfront District (Gym)',
  the_rift: 'The Rift',
};
const CAUSE_LABELS: Record<string, string> = {
  zombie: 'Zombie', margwa: 'Margwa', parasite: 'Parasite', meatball: 'Meatball', keeper: 'Keeper', unknown: 'Desconocida',
};
const PERK_LABELS: Record<string, string> = {
  quick_revive: 'Quick Revive', juggernog: 'Juggernog', speed_cola: 'Speed Cola',
  double_tap: 'Double Tap II', widows_wine: "Widow's Wine", mule_kick: 'Mule Kick', stamin_up: 'Stamin-Up',
};
const GOBBLEGUM_LABELS: Record<string, string> = {
  in_plain_sight: 'In Plain Sight', anywhere_but_here: 'Anywhere But Here!',
  stock_option: 'Stock Option', alchemical_antithesis: 'Alchemical Antithesis',
  sword_flay: 'Sword Flay', armental_accomplice: 'Armental Accomplice',
};
const PLATFORM_LABELS: Record<string, string> = {
  pc: 'PC (Mouse + Teclado)',
  ps4: 'PS4 (Mando)',
  ps3: 'PS3 (Mando)',
};
const AAT_LABELS: Record<string, string> = {
  dead_wire: 'Dead Wire', blast_furnace: 'Blast Furnace',
  turned: 'Turned', thunder_wall: 'Thunder Wall', fireworks: 'Fireworks',
};

const toggleItem = <T extends string>(arr: T[], item: T): T[] =>
  arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

const availableAats = (usedAat: AAT | undefined): AAT[] =>
  usedAat ? AATS.filter((a) => a !== usedAat) : [...AATS];

type GameFormData = Omit<Game, 'id' | 'created_at'>;

const defaultForm: GameFormData = {
  map: 'shadows_of_evil', game_mode: 'solo', platform: 'pc', character: undefined,
  round: 1, zone: 'junction', cause_of_death: 'zombie',
  perks: [], weapons: [], weapons_pap: [], gobblegums: [],
  pack_a_punch: false, rituals_completed: 0,
  has_apothicon_servant: false, has_apothicon_sword: false,
  has_rocket_shield: false, civil_protector_active: false,
  points_at_death: undefined,
  notes: undefined,
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="overline" color="primary" sx={{ letterSpacing: '0.2em', display: 'block', mb: 1 }}>
    {children}
  </Typography>
);

const GameForm: React.FC<{ sessionId?: number; onSuccess?: () => void }> = ({ sessionId, onSuccess }) => {
  const [form, setForm] = useState<GameFormData>(defaultForm);
  const [weaponInput, setWeaponInput] = useState('');
  const { mutate, isPending, isSuccess, data, reset } = useSaveGame();

  // Cuando termina con éxito y hay callback externo, delegamos al padre
  useEffect(() => {
    if (isSuccess && onSuccess) onSuccess();
  }, [isSuccess, onSuccess]);

  const addWeapon = () => {
    if (!weaponInput || form.weapons_pap.some((w) => w.weapon === weaponInput)) return;
    setForm({ ...form, weapons_pap: [...form.weapons_pap, { weapon: weaponInput, pap_count: 0 }] });
    setWeaponInput('');
  };

  const removeWeapon = (weapon: string) =>
    setForm({ ...form, weapons_pap: form.weapons_pap.filter((w) => w.weapon !== weapon) });

  const updateWeaponPap = (weapon: string, pap_count: 0 | 1 | 2) =>
    setForm({
      ...form,
      weapons_pap: form.weapons_pap.map((w) =>
        w.weapon === weapon ? { ...w, pap_count, aat: pap_count === 0 ? undefined : w.aat } : w,
      ),
    });

  const updateWeaponAat = (weapon: string, aat: AAT | '') =>
    setForm({
      ...form,
      weapons_pap: form.weapons_pap.map((w) =>
        w.weapon === weapon ? { ...w, aat: aat === '' ? undefined : aat } : w,
      ),
    });

  if (isSuccess && data) {
    // En modo sesión: no mostrar pantalla individual, el padre maneja la transición
    if (sessionId) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="success.main" gutterBottom>✅ Partida registrada</Typography>
          <Typography variant="body2" color="text.secondary">
            Esperando a que todos los jugadores completen el formulario…
          </Typography>
          <CircularProgress size={20} sx={{ mt: 2, color: '#ce93d8' }} />
        </Paper>
      );
    }

    // Modo individual (fuera de sesión): mostrar análisis completo
    const riskPct = (data.risk.risk * 100).toFixed(0);
    const riskColor = data.risk.risk >= 0.7 ? 'error' : data.risk.risk >= 0.4 ? 'warning' : 'success';
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" color="primary" gutterBottom>// PARTIDA REGISTRADA</Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Ronda alcanzada: <Chip label={data.game.round} size="small" color="primary" />
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Riesgo calculado: <Chip label={`${riskPct}%`} size="small" color={riskColor} />
        </Typography>
        {data.risk.recommendations.length > 0 && (
          <>
            <Typography variant="overline" color="primary" sx={{ display: 'block', mb: 1 }}>
              RECOMENDACIONES IA
            </Typography>
            {data.risk.recommendations.map((r, i) => (
              <Alert key={i} severity="info" sx={{ mb: 1, fontFamily: '"Share Tech Mono", monospace', fontSize: '0.8rem' }}>
                {'> '}{r}
              </Alert>
            ))}
          </>
        )}
        <Button variant="outlined" color="primary" onClick={() => { reset(); setForm(defaultForm); }} sx={{ mt: 2 }}>
          REGISTRAR OTRA PARTIDA
        </Button>
      </Paper>
    );
  }

  return (
    <Paper component="form" onSubmit={(e) => { e.preventDefault(); mutate({ ...form, ...(sessionId ? { session_id: sessionId } : {}) }); }} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <GamesIcon color="primary" />
        <Typography variant="h5" color="primary" sx={{ letterSpacing: '0.1em' }}>REGISTRAR PARTIDA</Typography>
      </Box>
      <Divider sx={{ mb: 3 }} />

      {/* Modo, plataforma y personaje */}
      <SectionTitle>CONFIGURACIÓN</SectionTitle>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Modo</InputLabel>
          <Select value={form.game_mode} label="Modo" onChange={(e) => setForm({ ...form, game_mode: e.target.value as GameFormData['game_mode'] })}>
            {GAME_MODES.map((m) => <MenuItem key={m} value={m}>{m === 'solo' ? 'Solo' : 'Pantalla dividida'}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>Plataforma</InputLabel>
          <Select value={form.platform} label="Plataforma" onChange={(e) => setForm({ ...form, platform: e.target.value as GameFormData['platform'] })}>
            {PLATFORMS.map((p) => <MenuItem key={p} value={p}>{PLATFORM_LABELS[p]}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>Personaje</InputLabel>
          <Select value={form.character ?? ''} label="Personaje" onChange={(e) => setForm({ ...form, character: (e.target.value as GameFormData['character']) || undefined })}>
            <MenuItem value="">— Sin seleccionar —</MenuItem>
            {CHARACTERS.map((c) => <MenuItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Ronda, zona, causa */}
      <SectionTitle>SITUACIÓN AL MORIR</SectionTitle>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
        <TextField size="small" type="number" label="Ronda" slotProps={{ htmlInput: { min: 1, max: 255 } }}
          value={form.round || ''} placeholder="1"
          onChange={(e) => setForm({ ...form, round: e.target.value === '' ? 0 : Number(e.target.value) })} />
        <FormControl size="small" fullWidth>
          <InputLabel>Zona</InputLabel>
          <Select value={form.zone} label="Zona" onChange={(e) => setForm({ ...form, zone: e.target.value as GameFormData['zone'] })}>
            {ZONES.map((z) => <MenuItem key={z} value={z}>{ZONE_LABELS[z]}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>Causa de muerte</InputLabel>
          <Select value={form.cause_of_death} label="Causa de muerte" onChange={(e) => setForm({ ...form, cause_of_death: e.target.value as GameFormData['cause_of_death'] })}>
            {CAUSES_OF_DEATH.map((c) => <MenuItem key={c} value={c}>{CAUSE_LABELS[c]}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Perks */}
      <SectionTitle>PERKS AL MORIR</SectionTitle>
      <FormGroup row sx={{ mb: 3, gap: 0.5 }}>
        {PERKS.map((p) => (
          <FormControlLabel key={p} control={
            <Checkbox size="small" checked={form.perks.includes(p as Perk)}
              onChange={() => setForm({ ...form, perks: toggleItem(form.perks, p as Perk) })} />
          } label={<Typography variant="body2">{PERK_LABELS[p]}</Typography>} />
        ))}
      </FormGroup>

      {/* Armas + PaP */}
      <SectionTitle>ARMAS Y PACK-A-PUNCH</SectionTitle>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        PaP x1 = 5000 pts (20% AAT) · PaP x2 = 2500 pts (25% AAT restante)
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <FormControl size="small" sx={{ flex: 1 }}>
          <InputLabel>Seleccionar arma</InputLabel>
          <Select value={weaponInput} label="Seleccionar arma" onChange={(e) => setWeaponInput(e.target.value)}>
            <MenuItem value="">— Seleccionar —</MenuItem>
            {SOE_WEAPONS.filter((w) => !form.weapons_pap.some((wp) => wp.weapon === w)).map((w) => (
              <MenuItem key={w} value={w}>{w}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={addWeapon} disabled={!weaponInput} startIcon={<AddCircleOutlineIcon />}>
          Agregar
        </Button>
      </Box>
      {form.weapons_pap.length === 0 && (
        <Typography variant="caption" color="text.secondary">No se han agregado armas aún.</Typography>
      )}
      {form.weapons_pap.map((wp) => {
        const prevAat = wp.pap_count === 2 ? wp.aat : undefined;
        const atsDisponibles = wp.pap_count === 2 && prevAat ? availableAats(prevAat) : [...AATS];
        return (
          <Box key={wp.weapon} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Chip label={wp.weapon} color="secondary" variant="outlined" size="small" sx={{ minWidth: 110 }} />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select value={wp.pap_count} onChange={(e) => updateWeaponPap(wp.weapon, Number(e.target.value) as 0 | 1 | 2)}>
                <MenuItem value={0}>Sin PaP</MenuItem>
                <MenuItem value={1}>PaP x1</MenuItem>
                <MenuItem value={2}>PaP x2</MenuItem>
              </Select>
            </FormControl>
            {wp.pap_count > 0 && (
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select value={wp.aat ?? ''} onChange={(e) => updateWeaponAat(wp.weapon, e.target.value as AAT | '')}>
                  <MenuItem value="">— Sin AAT —</MenuItem>
                  {atsDisponibles.map((a) => <MenuItem key={a} value={a}>{AAT_LABELS[a]}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <IconButton size="small" color="error" onClick={() => removeWeapon(wp.weapon)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      })}

      {/* Progresión */}
      <Divider sx={{ my: 2 }} />
      <SectionTitle>PROGRESIÓN</SectionTitle>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField size="small" type="number" label="Rituales (0–4)" slotProps={{ htmlInput: { min: 0, max: 4 } }}
          value={form.rituals_completed || ''} placeholder="0"
          onChange={(e) => setForm({ ...form, rituals_completed: e.target.value === '' ? 0 : Number(e.target.value) })}
          sx={{ width: 160 }} />
        {([
          ['pack_a_punch', 'PaP'],
          ['has_apothicon_servant', 'A. Servant'],
          ['has_apothicon_sword', 'A. Sword'],
          ['has_rocket_shield', 'R. Shield'],
          ['civil_protector_active', 'Civil Prot.'],
        ] as const).map(([key, label]) => (
          <FormControlLabel key={key} control={
            <Checkbox size="small" checked={!!form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
          } label={<Typography variant="body2">{label}</Typography>} />
        ))}
      </Box>

      {/* Gobblegums */}
      <SectionTitle>GOBBLEGUMS</SectionTitle>
      <FormGroup row sx={{ mb: 2, gap: 0.5 }}>
        {GOBBLEGUMS.map((g) => (
          <FormControlLabel key={g} control={
            <Checkbox size="small" checked={form.gobblegums.includes(g as Gobblegum)}
              onChange={() => setForm({ ...form, gobblegums: toggleItem(form.gobblegums, g as Gobblegum) })} />
          } label={<Typography variant="body2">{GOBBLEGUM_LABELS[g]}</Typography>} />
        ))}
      </FormGroup>

      {/* Puntos */}
      <TextField size="small" type="number" label="Puntos al morir (opcional)" fullWidth
        value={form.points_at_death ?? ''} placeholder="ej: 12000" slotProps={{ htmlInput: { min: 0 } }}
        onChange={(e) => setForm({ ...form, points_at_death: e.target.value ? Number(e.target.value) : undefined })}
        sx={{ mb: 2 }} />

      {/* Notas */}
      <TextField size="small" label="Notas (opcional)" fullWidth multiline rows={2}
        value={form.notes ?? ''} placeholder="ej: fallé el ritual 3, me quedé sin puntos en ronda 20..."
        slotProps={{ htmlInput: { maxLength: 500 } }}
        onChange={(e) => setForm({ ...form, notes: e.target.value || undefined })}
        sx={{ mb: 3 }} />

      <Button type="submit" variant="contained" color="primary" fullWidth size="large" disabled={isPending}
        startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : undefined}>
        {isPending ? 'PROCESANDO...' : 'GUARDAR PARTIDA'}
      </Button>
    </Paper>
  );
};

export default GameForm;
