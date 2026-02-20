import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import '@mui/x-data-grid/themeAugmentation';

export type Mode = 'light' | 'dark';

interface ColorModeContextValue {
  mode: Mode;
  toggleMode: () => void;
}

export const ColorModeContext = React.createContext<ColorModeContextValue>({ mode: 'light', toggleMode: () => {} });

function getInitialMode(): Mode {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('themeMode') as Mode | null;
  if (saved === 'light' || saved === 'dark') return saved;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export const ColorModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = React.useState<Mode>(getInitialMode);

  const toggleMode = React.useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', next);
      return next;
    });
  }, []);

  const theme = React.useMemo(() => createTheme({
    palette: {
      mode,
      // Brand palette tuned for better contrast in both modes
      primary: { main: '#6366f1', light: '#a5b4fc', dark: '#4f46e5', contrastText: '#ffffff' },
      secondary: { main: '#06b6d4', light: '#67e8f9', dark: '#0891b2', contrastText: '#001018' },
      success: { main: '#16a34a', light: '#22c55e', dark: '#15803d', contrastText: '#ffffff' },
      warning: { main: '#f59e0b', light: '#fbbf24', dark: '#b45309', contrastText: mode === 'light' ? '#111827' : '#0b1020' },
      error: { main: '#dc2626', light: '#ef4444', dark: '#b91c1c', contrastText: '#ffffff' },
      info: { main: '#64748b', light: '#94a3b8', dark: '#475569', contrastText: '#ffffff' },
      background: mode === 'light'
        ? { default: '#f7f7fb', paper: '#ffffff' }
        : { default: '#0b1020', paper: '#0f172a' },
      text: mode === 'light'
        ? { primary: '#0b1020', secondary: '#6b7280' }
        : { primary: '#e5e7eb', secondary: '#cbd5e1' },
      divider: mode === 'light' ? 'rgba(2,6,23,0.08)' : 'rgba(148,163,184,0.24)',
      grey: mode === 'light' ? {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      } : {
        50: '#0f172a',
        100: '#111827',
        200: '#131c2f',
        300: '#1e293b',
        400: '#334155',
        500: '#475569',
        600: '#64748b',
        700: '#94a3b8',
        800: '#cbd5e1',
        900: '#e2e8f0',
      },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
      h1: { fontWeight: 800 },
      h2: { fontWeight: 800 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      body1: { fontWeight: 400 },
      body2: { fontWeight: 400 },
      button: { fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: (theme) => ({
          ':root': {
            colorScheme: theme.palette.mode,
          },
          body: {
            backgroundImage: theme.palette.mode === 'light'
              ? 'radial-gradient(60rem 60rem at -10% -10%, rgba(99,102,241,0.06), transparent 50%), radial-gradient(60rem 60rem at 120% -10%, rgba(6,182,212,0.06), transparent 50%)'
              : 'radial-gradient(80rem 60rem at -20% -20%, rgba(99,102,241,0.12), transparent 55%), radial-gradient(80rem 60rem at 120% -10%, rgba(6,182,212,0.10), transparent 55%)',
            backgroundAttachment: 'fixed',
            transition: 'background-color 200ms ease, color 200ms ease',
          },
          '*:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
          '::-webkit-scrollbar': { width: 10, height: 10 },
          '::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'light' ? '#c5c9d2' : '#3b4457',
            borderRadius: 8,
            border: `2px solid ${theme.palette.background.default}`,
          },
          '::-webkit-scrollbar-track': {
            background: theme.palette.mode === 'light' ? '#eef0f4' : '#0b1020',
            borderRadius: 8,
          },
        }),
      },
      MuiToolbar: {
        styleOverrides: {
          root: ({ theme }) => ({
            minHeight: 56,
            [theme.breakpoints.up('sm')]: { minHeight: 64 },
          }),
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: ({ theme }) => ({
            padding: theme.spacing(2.5),
            '&:last-child': { paddingBottom: theme.spacing(2.5) },
            [theme.breakpoints.up('sm')]: {
              padding: theme.spacing(3),
              '&:last-child': { paddingBottom: theme.spacing(3) },
            },
          }),
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 10,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            transition: 'transform 140ms ease, background-color 140ms ease, color 140ms ease, border-color 140ms ease',
          }),
          contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'translateY(-1px)' }, '&:active': { transform: 'translateY(0)' } },
          outlined: { borderWidth: 2, '&:hover': { borderWidth: 2, transform: 'translateY(-1px)' }, '&:active': { transform: 'translateY(0)' } },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 16,
            boxShadow: theme.palette.mode === 'light'
              ? '0 6px 18px rgba(2,6,23,0.06)'
              : '0 8px 24px rgba(0,0,0,0.5)',
            transition: 'transform 160ms ease, box-shadow 160ms ease',
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.grey[200]}` : 'none',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'light'
                ? '0 12px 28px rgba(2,6,23,0.10)'
                : '0 12px 28px rgba(0,0,0,0.65)',
            },
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 12,
            boxShadow: theme.palette.mode === 'light'
              ? '0 4px 12px rgba(0,0,0,0.06)'
              : '0 4px 12px rgba(0,0,0,0.3)',
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.grey[200]}` : 'none',
          }),
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.mode === 'light' ? '#ffffffcc' : '#0f172acc',
            color: theme.palette.text.primary,
            backdropFilter: 'saturate(180%) blur(8px)',
            boxShadow: theme.palette.mode === 'light'
              ? '0 2px 10px rgba(2,6,23,0.06)'
              : '0 2px 10px rgba(0,0,0,0.5)',
            borderBottom: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.grey[200]}` : 'none',
          }),
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            borderRight: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.grey[200]}` : undefined,
          }),
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 8,
            '&.Mui-selected': { backgroundColor: theme.palette.action.selected, color: theme.palette.primary.main },
            '&:hover': { backgroundColor: theme.palette.action.hover },
          }),
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 10,
            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[100] : 'transparent',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.mode === 'light' ? '#e5e7eb' : theme.palette.grey[300],
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.mode === 'light' ? '#9ca3af' : theme.palette.grey[400],
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
              borderWidth: 2,
            },
            '& .MuiInputBase-input': {
              color: theme.palette.text.primary,
            },
          }),
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.secondary,
            '&.Mui-focused': { color: theme.palette.primary.main },
            '&.MuiFormLabel-filled': { color: theme.palette.text.primary },
          }),
        },
      },
      MuiDataGrid: {
        defaultProps: { autoHeight: true },
        styleOverrides: {
          root: ({ theme }) => ({
            border: 0,
            borderRadius: 12,
            backgroundColor: theme.palette.background.paper,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: theme.palette.mode === 'light' ? '#f9fafb' : theme.palette.grey[100],
              color: theme.palette.text.primary,
              fontWeight: 600,
              borderBottom: `1px solid ${theme.palette.divider}`,
            },
            '& .MuiDataGrid-row': {
              borderBottom: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'light' ? '#f3f4f6' : theme.palette.grey[200],
              },
            },
            '& .MuiDataGrid-cell': {
              color: theme.palette.text.primary,
              borderBottom: `1px solid ${theme.palette.divider}`,
            },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': { outline: 'none' },
            '& .MuiDataGrid-selectedRowCount': { visibility: 'hidden' },
          }),
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 12,
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.grey[300]}` : 'none',
          }),
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRadius: 16,
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.grey[200]}` : 'none',
          }),
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRadius: 12,
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.grey[200]}` : 'none',
            boxShadow: theme.palette.mode === 'light'
              ? '0 4px 12px rgba(0,0,0,0.1)'
              : '0 4px 12px rgba(0,0,0,0.4)',
          }),
        },
      },
    },
  }), [mode]);

  const value = React.useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export const useColorMode = () => React.useContext(ColorModeContext);
