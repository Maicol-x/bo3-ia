import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            bgcolor: '#0a0010',
            px: 3,
          }}
        >
          <Typography variant="h5" sx={{ color: '#ff3b3b', fontFamily: '"Orbitron", sans-serif' }}>
            ERROR DE APLICACIÓN
          </Typography>
          <Typography variant="body2" sx={{ color: '#9e7bbf', textAlign: 'center', maxWidth: 480 }}>
            {error.message}
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              this.setState({ error: null });
              window.location.href = '/';
            }}
          >
            Reintentar
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
