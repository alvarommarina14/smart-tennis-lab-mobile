export const colors = {
  background: '#0F1418',
  surface: '#1A2129',
  surfaceRaised: '#232C36',
  border: '#2E3944',

  text: '#F2F5F7',
  textMuted: '#9AA7B4',

  primary: '#C8FF4D',
  primaryText: '#0F1418',

  danger: '#FF5C5C',
  warning: '#FFB020',
  success: '#3DD68C',
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
  lg: 20,
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

export const MIN_TAP_TARGET = 64;
