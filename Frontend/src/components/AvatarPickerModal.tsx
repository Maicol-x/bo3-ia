import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, CircularProgress,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { updateUserAvatar } from '../store/authSlice';
import { updateAvatar } from '../services/authService';
import { AVATARS, getAvatar } from '../constants/avatars';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AvatarPickerModal({ open, onClose }: Props) {
  const dispatch = useAppDispatch();
  const user  = useAppSelector((s) => s.auth.user);
  const token = useAppSelector((s) => s.auth.token);

  const [selected, setSelected] = useState<string>(user?.avatar ?? 'ghost');

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (key: string) => updateAvatar(key, token ?? ''),
    onSuccess: (data) => {
      dispatch(updateUserAvatar(data.avatar));
      onClose();
    },
  });

  function handleSave() {
    mutate(selected);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: '#1a0e2a',
          border: '1px solid rgba(186,104,200,0.35)',
          borderRadius: 2,
          minWidth: 340,
        },
      }}
    >
      <DialogTitle sx={{ color: '#e1bee7', pb: 0, fontFamily: '"Share Tech Mono", monospace', letterSpacing: 1 }}>
        ELEGIR AVATAR
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Avatar actual */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: '50%',
            bgcolor: 'rgba(123,31,162,0.3)',
            border: '2px solid #7b1fa2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>
            {getAvatar(selected)}
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: '#e1bee7', fontWeight: 700 }}>
              {user?.username}
            </Typography>
            <Typography variant="caption" sx={{ color: '#78909c' }}>
              {selected}
            </Typography>
          </Box>
        </Box>

        {/* Grid de opciones */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
        }}>
          {Object.entries(AVATARS).map(([key, emoji]) => (
            <Box
              key={key}
              onClick={() => setSelected(key)}
              sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 0.5, p: 1, borderRadius: 1.5, cursor: 'pointer',
                border: selected === key
                  ? '2px solid #aa3bff'
                  : '2px solid rgba(255,255,255,0.06)',
                bgcolor: selected === key
                  ? 'rgba(170,59,255,0.15)'
                  : 'rgba(255,255,255,0.03)',
                transition: 'all 0.15s',
                '&:hover': {
                  bgcolor: 'rgba(170,59,255,0.1)',
                  border: '2px solid rgba(170,59,255,0.5)',
                },
              }}
            >
              <Typography sx={{ fontSize: 26, lineHeight: 1 }}>{emoji}</Typography>
              <Typography variant="caption" sx={{ color: '#78909c', fontSize: 9, letterSpacing: 0.5 }}>
                {key}
              </Typography>
            </Box>
          ))}
        </Box>

        {isError && (
          <Typography variant="caption" sx={{ color: '#ef9a9a', display: 'block', mt: 1.5 }}>
            No se pudo guardar el avatar. Intentá de nuevo.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} size="small" sx={{ color: '#78909c' }}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={isPending || selected === user?.avatar}
          variant="contained"
          size="small"
          sx={{ bgcolor: '#7b1fa2', '&:hover': { bgcolor: '#8e24aa' }, minWidth: 80 }}
        >
          {isPending ? <CircularProgress size={16} color="inherit" /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
