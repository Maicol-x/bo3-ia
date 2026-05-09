import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary:   { main: '#aa3bff' },
    secondary: { main: '#7b1fa2' },
    background: { default: '#0a0010', paper: '#110020' },
    text: { primary: '#e8d5ff', secondary: '#9e7bbf' },
    error: { main: '#ff3b3b' },
    success: { main: '#39ff14' },
  },
  typography: {
    fontFamily: '"Share Tech Mono", monospace',
    h1: { fontFamily: '"Orbitron", sans-serif', fontWeight: 900 },
    h2: { fontFamily: '"Orbitron", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Orbitron", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Orbitron", sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Orbitron", sans-serif' },
    h6: { fontFamily: '"Orbitron", sans-serif' },
  },
  shape: { borderRadius: 2 },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& input[type=number]': { MozAppearance: 'textfield' },
          '& input[type=number]::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
          '& input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(170, 59, 255, 0.25)',
          boxShadow: '0 0 12px rgba(170, 59, 255, 0.15)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: '"Orbitron", sans-serif',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          boxShadow: '0 0 8px rgba(170, 59, 255, 0.4)',
          '&:hover': { boxShadow: '0 0 16px rgba(170, 59, 255, 0.7)' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& fieldset': { borderColor: 'rgba(170, 59, 255, 0.35)' },
          '&:hover fieldset': { borderColor: 'rgba(170, 59, 255, 0.7) !important' },
          '&.Mui-focused fieldset': { borderColor: '#aa3bff !important', boxShadow: '0 0 8px rgba(170, 59, 255, 0.4)' },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: { root: { color: 'rgba(170, 59, 255, 0.5)' } },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontFamily: '"Share Tech Mono", monospace', borderColor: 'rgba(170, 59, 255, 0.5)' },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: 'rgba(170, 59, 255, 0.2)' } },
    },
  },
});

export default theme;
