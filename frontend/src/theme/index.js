import { createContext, useContext } from 'react';

export const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export const FONTS = {
  disp: '"Gloock", Georgia, serif',
  serif: '"Newsreader", Georgia, serif',
  body: '"Mulish", system-ui, sans-serif',
};

export const MEADOW = {
  ...FONTS,
  key: 'meadow',
  ink: '#36402c',
  ink2: '#6f7a60',
  ink3: '#9aa389',
  primary: '#cf6f49',
  primaryD: '#b85b39',
  primarySoft: 'rgba(207,111,73,.12)',
  accent: '#7e9b5c',
  page: '#f3efe2',
  sheet: '#fbf5e6',
  card: '#fffaef',
  line: '#e8ddc6',
  lineSoft: '#efe7d4',
  onSky: '#3a4329',
  skyText: '#3a4329',
  sky: 'linear-gradient(180deg,#bfe2dd 0%,#d6e7d8 40%,#eef2dc 78%,#f6f1de 100%)',
  glow: 'radial-gradient(115% 78% at 80% 6%, rgba(255,248,222,.95), rgba(255,248,222,0) 55%)',
  cloud: 'rgba(255,255,255,.9)',
  hills: ['#a9c187', '#8fae6b', '#739255'],
  good: '#5e7a44',
  goodBg: 'rgba(126,155,92,.16)',
  warn: '#b85b39',
  warnBg: 'rgba(207,111,73,.14)',
  info: '#5b6f8c',
  infoBg: 'rgba(91,111,140,.14)',
};

// Dusk — twilight variant. Deep blue-purple sky fading to warm amber horizon,
// stars, dark hill silhouettes, and light-coloured sky text.
// Primary shifts from terracotta to amber-gold; accent to dusty blue.
export const DUSK = {
  ...FONTS,
  key: 'dusk',
  ink: '#322a3d',
  ink2: '#6e6479',
  ink3: '#9a90a4',
  primary: '#dc9a47',
  primaryD: '#c5833a',
  primarySoft: 'rgba(220,154,71,.14)',
  accent: '#7486ad',
  page: '#efe7da',
  sheet: '#fbf2e3',
  card: '#fff8ed',
  line: '#ecdfcd',
  lineSoft: '#f3e9da',
  onSky: '#fdeede',
  skyText: '#fdeede',
  sky: 'linear-gradient(180deg,#3b4a72 0%,#65567f 42%,#a9748a 72%,#e7b079 96%)',
  glow: 'radial-gradient(85% 60% at 50% 98%, rgba(247,196,134,.85), rgba(247,196,134,0) 62%)',
  cloud: 'rgba(255,233,206,.40)',
  hills: ['#5d5b7d', '#474463', '#322f49'],
  good: '#6e8a96',
  goodBg: 'rgba(116,134,173,.18)',
  warn: '#c5833a',
  warnBg: 'rgba(220,154,71,.16)',
  info: '#8d80ad',
  infoBg: 'rgba(141,128,173,.18)',
};

export const THEMES = { meadow: MEADOW, dusk: DUSK };

// ThemeContext provides the active palette. All useTheme() calls stay unchanged.
export const ThemeContext = createContext(MEADOW);
export const useTheme = () => useContext(ThemeContext);

// Separate context for the toggle function so components don't need to know
// about both the palette and the toggle in a single context.
export const ThemeToggleContext = createContext(() => {});
export const useThemeToggle = () => useContext(ThemeToggleContext);

// Hold colours used for climb tiles and profile send colour strips.
// These are theme-independent (they represent the physical hold colour).
export const HOLD = {
  Green: '#5b9468',
  Orange: '#cd6f3f',
  Blue: '#4677a6',
  Pink: '#a85a7e',
  Yellow: '#caa23a',
  Black: '#5c5560',
  White: '#efe9da',
};
