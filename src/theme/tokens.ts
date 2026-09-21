import { Platform, TextStyle } from 'react-native';

export const colors = {
  background: '#0C0D11',
  surface: '#131519',
  surface2: '#181B21',
  surfaceRaised: '#1D2027',
  border: '#262A33',
  borderSoft: '#20242C',

  text: '#D4D8E0',
  textStrong: '#F4F6FA',
  textMuted: '#8B93A1',
  textFaint: '#5C636F',

  primary: '#6366F1',
  primaryBright: '#818CF8',
  primaryTint: 'rgba(99, 102, 241, 0.14)',
  primaryText: '#FFFFFF',
  accentCyan: '#22D3EE',

  danger: '#F2555A',
  warning: '#FBBF24',
  success: '#34D399',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const fonts = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string,
} as const;

export const labelText: TextStyle = {
  fontSize: fontSize.xs,
  fontWeight: '600',
  letterSpacing: 1,
  textTransform: 'uppercase',
  color: colors.textFaint,
};

export const mono: TextStyle = {
  fontFamily: fonts.mono,
  fontVariant: ['tabular-nums'],
};

export const MIN_TAP_TARGET = 64;
