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
import { login } from '../services/authService';

const schema = yup.object({
  email: yup.string().email('Email inválido').required('El email es obligatorio'),
  password: yup.string().min(8, 'Mínimo 8 caracteres').required('La contraseña es obligatoria'),
});

type LoginForm = yup.InferType<typeof schema>;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: yupResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: LoginForm) => login(data.email, data.password),
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
            SHADOWS OF EVIL // INICIAR SESIÓN
          </Typography>
        </Box>

        {serverError && <Alert severity="error" sx={{ fontFamily: '"Share Tech Mono", monospace' }}>{serverError}</Alert>}

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
              autoComplete="current-password"
              fullWidth
              error={!!errors.password}
              helperText={errors.password?.message}
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

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isPending}
          sx={{ mt: 1, py: 1.2 }}
        >
          {isPending ? <CircularProgress size={20} color="inherit" /> : 'Entrar'}
        </Button>

        <Typography variant="body2" align="center" sx={{ color: 'text.secondary' }}>
          ¿No tenés cuenta?{' '}
          <Link to="/register" style={{ color: '#aa3bff', textDecoration: 'none' }}>
            Registrarse
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
