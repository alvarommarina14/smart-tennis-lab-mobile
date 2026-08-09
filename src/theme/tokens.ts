/**
 * Tokens de diseño de Smart Tennis Lab.
 *
 * La app se usa al aire libre, con sol, y con el profe mirando la cancha y no la pantalla. De ahí
 * las tres reglas que mandan sobre todo lo demás: contraste alto, tipografía grande y áreas de
 * toque generosas.
 */

export const colors = {
  // Verde pista de polvo de ladrillo invertido: fondo oscuro para que se lea con sol directo.
  background: '#0F1418',
  surface: '#1A2129',
  surfaceRaised: '#232C36',
  border: '#2E3944',

  text: '#F2F5F7',
  textMuted: '#9AA7B4',

  primary: '#C8FF4D', // verde pelota de tenis
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

/**
 * Mínimo de 64 px, por encima de los 44/48 que recomiendan las guías de accesibilidad: el profe
 * toca sin mirar, así que el margen de error tiene que ser mayor que el de una app común.
 */
export const MIN_TAP_TARGET = 64;
