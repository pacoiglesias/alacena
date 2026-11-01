import {ShoppingCart, Wine, Utensils, History, Layers, Snowflake, Flame, Coffee, ShoppingBag, Tag} from 'lucide-react';
export const ICON_MAP = {
  ShoppingCart,
  Wine,
  Utensils,
  History,
  Layers,
  Snowflake,
  Flame,
  Coffee,
  ShoppingBag,
  Tag,
};

export const DEFAULT_MENU_TABS = [
  { id: 'shopping', key: 'shopping', label: 'Lista del Súper', icon: 'ShoppingCart', enabled: true, color: '#E5724A', isSystem: true },
  { id: 'cava', key: 'cava', label: 'CavaPro Vinos', icon: 'Wine', enabled: true, color: '#A83A50', isSystem: true },
  { id: 'recipes', key: 'recipes', label: 'Cocina & Recetas', icon: 'Utensils', enabled: true, color: '#E0B441', isSystem: true },
  { id: 'audit', key: 'audit', label: 'Bitácora Forense', icon: 'History', enabled: true, color: '#5C8894', isSystem: true },
  { id: 'inventory', key: 'inventory', label: 'Alacena & QR', icon: 'Layers', enabled: true, color: '#3D8B6E', isSystem: true },
];

