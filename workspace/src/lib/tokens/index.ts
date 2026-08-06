/**
 * SCHOLARIO-OS — Centralized Enterprise Design Tokens
 * Single source of truth for color palettes, spacing, typography, radii, shadows, glassmorphism, and motion.
 */

export const DESIGN_TOKENS = {
  colors: {
    brand: {
      primary: '#0F172A', // Deep Indigo Slate
      primaryForeground: '#FFFFFF',
      accent: '#4F46E5', // Indigo Accent
      accentLight: '#EEF2FF',
      gradientStart: '#1E293B',
      gradientEnd: '#0F172A',
    },
    semantic: {
      success: '#10B981',
      successLight: '#ECFDF5',
      warning: '#F59E0B',
      warningLight: '#FFFBEB',
      danger: '#EF4444',
      dangerLight: '#FEF2F2',
      info: '#3B82F6',
      infoLight: '#EFF6FF',
    },
    neutral: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
      950: '#020617',
    },
    chart: {
      attendance: '#10B981',
      revenue: '#3B82F6',
      academics: '#8B5CF6',
      admissions: '#F59E0B',
      expenses: '#EF4444',
      transport: '#06B6D4',
      library: '#EC4899',
    },
    status: {
      active: '#10B981',
      pending: '#F59E0B',
      suspended: '#EF4444',
      archived: '#64748B',
      draft: '#8B5CF6',
    },
  },
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  borderRadius: {
    none: '0px',
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },
  shadows: {
    subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
    modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glass: '0 8px 32px 0 rgba(15, 23, 42, 0.08)',
  },
  glass: {
    background: 'rgba(255, 255, 255, 0.85)',
    backgroundDark: 'rgba(15, 23, 42, 0.85)',
    backdropBlur: '12px',
    border: '1px solid rgba(226, 232, 240, 0.6)',
  },
  typography: {
    fontFamily: {
      sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'Plus Jakarta Sans, Inter, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
    scale: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
    },
  },
  motion: {
    duration: {
      fast: 150,
      normal: 250,
      slow: 350,
    },
    easing: {
      easeInOut: [0.4, 0, 0.2, 1],
      easeOut: [0, 0, 0.2, 1],
      spring: { type: 'spring', stiffness: 300, damping: 25 },
    },
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
