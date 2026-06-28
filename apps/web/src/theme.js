import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#FAF8F5', // Soft paper white
      paper: '#FFFFFF',   // Pure white for sheets
    },
    primary: {
      main: '#2E2E2E',     // Deep charcoal
      contrastText: '#FAF8F5',
    },
    secondary: {
      main: '#A67C52',     // Earthy warm gold/accent
      contrastText: '#FFFFFF',
    },
    text: {
      primary: '#2E2E2E',
      secondary: '#6E6A64', // Muted brown-gray
    },
    divider: '#EBE6DF',    // Thin elegant separator
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h1: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 500,
    },
    h6: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 500,
    },
    subtitle1: {
      fontFamily: '"Inter", sans-serif',
      letterSpacing: '0.01em',
    },
    body1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 2, // Minimalist corner rounding for gallery aesthetic
  },
  shadows: [
    'none',
    '0px 2px 8px rgba(46, 46, 46, 0.03)',
    '0px 4px 16px rgba(46, 46, 46, 0.05)',
    '0px 8px 24px rgba(46, 46, 46, 0.06)',
    '0px 16px 40px rgba(46, 46, 46, 0.08)',
    ...Array(20).fill('none'), // Rest of shadows fallback
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0, // Sharp square edges for luxury look
          padding: '12px 28px',
          '@media (max-width:600px)': {
            padding: '8px 16px',
            fontSize: '0.75rem',
          },
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: '#2E2E2E',
          color: '#FAF8F5',
          '&:hover': {
            backgroundColor: '#A67C52',
          },
        },
        outlined: {
          borderColor: '#2E2E2E',
          color: '#2E2E2E',
          '&:hover': {
            borderColor: '#A67C52',
            color: '#A67C52',
            backgroundColor: 'transparent',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '1px solid #EBE6DF',
          boxShadow: '0px 4px 20px rgba(46, 46, 46, 0.04)',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            boxShadow: '0px 8px 30px rgba(46, 46, 46, 0.06)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            '& fieldset': {
              borderColor: '#EBE6DF',
            },
            '&:hover fieldset': {
              borderColor: '#A67C52',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2E2E2E',
              borderWidth: '1px',
            },
          },
        },
      },
    },
  },
});

export default theme;
