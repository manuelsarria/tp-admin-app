'use client'

import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'

/**
 * TP Logistics — Light theme
 * Yellow (#FACC15) primary, ink black (#0A0A0A) text, warm neutral surfaces.
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FACC15',
      light: '#FDE047',
      dark: '#CA8A04',
      contrastText: '#0A0A0A',
    },
    secondary: {
      main: '#0A0A0A',
      light: '#171717',
      dark: '#000000',
      contrastText: '#FACC15',
    },
    error: {
      main: '#DC2626',
      light: '#EF4444',
      dark: '#B91C1C',
    },
    warning: {
      main: '#D97706',
      light: '#F59E0B',
      dark: '#B45309',
    },
    info: {
      main: '#2563EB',
      light: '#3B82F6',
      dark: '#1D4ED8',
    },
    success: {
      main: '#059669',
      light: '#10B981',
      dark: '#047857',
    },
    background: {
      default: '#FAFAF9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0A0A0A',
      secondary: '#78716C',
      disabled: '#A8A29E',
    },
    divider: '#E7E5E4',
    grey: {
      50: '#FAFAF9',
      100: '#F5F5F4',
      200: '#E7E5E4',
      300: '#D6D3D1',
      400: '#A8A29E',
      500: '#78716C',
      600: '#57534E',
      700: '#44403C',
      800: '#292524',
      900: '#1C1917',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      letterSpacing: '-0.03em',
      color: '#0A0A0A',
      fontFamily: '"Space Grotesk", "Inter", sans-serif',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.03em',
      color: '#0A0A0A',
      fontFamily: '"Space Grotesk", "Inter", sans-serif',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '-0.025em',
      color: '#0A0A0A',
      fontFamily: '"Space Grotesk", "Inter", sans-serif',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.025em',
      color: '#0A0A0A',
      fontFamily: '"Space Grotesk", "Inter", sans-serif',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '-0.02em',
      color: '#0A0A0A',
      fontFamily: '"Space Grotesk", "Inter", sans-serif',
    },
    h6: {
      fontSize: '1.05rem',
      fontWeight: 600,
      letterSpacing: '-0.015em',
      color: '#0A0A0A',
      fontFamily: '"Space Grotesk", "Inter", sans-serif',
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.55,
      color: '#292524',
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.85rem',
      lineHeight: 1.5,
      color: '#57534E',
      fontWeight: 400,
    },
    subtitle1: {
      fontSize: '0.95rem',
      fontWeight: 500,
      color: '#292524',
    },
    subtitle2: {
      fontSize: '0.85rem',
      fontWeight: 500,
      color: '#57534E',
    },
    caption: {
      fontSize: '0.72rem',
      fontWeight: 500,
      color: '#78716C',
      letterSpacing: '0.04em',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: 0,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(10, 10, 10, 0.04)',
    '0 2px 6px -1px rgba(10, 10, 10, 0.06), 0 1px 3px -1px rgba(10, 10, 10, 0.04)',
    '0 4px 12px -2px rgba(10, 10, 10, 0.08), 0 2px 6px -2px rgba(10, 10, 10, 0.04)',
    '0 8px 20px -4px rgba(10, 10, 10, 0.08), 0 4px 10px -2px rgba(10, 10, 10, 0.04)',
    '0 14px 30px -8px rgba(10, 10, 10, 0.10), 0 6px 14px -4px rgba(10, 10, 10, 0.06)',
    '0 20px 40px -10px rgba(10, 10, 10, 0.12)',
    '0 20px 40px -10px rgba(10, 10, 10, 0.12)',
    '0 20px 40px -10px rgba(10, 10, 10, 0.12)',
    '0 24px 50px -12px rgba(10, 10, 10, 0.14)',
    '0 24px 50px -12px rgba(10, 10, 10, 0.14)',
    '0 24px 50px -12px rgba(10, 10, 10, 0.14)',
    '0 24px 50px -12px rgba(10, 10, 10, 0.14)',
    '0 24px 50px -12px rgba(10, 10, 10, 0.14)',
    '0 28px 60px -14px rgba(10, 10, 10, 0.16)',
    '0 28px 60px -14px rgba(10, 10, 10, 0.16)',
    '0 28px 60px -14px rgba(10, 10, 10, 0.16)',
    '0 28px 60px -14px rgba(10, 10, 10, 0.16)',
    '0 28px 60px -14px rgba(10, 10, 10, 0.16)',
    '0 28px 60px -14px rgba(10, 10, 10, 0.16)',
    '0 28px 60px -14px rgba(10, 10, 10, 0.16)',
    '0 32px 72px -16px rgba(10, 10, 10, 0.18)',
    '0 32px 72px -16px rgba(10, 10, 10, 0.18)',
    '0 32px 72px -16px rgba(10, 10, 10, 0.18)',
    '0 32px 72px -16px rgba(10, 10, 10, 0.18)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '999px',
          fontWeight: 600,
          fontSize: '0.875rem',
          padding: '10px 22px',
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
          '&:hover': {
            boxShadow: '0 6px 18px -6px rgba(10,10,10,0.18)',
            transform: 'translateY(-1px)',
          },
        },
        containedPrimary: {
          background: '#FACC15',
          color: '#0A0A0A',
          '&:hover': {
            background: '#EAB308',
            boxShadow: '0 8px 22px -6px rgba(250, 204, 21, 0.55)',
          },
        },
        containedSecondary: {
          background: '#0A0A0A',
          color: '#FFFFFF',
          '&:hover': {
            background: '#171717',
          },
        },
        outlined: {
          borderColor: '#D6D3D1',
          color: '#0A0A0A',
          '&:hover': {
            borderColor: '#0A0A0A',
            backgroundColor: '#FAFAF9',
          },
        },
        text: {
          color: '#0A0A0A',
          '&:hover': {
            backgroundColor: '#F5F5F4',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          border: '1px solid #E7E5E4',
          boxShadow: '0 1px 2px 0 rgba(10, 10, 10, 0.03)',
          background: '#FFFFFF',
          transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
          '&:hover': {
            boxShadow: '0 10px 28px -8px rgba(10, 10, 10, 0.10)',
            borderColor: '#D6D3D1',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: '#D6D3D1',
            },
            '&:hover fieldset': {
              borderColor: '#A8A29E',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0A0A0A',
              borderWidth: '1.5px',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#78716C',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#0A0A0A',
          },
          '& .MuiOutlinedInput-input': {
            color: '#0A0A0A',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '999px',
          fontWeight: 600,
          fontSize: '0.72rem',
          letterSpacing: '0.02em',
        },
        filled: {
          background: '#F5F5F4',
          color: '#292524',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E7E5E4',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backgroundImage: 'none',
          backdropFilter: 'saturate(180%) blur(14px)',
          WebkitBackdropFilter: 'saturate(180%) blur(14px)',
          boxShadow: 'none',
          color: '#0A0A0A',
          borderBottom: '1px solid #E7E5E4',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          border: '1px solid #E7E5E4',
          boxShadow: '0 18px 40px -12px rgba(10, 10, 10, 0.18)',
          borderRadius: '14px',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: '#292524',
          '&:hover': {
            backgroundColor: '#FAFAF9',
          },
          '&.Mui-selected': {
            backgroundColor: '#FEF3C7',
            '&:hover': {
              backgroundColor: '#FDE68A',
            },
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#E7E5E4',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          border: '1px solid #E7E5E4',
          borderRadius: '18px',
          boxShadow: '0 30px 70px -20px rgba(10, 10, 10, 0.25)',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#D6D3D1',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
        standardSuccess: {
          backgroundColor: '#ECFDF5',
          color: '#047857',
          border: '1px solid #A7F3D0',
        },
        standardError: {
          backgroundColor: '#FEF2F2',
          color: '#B91C1C',
          border: '1px solid #FECACA',
        },
        standardWarning: {
          backgroundColor: '#FFFBEB',
          color: '#B45309',
          border: '1px solid #FDE68A',
        },
        standardInfo: {
          backgroundColor: '#EFF6FF',
          color: '#1D4ED8',
          border: '1px solid #BFDBFE',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0A0A0A',
          color: '#FFFFFF',
          fontSize: '0.72rem',
          fontWeight: 500,
          borderRadius: '8px',
          padding: '8px 12px',
        },
        arrow: {
          color: '#0A0A0A',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#FAFAF9',
          color: '#78716C',
          fontWeight: 600,
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          borderBottom: '1px solid #E7E5E4',
        },
        body: {
          color: '#292524',
          borderBottom: '1px solid #F5F5F4',
        },
      },
    },
  },
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  )
}
