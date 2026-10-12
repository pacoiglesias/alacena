// Servicio de Personalización de Tema, Paletas y Color del Sistema
// Aplica variables CSS reactivas sobre :root con persistencia instantánea

export const SYSTEM_THEMES = [
  {
    id: 'nordic-obsidian',
    name: 'Nordic Obsidian & Esmeralda Fresca',
    description: 'Minimalismo escandinavo moderno. Negro grafito profundo, tarjetas de pizarra y acentos verde menta/esmeralda.',
    isDark: true,
    colors: {
      bgBase: '#090B0E',
      bgElevated: '#121622',
      bgSunken: '#060709',
      inkPrimary: '#F8FAFC',
      inkSecondary: '#94A3B8',
      inkTertiary: '#64748B',
      borderSoft: '#1E2638',
      borderStrong: '#2A364E',
      accentSuper: '#F59E0B',
      accentCava: '#A855F7',
      accentCocina: '#10B981',
      accentAudit: '#38BDF8',
      accentQr: '#10B981',
    },
    previewDot: '#10B981',
  },
  {
    id: 'luxe-noir',
    name: 'Obsidian & Champagne Imperial',
    description: 'Elegancia nocturna con contrastes en oro champagne y tonos carbón pulido.',
    isDark: true,
    colors: {
      bgBase: '#0B0C10',
      bgElevated: '#141722',
      bgSunken: '#07080B',
      inkPrimary: '#F8FAFC',
      inkSecondary: '#A0AAB8',
      inkTertiary: '#64748B',
      borderSoft: '#1E2333',
      borderStrong: '#2B3349',
      accentSuper: '#F59E0B',
      accentCava: '#E11D48',
      accentCocina: '#F59E0B',
      accentAudit: '#38BDF8',
      accentQr: '#10B981',
    },
    previewDot: '#F59E0B',
  },
  {
    id: 'cava-forest',
    name: 'Cava Forest & Esmeralda Royal',
    description: 'Verde botellón de gran reserva y tonos menta para una atmósfera serena y natural.',
    isDark: true,
    colors: {
      bgBase: '#0D1714',
      bgElevated: '#14241F',
      bgSunken: '#080E0C',
      inkPrimary: '#F0FDF4',
      inkSecondary: '#A7D4C3',
      inkTertiary: '#649581',
      borderSoft: '#1F382E',
      borderStrong: '#2A4E40',
      accentSuper: '#E07A5F',
      accentCava: '#8A3B4F',
      accentCocina: '#F5C249',
      accentAudit: '#4EA8DE',
      accentQr: '#2EC4B6',
    },
    previewDot: '#2EC4B6',
  },
  {
    id: 'borgona-sommelier',
    name: 'Borgoña Gran Reserva & Sommelier',
    description: 'Inspirado en cavas francesas, terciopelo carmesí y roble tostado.',
    isDark: true,
    colors: {
      bgBase: '#170E12',
      bgElevated: '#24151C',
      bgSunken: '#0F090B',
      inkPrimary: '#FDF2F4',
      inkSecondary: '#D9ABB4',
      inkTertiary: '#9C6E78',
      borderSoft: '#381F2B',
      borderStrong: '#4F2C3D',
      accentSuper: '#E27D60',
      accentCava: '#C93B57',
      accentCocina: '#E9C46A',
      accentAudit: '#6A994E',
      accentQr: '#38A3A5',
    },
    previewDot: '#C93B57',
  },
  {
    id: 'zafiro-medianoche',
    name: 'Zafiro Presidencial & Medianoche',
    description: 'Azul marino profundo con acentos en platino y zafiro pulido.',
    isDark: true,
    colors: {
      bgBase: '#0B131F',
      bgElevated: '#131F33',
      bgSunken: '#060B12',
      inkPrimary: '#F0F6FC',
      inkSecondary: '#9BB2D1',
      inkTertiary: '#5C7496',
      borderSoft: '#1D2E4A',
      borderStrong: '#294269',
      accentSuper: '#F4845F',
      accentCava: '#9381FF',
      accentCocina: '#FFD166',
      accentAudit: '#48CAE4',
      accentQr: '#06D6A0',
    },
    previewDot: '#48CAE4',
  },
  {
    id: 'espresso-ambar',
    name: 'Espresso & Ámbar Cobrizo',
    description: 'Café tostado artesanal, cobre pulido y tonos tierra cálidos.',
    isDark: true,
    colors: {
      bgBase: '#14110E',
      bgElevated: '#211C17',
      bgSunken: '#0D0A08',
      inkPrimary: '#FAF4EB',
      inkSecondary: '#C7B5A1',
      inkTertiary: '#8C7764',
      borderSoft: '#332A22',
      borderStrong: '#4A3D31',
      accentSuper: '#D96B27',
      accentCava: '#A63D40',
      accentCocina: '#E9B44C',
      accentAudit: '#588B8B',
      accentQr: '#439A86',
    },
    previewDot: '#D96B27',
  },
  {
    id: 'luxe-cream-light',
    name: 'Luxe Cream (Modo Claro de Cocina)',
    description: 'Marfil suave y blanco puro con alto contraste, ideal para cocinas muy iluminadas de día.',
    isDark: false,
    colors: {
      bgBase: '#FBF8F3',
      bgElevated: '#FFFFFF',
      bgSunken: '#F0EBE1',
      inkPrimary: '#1E1915',
      inkSecondary: '#574E45',
      inkTertiary: '#8A7E73',
      borderSoft: '#E6DDD0',
      borderStrong: '#C7B9A5',
      accentSuper: '#C8542A',
      accentCava: '#7D2235',
      accentCocina: '#B8860B',
      accentAudit: '#2D556E',
      accentQr: '#1E5E45',
    },
    previewDot: '#C8542A',
  },
];

const THEME_STORAGE_KEY = 'alacena_active_theme_id';

export function getActiveTheme() {
  try {
    const savedId = localStorage.getItem(THEME_STORAGE_KEY);
    const found = SYSTEM_THEMES.find((t) => t.id === savedId);
    if (found) return found;
  } catch (e) {}
  return SYSTEM_THEMES[0]; // Luxe Noir default
}

export function applyTheme(themeOrId) {
  const theme = typeof themeOrId === 'string'
    ? SYSTEM_THEMES.find((t) => t.id === themeOrId) || SYSTEM_THEMES[0]
    : themeOrId;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  } catch (e) {}

  const root = document.documentElement;

  // Toggle .dark class based on theme lightness
  if (theme.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Inject CSS Variables
  const c = theme.colors;
  root.style.setProperty('--bg-base', c.bgBase);
  root.style.setProperty('--bg-elevated', c.bgElevated);
  root.style.setProperty('--bg-sunken', c.bgSunken);
  root.style.setProperty('--ink-primary', c.inkPrimary);
  root.style.setProperty('--ink-secondary', c.inkSecondary);
  root.style.setProperty('--ink-tertiary', c.inkTertiary);
  root.style.setProperty('--border-soft', c.borderSoft);
  root.style.setProperty('--border-strong', c.borderStrong);
  root.style.setProperty('--accent-super', c.accentSuper);
  root.style.setProperty('--accent-cava', c.accentCava);
  root.style.setProperty('--accent-cocina', c.accentCocina);
  root.style.setProperty('--accent-audit', c.accentAudit);
  root.style.setProperty('--accent-qr', c.accentQr);

  // Background style update
  document.body.style.backgroundColor = c.bgBase;
  document.body.style.color = c.inkPrimary;

  window.dispatchEvent(new CustomEvent('alacena_theme_changed', { detail: theme }));
  return theme;
}

// Auto-initialize theme on script evaluation
if (typeof window !== 'undefined') {
  try {
    applyTheme(getActiveTheme());
  } catch (e) {}
}
