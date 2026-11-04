/**
 * Design tokens — the ONLY place colours, spacing, radii and type sizes are defined.
 * Brand: t2 yellow (from the logo) for highlights, t2 pink for primary actions and prices.
 */
import '@/global.css';

import { Platform } from 'react-native';

const palette = {
  yellow500: '#F5B82E',
  yellow100: '#FDF1D3',
  pink600: '#D9245A',
  pink500: '#E8457A',
  pink100: '#FBE3EB',
  ink900: '#16161D',
  ink700: '#3A3A45',
  ink500: '#6B6B78',
  ink300: '#B4B4BE',
  ink100: '#EDEDF1',
  ink050: '#F7F7F9',
  white: '#FFFFFF',
  black: '#0B0B0F',
  green600: '#1E8E5A',
  red600: '#C62828',
  indigo600: '#3C4FB5',
} as const;

export const Colors = {
  light: {
    text: palette.ink900,
    textSecondary: palette.ink500,
    textOnPrimary: palette.white,
    background: palette.white,
    surface: palette.ink050,
    surfaceRaised: palette.white,
    border: palette.ink100,
    primary: palette.pink600,
    primarySoft: palette.pink100,
    highlight: palette.yellow500,
    highlightSoft: palette.yellow100,
    price: palette.pink600,
    success: palette.green600,
    danger: palette.red600,
    reserved: palette.indigo600,
    badgeNeutral: palette.ink700,
    tabInactive: palette.ink500,
  },
  dark: {
    text: palette.ink050,
    textSecondary: palette.ink300,
    textOnPrimary: palette.white,
    background: palette.black,
    surface: '#18181F',
    surfaceRaised: '#202029',
    border: '#2C2C36',
    primary: palette.pink500,
    primarySoft: '#3A1624',
    highlight: palette.yellow500,
    highlightSoft: '#3A2F12',
    price: palette.pink500,
    success: '#3FBF83',
    danger: '#EF5350',
    reserved: '#4B5BD6',
    badgeNeutral: '#4A4A56',
    tabInactive: palette.ink300,
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };
export type ThemeColor = keyof ThemeColors;

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radii = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

/** Type scale. Sizes are base sizes; Text scales them with Dynamic Type. */
export const Type = {
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '600' },
  price: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800' },
} as const;
export type TypeVariant = keyof typeof Type;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded' },
  web: { sans: 'var(--font-display)', rounded: 'var(--font-rounded)' },
  default: { sans: 'normal', rounded: 'normal' },
});

export const Layout = {
  maxContentWidth: 960,
  gridGap: Spacing.sm,
  bottomTabInset: Platform.select({ ios: 50, android: 80 }) ?? 0,
} as const;
