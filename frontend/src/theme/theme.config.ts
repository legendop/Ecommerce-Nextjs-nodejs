import { colors } from './colors';
import { typography } from './typography';

/**
 * Main theme configuration
 * Central place to manage all theme settings
 */
export const theme = {
  // Brand colors
  colors: {
    primary: colors.brand.purple,
    secondary: colors.brand.pink,
    accent: colors.brand['pink-dark'],
    background: colors.brand.cream,
    surface: '#FFFFFF',
    text: colors.gray[900],
    textMuted: colors.gray[500],
    border: colors.gray[200],
    error: colors.red[500],
    success: colors.green[500],
    warning: colors.yellow[500],
    info: colors.blue[500],
    brand: colors.brand,
    gray: colors.gray,
  },

  // Typography
  typography: {
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize,
    fontWeight: typography.fontWeight,
    lineHeight: typography.lineHeight,
  },

  // Spacing
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  // Border radius
  radius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },

  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },

  // Breakpoints (matches Tailwind defaults)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-index scale
  zIndex: {
    hide: -1,
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
} as const;

// Type export for TypeScript
export type Theme = typeof theme;

// Helper to get theme values
export const getThemeValue = <K extends keyof Theme>(key: K): Theme[K] => theme[key];
