import React, { useState, useEffect } from 'react';
import { 
  X, Check, RotateCcw, Sparkles, ShoppingCart, 
  Wine, Utensils, History, Layers, Sliders, Edit3,
  Eye, EyeOff, Plus, Trash2, Tag, Snowflake, Flame,
  Coffee, ShoppingBag
} from 'lucide-react';
import { audio } from '../../services/audioService';

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

const PRESETS = [
  {
    name: '🏰 Residencia Familiar Completa (5 Pestañas)',
    tabs: [
      { id: 'shopping', key: 'shopping', label: 'Mandado & Súper', icon: 'ShoppingCart', enabled: true, color: '#E5724A', isSystem: true },
      { id: 'cava', key: 'cava', label: 'Cava de Vinos', icon: 'Wine', enabled: true, color: '#A83A50', isSystem: true },
      { id: 'recipes', key: 'recipes', label: 'Cocina de Casa', icon: 'Utensils', enabled: true, color: '#E0B441', isSystem: true },
      { id: 'audit', key: 'audit', label: 'Historial Familiar', icon: 'History', enabled: true, color: '#5C8894', isSystem: true },
      { id: 'inventory', key: 'inventory', label: 'Mi Despensa', icon: 'Layers', enabled: true, color: '#3D8B6E', isSystem: true },
    ],
  },
  {
    name: '⚡ Minimalista (Solo Despensa & Súper)',
    tabs: [
      { id: 'shopping', key: 'shopping', label: 'Lista del Súper', icon: 'ShoppingCart', enabled: true, color: '#E5724A', isSystem: true },
      { id: 'cava', key: 'cava', label: 'Cava', icon: 'Wine', enabled: false, color: '#A83A50', isSystem: true },
      { id: 'recipes', key: 'recipes', label: 'Recetas', icon: 'Utensils', enabled: false, color: '#E0B441', isSystem: true },
      { id: 'audit', key: 'audit', label: 'Bitácora', icon: 'History', enabled: false, color: '#5C8894', isSystem: true },
      { id: 'inventory', key: 'inventory', label: 'Despensa Principal', icon: 'Layers', enabled: true, color: '#3D8B6E', isSystem: true },
    ],
  },
  {
    name: '🍷 Cava & Sommelier de Lujo',
    tabs: [
      { id: 'shopping', key: 'shopping', label: 'Compras Selectas', icon: 'ShoppingCart', enabled: true, color: '#E5724A', isSystem: true },
      { id: 'cava', key: 'cava', label: 'Cava Gran Reserva', icon: 'Wine', enabled: true, color: '#A83A50', isSystem: true },
      { id: 'recipes', key: 'recipes', label: 'Maridajes & Cocina', icon: 'Utensils', enabled: true, color: '#E0B441', isSystem: true },
      { id: 'audit', key: 'audit', label: 'Bitácora de Descorche', icon: 'History', enabled: true, color: '#5C8894', isSystem: true },
      { id: 'inventory', key: 'inventory', label: 'Alacena & Bar', icon: 'Layers', enabled: true, color: '#3D8B6E', isSystem: true },
    ],
  },
  {
    name: '👨‍🍳 Personal Doméstico (Chofer & Cocinera)',
    tabs: [
      { id: 'shopping', key: 'shopping', label: 'Lista para el Chofer', icon: 'ShoppingCart', enabled: true, color: '#E5724A', isSystem: true },
      { id: 'cava', key: 'cava', label: 'Cava', icon: 'Wine', enabled: false, color: '#A83A50', isSystem: true },
      { id: 'recipes', key: 'recipes', label: 'Menú de la Cocinera', icon: 'Utensils', enabled: true, color: '#E0B441', isSystem: true },
      { id: 'audit', key: 'audit', label: 'Registro de Salidas', icon: 'History', enabled: true, color: '#5C8894', isSystem: true },
      { id: 'inventory', key: 'inventory', label: 'Almacén Central', icon: 'Layers', enabled: true, color: '#3D8B6E', isSystem: true },
    ],
  },
];

export default function CustomTabNamesModal({ 
  isOpen, 
  onClose, 
  menuTabs, 
  onSaveMenuTabs, 
  zones = [] 
}) {
  const [tabs, setTabs] = useState(DEFAULT_MENU_TABS);
  const [newTabName, setNewTabName] = useState('');
  const [newTabIcon, setNewTabIcon] = useState('Snowflake');
  const [newTabZone, setNewTabZone] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  useEffect(() => {
    if (menuTabs && Array.isArray(menuTabs)) {
      setTabs(menuTabs);
    }
  }, [menuTabs, isOpen]);

  if (!isOpen) return null;

  // Toggle visibilidad (Mostrar / Ocultar)
  const handleToggleTab = (id) => {
    audio.click();
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  // Renombrar etiqueta
  const handleRenameTab = (id, newLabel) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, label: newLabel } : t))
    );
  };

  // Eliminar pestaña personalizada
  const handleDeleteCustomTab = (id) => {
    audio.delete();
    setTabs((prev) => prev.filter((t) => t.id !== id));
  };

  // Agregar pestaña personalizada
  const handleAddCustomTab = (e) => {
    e.preventDefault();
    if (!newTabName.trim()) return;

    audio.success();
    const newTab = {
      id: `custom_${Date.now()}`,
      key: `custom_${Date.now()}`,
      label: newTabName.trim(),
      icon: newTabIcon,
      enabled: true,
      color: '#E0B441',
      isSystem: false,
      targetZone: newTabZone || null,
    };

    setTabs((prev) => [...prev, newTab]);
    setNewTabName('');
    setIsAddingCustom(false);
  };

  // Aplicar preset
  const handleApplyPreset = (preset) => {
    audio.click();
    setTabs(preset.tabs);
  };

  // Restaurar valores por defecto
  const handleResetDefaults = () => {
    audio.delete();
    setTabs(DEFAULT_MENU_TABS);
  };

  // Guardar y cerrar
  const handleSubmit = (e) => {
    e.preventDefault();
    audio.success();
    onSaveMenuTabs(tabs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-[var(--bg-base)] border border-[var(--gold)]/35 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-soft)] bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-bold text-[var(--ink-primary)]">
                Configurar Menú del Hogar
              </h2>
              <p className="text-xs text-[var(--ink-secondary)]">
                Renombra, oculta lo que no uses o agrega pestañas personalizadas con 1 toque
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* Presets Rápidos */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--gold)] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Plantillas Rápidas de 1 Clic
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] border border-[var(--border-strong)] hover:border-[var(--gold)]/40 text-left transition-all group"
                >
                  <span className="text-xs font-semibold text-[var(--ink-primary)] group-hover:text-[var(--gold)] transition-colors block leading-tight">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Pestañas Configurables (Quitar / Mostrar / Renombrar) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--gold)] uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" />
                Pestañas del Menú (Visibilidad y Nombres)
              </label>
              <button
                type="button"
                onClick={() => setIsAddingCustom(!isAddingCustom)}
                className="text-xs font-semibold text-[var(--gold)] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar Pestaña</span>
              </button>
            </div>

            {/* Formulario para agregar pestaña nueva */}
            {isAddingCustom && (
              <form onSubmit={handleAddCustomTab} className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--gold)]/40 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--ink-primary)]">Nueva Pestaña Personalizada</span>
                  <button type="button" onClick={() => setIsAddingCustom(false)} className="text-xs text-[var(--ink-tertiary)] hover:text-white">✕</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newTabName}
                    onChange={(e) => setNewTabName(e.target.value)}
                    placeholder="Nombre (ej. Cuarto Frío, Bar)..."
                    className="p-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-strong)] text-xs text-[var(--ink-primary)] outline-none focus:border-[var(--gold)]"
                    required
                  />
                  <select
                    value={newTabIcon}
                    onChange={(e) => setNewTabIcon(e.target.value)}
                    className="p-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-strong)] text-xs text-[var(--ink-secondary)] outline-none"
                  >
                    <option value="Snowflake">❄️ Congelador / Frío</option>
                    <option value="Wine">🍷 Bar / Licores</option>
                    <option value="Flame">🔥 Parrilla / Asador</option>
                    <option value="Coffee">☕ Cafetería / Snacks</option>
                    <option value="ShoppingBag">🛍️ Tienda Especial</option>
                    <option value="Tag">🏷️ Etiqueta / Zona</option>
                  </select>
                </div>

                {zones.length > 0 && (
                  <div>
                    <label className="text-[11px] text-[var(--ink-tertiary)] block mb-1">Vincular a una Zona Física (Opcional):</label>
                    <select
                      value={newTabZone}
                      onChange={(e) => setNewTabZone(e.target.value)}
                      className="w-full p-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-strong)] text-xs text-[var(--ink-primary)] outline-none"
                    >
                      <option value="">Ninguna (General)</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.name}>{z.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(false)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-xs text-[var(--ink-secondary)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[var(--gold)] text-[var(--on-gold)] font-bold text-xs hover:brightness-110"
                  >
                    Guardar Pestaña
                  </button>
                </div>
              </form>
            )}

            {/* Listado de pestañas */}
            <div className="space-y-2">
              {tabs.map((tab) => {
                const IconComponent = ICON_MAP[tab.icon] || Layers;
                return (
                  <div
                    key={tab.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                      tab.enabled 
                        ? 'bg-[var(--bg-elevated)] border-[var(--border-strong)]' 
                        : 'bg-[var(--bg-base)]/50 border-[var(--border-soft)] opacity-50'
                    }`}
                  >
                    {/* Botón de Visibilidad (Ocultar / Mostrar) */}
                    <button
                      type="button"
                      onClick={() => handleToggleTab(tab.id)}
                      className={`p-2 rounded-xl border transition-all shrink-0 ${
                        tab.enabled
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                          : 'bg-white/5 border-[var(--border-soft)] text-[var(--ink-tertiary)] hover:text-white'
                      }`}
                      title={tab.enabled ? 'Ocultar esta pestaña del menú' : 'Mostrar esta pestaña en el menú'}
                    >
                      {tab.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Icono de la pestaña */}
                    <div 
                      className="p-2 rounded-xl shrink-0"
                      style={{ backgroundColor: `${tab.color}20`, color: tab.color }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Input para Renombrar */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={tab.label}
                        onChange={(e) => handleRenameTab(tab.id, e.target.value)}
                        className="w-full bg-transparent text-sm font-semibold text-[var(--ink-primary)] px-2 py-1 rounded-lg border border-transparent focus:border-[var(--gold)] focus:bg-[var(--bg-base)] outline-none transition-all"
                        placeholder="Nombre de la pestaña..."
                      />
                      {!tab.isSystem && tab.targetZone && (
                        <span className="text-[10px] text-[var(--gold)] font-mono pl-2 block">
                          → Filtra Zona: {tab.targetZone}
                        </span>
                      )}
                    </div>

                    {/* Eliminar si es personalizada */}
                    {!tab.isSystem && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomTab(tab.id)}
                        className="p-1.5 rounded-lg text-[var(--ink-tertiary)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                        title="Eliminar pestaña personalizada"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-t border-[var(--border-soft)] bg-[var(--bg-elevated)] flex-wrap gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-tertiary)] hover:text-rose-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Predeterminados</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                audio.click();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl border border-[var(--border-strong)] text-xs sm:text-sm font-semibold text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--gold)] to-[var(--ember)] text-[var(--on-gold)] font-bold text-xs sm:text-sm hover:brightness-110 shadow-lg shadow-[var(--gold)]/20 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
