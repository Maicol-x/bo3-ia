import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch } from '../hooks/useAppStore';
import { setAuth } from '../store/authSlice';
import { register } from '../services/authService';

const schema = yup.object({
  username: yup
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos')
    .required('El nombre de usuario es obligatorio'),
  email: yup.string().email('Email inválido').required('El email es obligatorio'),
  password: yup.string().min(8, 'Mínimo 8 caracteres').required('La contraseña es obligatoria'),
  confirm: yup
    .string()
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden')
    .required('Confirmá la contraseña'),
});

type RegisterForm = yup.InferType<typeof schema>;

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: yupResolver(schema),
    defaultValues: { username: '', email: '', password: '', confirm: '' },
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: RegisterForm) => register(data.username, data.email, data.password),
    onSuccess: ({ user, token }) => {
      dispatch(setAuth({ user, token }));
      navigate('/', { replace: true });
    },
  });

  const serverError = error instanceof Error ? error.message : null;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #1a0035 0%, #0a0010 70%)',
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit((data) => mutate(data))}
        sx={{ width: '100%', maxWidth: 420, p: 4, display: 'flex', flexDirection: 'column', gap: 2.5 }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <Typography variant="h5" sx={{ color: '#aa3bff', letterSpacing: '0.15em', mb: 0.5 }}>
            BO3-IA
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: '"Share Tech Mono", monospace' }}>
            SHADOWS OF EVIL // CREAR CUENTA
          </Typography>
        </Box>

        {serverError && <Alert severity="error" sx={{ fontFamily: '"Share Tech Mono", monospace' }}>{serverError}</Alert>}

        <Controller
          name="username"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Nombre de usuario"
              autoComplete="username"
              fullWidth
              error={!!errors.username}
              helperText={errors.username?.message ?? '3–20 caracteres. Solo letras, números y guiones bajos.'}
            />
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Email"
              type="email"
              autoComplete="email"
              fullWidth
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Contraseña"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              fullWidth
              error={!!errors.password}
              helperText={errors.password?.message ?? 'Mínimo 8 caracteres.'}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPass((v) => !v)} edge="end" size="small">
                        {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />

        <Controller
          name="confirm"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Confirmar contraseña"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              fullWidth
              error={!!errors.confirm}
              helperText={errors.confirm?.message}
            />
          )}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isPending}
          sx={{ mt: 1, py: 1.2 }}
        >
          {isPending ? <CircularProgress size={20} color="inherit" /> : 'Crear cuenta'}
        </Button>

        <Typography variant="body2" align="center" sx={{ color: 'text.secondary' }}>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" style={{ color: '#aa3bff', textDecoration: 'none' }}>
            Iniciar sesión
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
