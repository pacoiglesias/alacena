import React, { useState, useMemo } from 'react';
import { 
  X, Check, Store, Users, Tag, Scale, Plus, Trash2, 
  Sparkles, Star, AlertCircle, RefreshCw, ShoppingCart, 
  UserCheck, Edit3, Search, CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { 
  getCatalogs, saveCatalogs, DEFAULT_STORES, DEFAULT_STAFF, 
  DEFAULT_CATEGORIES, DEFAULT_UNITS 
} from '../../services/catalogsService';

// Sugerencias de emojis rápidos para tiendas y personal
const STORE_EMOJIS = ['🛒', '🏪', '🏬', '🛍️', '🥩', '🐟', '🥬', '🥖', '🍷', '☕', '🧴', '🥑'];
const STAFF_EMOJIS = ['👩‍🍳', '👨‍🍳', '🧹', '🚗', '👑', '👤', '🍷', '🍳', '📦', ' butler', '🤵', '🧑‍🌾'];

export default function CatalogsConfigModal({ isOpen, onClose, onCatalogsUpdated }) {
  const [activeTab, setActiveTab] = useState('stores'); // 'stores' | 'staff' | 'categories' | 'units'
  const [catalogs, setCatalogs] = useState(() => getCatalogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Editing state: { type: 'stores'|'staff'|'categories'|'units', id: string, data: object }
  const [editingItem, setEditingItem] = useState(null);

  // Form states for adding items
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCategory, setNewStoreCategory] = useState('Supermercado');
  const [newStoreIcon, setNewStoreIcon] = useState('🛒');

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Personal de Servicio');
  const [newStaffIcon, setNewStaffIcon] = useState('👤');

  const [newCategoryName, setNewCategoryName] = useState('');

  const [newUnitId, setNewUnitId] = useState('');
  const [newUnitLabel, setNewUnitLabel] = useState('');

  if (!isOpen) return null;

  const handleUpdate = (updated) => {
    setCatalogs(updated);
    saveCatalogs(updated);
    if (onCatalogsUpdated) onCatalogsUpdated(updated);
  };

  // --- STORES ACTIONS ---
  const handleAddStore = (e) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    audio.success();

    const newStore = {
      id: `store-${Date.now()}`,
      name: newStoreName.trim(),
      category: newStoreCategory.trim() || 'Supermercado',
      icon: newStoreIcon || '🛒',
      isDefault: catalogs.stores.length === 0,
    };

    const updated = {
      ...catalogs,
      stores: [...catalogs.stores, newStore],
    };
    handleUpdate(updated);
    setNewStoreName('');
    setShowAddForm(false);
  };

  const handleSaveEditStore = (id) => {
    if (!editingItem || !editingItem.data.name?.trim()) return;
    audio.success();
    const updated = {
      ...catalogs,
      stores: catalogs.stores.map((s) => 
        s.id === id ? { 
          ...s, 
          name: editingItem.data.name.trim(),
          category: editingItem.data.category?.trim() || 'Supermercado',
          icon: editingItem.data.icon || '🏪'
        } : s
      ),
    };
    handleUpdate(updated);
    setEditingItem(null);
  };

  const handleDeleteStore = (id) => {
    audio.click();
    const updated = {
      ...catalogs,
      stores: catalogs.stores.filter((s) => s.id !== id),
    };
    handleUpdate(updated);
  };

  const handleSetDefaultStore = (id) => {
    audio.click();
    const updated = {
      ...catalogs,
      stores: catalogs.stores.map((s) => ({
        ...s,
        isDefault: s.id === id,
      })),
    };
    handleUpdate(updated);
  };

  // --- STAFF ACTIONS ---
  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    audio.success();

    const newPerson = {
      id: `staff-${Date.now()}`,
      name: newStaffName.trim(),
      role: newStaffRole.trim() || 'Personal de Servicio',
      icon: newStaffIcon || '👤',
      isDefault: catalogs.staff.length === 0,
    };

    const updated = {
      ...catalogs,
      staff: [...catalogs.staff, newPerson],
    };
    handleUpdate(updated);
    setNewStaffName('');
    setShowAddForm(false);
  };

  const handleSaveEditStaff = (id) => {
    if (!editingItem || !editingItem.data.name?.trim()) return;
    audio.success();
    const updated = {
      ...catalogs,
      staff: catalogs.staff.map((s) =>
        s.id === id ? {
          ...s,
          name: editingItem.data.name.trim(),
          role: editingItem.data.role?.trim() || 'Personal',
          icon: editingItem.data.icon || '👤'
        } : s
      ),
    };
    handleUpdate(updated);
    setEditingItem(null);
  };

  const handleDeleteStaff = (id) => {
    audio.click();
    const updated = {
      ...catalogs,
      staff: catalogs.staff.filter((s) => s.id !== id),
    };
    handleUpdate(updated);
  };

  const handleSetDefaultStaff = (id) => {
    audio.click();
    const updated = {
      ...catalogs,
      staff: catalogs.staff.map((s) => ({
        ...s,
        isDefault: s.id === id,
      })),
    };
    handleUpdate(updated);
  };

  // --- CATEGORIES ACTIONS ---
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    audio.success();
    const trimmed = newCategoryName.trim();
    if (!catalogs.categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      const updated = {
        ...catalogs,
        categories: [...catalogs.categories, trimmed],
      };
      handleUpdate(updated);
    }
    setNewCategoryName('');
    setShowAddForm(false);
  };

  const handleSaveEditCategory = (oldCat) => {
    if (!editingItem || !editingItem.data.name?.trim()) return;
    audio.success();
    const newName = editingItem.data.name.trim();
    const updated = {
      ...catalogs,
      categories: catalogs.categories.map((c) => (c === oldCat ? newName : c)),
    };
    handleUpdate(updated);
    setEditingItem(null);
  };

  const handleDeleteCategory = (catName) => {
    audio.click();
    const updated = {
      ...catalogs,
      categories: catalogs.categories.filter((c) => c !== catName),
    };
    handleUpdate(updated);
  };

  // --- UNITS ACTIONS ---
  const handleAddUnit = (e) => {
    e.preventDefault();
    if (!newUnitId.trim() || !newUnitLabel.trim()) return;
    audio.success();
    const newUnit = {
      id: newUnitId.trim().toLowerCase(),
      label: newUnitLabel.trim(),
      short: newUnitId.trim().toLowerCase(),
    };
    const updated = {
      ...catalogs,
      units: [...catalogs.units, newUnit],
    };
    handleUpdate(updated);
    setNewUnitId('');
    setNewUnitLabel('');
    setShowAddForm(false);
  };

  const handleSaveEditUnit = (id) => {
    if (!editingItem || !editingItem.data.label?.trim()) return;
    audio.success();
    const updated = {
      ...catalogs,
      units: catalogs.units.map((u) =>
        u.id === id ? {
          ...u,
          label: editingItem.data.label.trim(),
          short: editingItem.data.short?.trim() || u.short
        } : u
      ),
    };
    handleUpdate(updated);
    setEditingItem(null);
  };

  const handleDeleteUnit = (id) => {
    audio.click();
    const updated = {
      ...catalogs,
      units: catalogs.units.filter((u) => u.id !== id),
    };
    handleUpdate(updated);
  };

  const handleResetDefaults = () => {
    if (confirm('¿Restablecer los catálogos a los valores predeterminados del sistema?')) {
      audio.click();
      const restored = {
        stores: DEFAULT_STORES,
        staff: DEFAULT_STAFF,
        categories: DEFAULT_CATEGORIES,
        units: DEFAULT_UNITS,
      };
      handleUpdate(restored);
      setEditingItem(null);
      setSearchQuery('');
    }
  };

  // Filtered lists according to search query con proteccion defensiva
  const q = (searchQuery || '').toLowerCase().trim();
  const filteredStores = useMemo(() => {
    if (!catalogs?.stores || !Array.isArray(catalogs.stores)) return [];
    return catalogs.stores.filter((s) => {
      const name = (s?.name || s || '').toString().toLowerCase();
      const cat = (s?.category || '').toString().toLowerCase();
      return !q || name.includes(q) || cat.includes(q);
    });
  }, [catalogs?.stores, q]);

  const filteredStaff = useMemo(() => {
    if (!catalogs?.staff || !Array.isArray(catalogs.staff)) return [];
    return catalogs.staff.filter((s) => {
      const name = (s?.name || s || '').toString().toLowerCase();
      const role = (s?.role || '').toString().toLowerCase();
      return !q || name.includes(q) || role.includes(q);
    });
  }, [catalogs?.staff, q]);

  const filteredCategories = useMemo(() => {
    if (!catalogs?.categories || !Array.isArray(catalogs.categories)) return [];
    return catalogs.categories.filter((c) => {
      const name = (typeof c === 'string' ? c : c?.name || '').toString().toLowerCase();
      return !q || name.includes(q);
    });
  }, [catalogs?.categories, q]);

  const filteredUnits = useMemo(() => {
    if (!catalogs?.units || !Array.isArray(catalogs.units)) return [];
    return catalogs.units.filter((u) => {
      const label = (u?.label || u?.name || u || '').toString().toLowerCase();
      const short = (u?.short || u?.id || '').toString().toLowerCase();
      return !q || label.includes(q) || short.includes(q);
    });
  }, [catalogs?.units, q]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[94vh] sm:max-h-[90vh] rounded-2xl sm:rounded-3xl bg-[#14110F] border border-[#E0B441]/50 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#2A2521] bg-[#1C1814] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-[#E0B441]/15 text-[#E0B441] border border-[#E0B441]/30 shrink-0">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-display font-bold text-[#F2EDE4] flex items-center gap-2 truncate">
                <span>Catálogos & Opciones del Sistema</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#E0B441]/20 text-[#E0B441] text-[10px] font-mono font-bold">
                  Configuración Maestra
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-[#B8AFA3] truncate mt-0.5">
                Personaliza tiendas habituales, personal que registra, categorías y unidades de medida
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="p-2 sm:p-2.5 rounded-xl text-[#B8AFA3] hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Tab Navigation + Search Filter */}
        <div className="p-3 sm:p-4 border-b border-[#2A2521] bg-[#181411] shrink-0 space-y-2.5">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <button
              onClick={() => { audio.click(); setActiveTab('stores'); setEditingItem(null); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'stores'
                  ? 'bg-[#E0B441] text-[#12100E] font-bold shadow-md shadow-[#E0B441]/20'
                  : 'text-[#B8AFA3] hover:text-white hover:bg-white/5'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Tiendas ({catalogs.stores.length})</span>
            </button>

            <button
              onClick={() => { audio.click(); setActiveTab('staff'); setEditingItem(null); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-[#E0B441] text-[#12100E] font-bold shadow-md shadow-[#E0B441]/20'
                  : 'text-[#B8AFA3] hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Personal ({catalogs.staff.length})</span>
            </button>

            <button
              onClick={() => { audio.click(); setActiveTab('categories'); setEditingItem(null); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-[#E0B441] text-[#12100E] font-bold shadow-md shadow-[#E0B441]/20'
                  : 'text-[#B8AFA3] hover:text-white hover:bg-white/5'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Categorías ({catalogs.categories.length})</span>
            </button>

            <button
              onClick={() => { audio.click(); setActiveTab('units'); setEditingItem(null); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'units'
                  ? 'bg-[#E0B441] text-[#12100E] font-bold shadow-md shadow-[#E0B441]/20'
                  : 'text-[#B8AFA3] hover:text-white hover:bg-white/5'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Unidades ({catalogs.units.length})</span>
            </button>
          </div>

          {/* Quick Search & Toggle Add Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Buscar en ${activeTab === 'stores' ? 'tiendas' : activeTab === 'staff' ? 'personal' : activeTab === 'categories' ? 'categorías' : 'unidades'}...`}
                className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl bg-[#12100E] border border-[#2A2521] text-white placeholder-gray-500 focus:outline-none focus:border-[#E0B441]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => { audio.click(); setShowAddForm(!showAddForm); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                showAddForm 
                  ? 'bg-[#6B1F2E] text-white border border-[#A83A50]/40' 
                  : 'bg-[#E0B441]/20 text-[#E0B441] border border-[#E0B441]/40 hover:bg-[#E0B441]/30'
              }`}
            >
              {showAddForm ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{showAddForm ? 'Ocultar Formulario' : 'Nuevo Registro'}</span>
            </button>
          </div>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">

          {/* TAB 1: TIENDAS & PROVEEDORES */}
          {activeTab === 'stores' && (
            <div className="space-y-4">
              {/* Formulario Agregar Tienda (Colapsable o desplegado) */}
              {showAddForm && (
                <div className="p-4 rounded-2xl bg-[#1C1814] border border-[#E0B441]/40 shadow-lg animate-fade-in">
                  <h4 className="text-xs font-bold text-[#E0B441] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Nueva Tienda o Proveedor</span>
                  </h4>
                  <form onSubmit={handleAddStore} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-gray-400 block mb-1">Ícono</label>
                        <input
                          type="text"
                          maxLength={3}
                          value={newStoreIcon}
                          onChange={(e) => setNewStoreIcon(e.target.value)}
                          placeholder="🛒"
                          className="w-full text-center px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-base focus:border-[#E0B441]"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <label className="text-[10px] text-gray-400 block mb-1">Nombre Comercial *</label>
                        <input
                          type="text"
                          required
                          value={newStoreName}
                          onChange={(e) => setNewStoreName(e.target.value)}
                          placeholder="Ej. Costco Polanco, City Market..."
                          className="w-full px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs sm:text-sm focus:border-[#E0B441]"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="text-[10px] text-gray-400 block mb-1">Giro / Tipo de Tienda</label>
                        <input
                          type="text"
                          value={newStoreCategory}
                          onChange={(e) => setNewStoreCategory(e.target.value)}
                          placeholder="Ej. Club de Precios, Gourmet..."
                          className="w-full px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs sm:text-sm focus:border-[#E0B441]"
                        />
                      </div>
                    </div>

                    {/* Quick Emojis */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      <span className="text-[10px] text-gray-500 shrink-0">Emojis sugeridos:</span>
                      {STORE_EMOJIS.map(em => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setNewStoreIcon(em)}
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs shrink-0 cursor-pointer"
                        >
                          {em}
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E0B441] text-[#12100E] font-bold text-xs hover:brightness-110 shadow-md cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Guardar Tienda</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Grid de Tiendas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredStores.map((s) => {
                  const isEditing = editingItem?.type === 'stores' && editingItem?.id === s.id;

                  if (isEditing) {
                    return (
                      <div key={s.id} className="p-3.5 rounded-2xl bg-[#1E1915] border-2 border-[#E0B441] shadow-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#E0B441] uppercase tracking-wide">Editar Tienda</span>
                          <button 
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="text-gray-400 hover:text-white text-xs"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              maxLength={3}
                              value={editingItem.data.icon}
                              onChange={(e) => setEditingItem({
                                ...editingItem,
                                data: { ...editingItem.data, icon: e.target.value }
                              })}
                              className="w-full text-center px-2 py-1.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-base"
                            />
                          </div>
                          <div className="sm:col-span-9">
                            <input
                              type="text"
                              required
                              value={editingItem.data.name}
                              onChange={(e) => setEditingItem({
                                ...editingItem,
                                data: { ...editingItem.data, name: e.target.value }
                              })}
                              className="w-full px-3 py-1.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs font-bold"
                              placeholder="Nombre comercial"
                            />
                          </div>
                        </div>
                        <input
                          type="text"
                          value={editingItem.data.category}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            data: { ...editingItem.data, category: e.target.value }
                          })}
                          className="w-full px-3 py-1.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs"
                          placeholder="Giro (ej. Gourmet, Carnicería)"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="px-3 py-1 rounded-xl text-xs text-gray-400 hover:text-white"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditStore(s.id)}
                            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:brightness-110"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Guardar Cambios</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={s.id}
                      className="p-3 sm:p-3.5 rounded-2xl bg-[#181411] border border-[#2A2521] flex items-center justify-between gap-3 group hover:border-[#3D3630] transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl sm:text-2xl shrink-0">{s.icon || '🏪'}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-bold text-white truncate">
                              {s.name}
                            </span>
                            {s.isDefault && (
                              <span className="px-1.5 py-0.5 rounded-full bg-[#E0B441]/20 text-[#E0B441] text-[9px] font-bold shrink-0">
                                Favorita
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#8B8378] block truncate">
                            {s.category || 'Supermercado'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!s.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultStore(s.id)}
                            className="p-1.5 sm:p-2 rounded-lg text-[#8B8378] hover:text-[#E0B441] hover:bg-white/5 transition-colors cursor-pointer"
                            title="Establecer como favorita predeterminada"
                          >
                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            audio.click();
                            setEditingItem({
                              type: 'stores',
                              id: s.id,
                              data: { name: s.name, category: s.category || '', icon: s.icon || '🏪' }
                            });
                          }}
                          className="p-1.5 sm:p-2 rounded-lg text-[#8B8378] hover:text-[#E0B441] hover:bg-white/5 transition-colors cursor-pointer"
                          title="Editar tienda"
                        >
                          <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStore(s.id)}
                          className="p-1.5 sm:p-2 rounded-lg text-[#8B8378] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Eliminar del catálogo"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredStores.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-xs sm:text-sm">
                  No se encontraron tiendas que coincidan con la búsqueda.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PERSONAL & FAMILIARES */}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              {showAddForm && (
                <div className="p-4 rounded-2xl bg-[#1C1814] border border-[#E0B441]/40 shadow-lg animate-fade-in">
                  <h4 className="text-xs font-bold text-[#E0B441] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Personal o Familiar</span>
                  </h4>
                  <form onSubmit={handleAddStaff} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-gray-400 block mb-1">Ícono</label>
                        <input
                          type="text"
                          maxLength={3}
                          value={newStaffIcon}
                          onChange={(e) => setNewStaffIcon(e.target.value)}
                          placeholder="👤"
                          className="w-full text-center px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-base focus:border-[#E0B441]"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <label className="text-[10px] text-gray-400 block mb-1">Nombre Completo *</label>
                        <input
                          type="text"
                          required
                          value={newStaffName}
                          onChange={(e) => setNewStaffName(e.target.value)}
                          placeholder="Ej. Lupita, Chef Carlos, Chofer..."
                          className="w-full px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs sm:text-sm focus:border-[#E0B441]"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="text-[10px] text-gray-400 block mb-1">Puesto o Rol</label>
                        <input
                          type="text"
                          value={newStaffRole}
                          onChange={(e) => setNewStaffRole(e.target.value)}
                          placeholder="Ej. Ama de Llaves, Cocinera Mayor..."
                          className="w-full px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs sm:text-sm focus:border-[#E0B441]"
                        />
                      </div>
                    </div>

                    {/* Quick Emojis */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      <span className="text-[10px] text-gray-500 shrink-0">Emojis sugeridos:</span>
                      {STAFF_EMOJIS.map(em => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setNewStaffIcon(em)}
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs shrink-0 cursor-pointer"
                        >
                          {em}
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E0B441] text-[#12100E] font-bold text-xs hover:brightness-110 shadow-md cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Guardar Persona</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Grid de Personal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredStaff.map((s) => {
                  const isEditing = editingItem?.type === 'staff' && editingItem?.id === s.id;

                  if (isEditing) {
                    return (
                      <div key={s.id} className="p-3.5 rounded-2xl bg-[#1E1915] border-2 border-[#E0B441] shadow-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#E0B441] uppercase tracking-wide">Editar Personal</span>
                          <button 
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="text-gray-400 hover:text-white text-xs"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              maxLength={3}
                              value={editingItem.data.icon}
                              onChange={(e) => setEditingItem({
                                ...editingItem,
                                data: { ...editingItem.data, icon: e.target.value }
                              })}
                              className="w-full text-center px-2 py-1.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-base"
                            />
                          </div>
                          <div className="sm:col-span-9">
                            <input
                              type="text"
                              required
                              value={editingItem.data.name}
                              onChange={(e) => setEditingItem({
                                ...editingItem,
                                data: { ...editingItem.data, name: e.target.value }
                              })}
                              className="w-full px-3 py-1.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs font-bold"
                              placeholder="Nombre"
                            />
                          </div>
                        </div>
                        <input
                          type="text"
                          value={editingItem.data.role}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            data: { ...editingItem.data, role: e.target.value }
                          })}
                          className="w-full px-3 py-1.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs"
                          placeholder="Puesto o Rol"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="px-3 py-1 rounded-xl text-xs text-gray-400 hover:text-white"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditStaff(s.id)}
                            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:brightness-110"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Guardar Cambios</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={s.id}
                      className="p-3 sm:p-3.5 rounded-2xl bg-[#181411] border border-[#2A2521] flex items-center justify-between gap-3 group hover:border-[#3D3630] transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl sm:text-2xl shrink-0">{s.icon || '👤'}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-bold text-white truncate">
                              {s.name}
                            </span>
                            {s.isDefault && (
                              <span className="px-1.5 py-0.5 rounded-full bg-[#E0B441]/20 text-[#E0B441] text-[9px] font-bold shrink-0">
                                Predeterminado
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#8B8378] block truncate">
                            {s.role || 'Personal de Servicio'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!s.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultStaff(s.id)}
                            className="p-1.5 sm:p-2 rounded-lg text-[#8B8378] hover:text-[#E0B441] hover:bg-white/5 transition-colors cursor-pointer"
                            title="Establecer como responsable predeterminado"
                          >
                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            audio.click();
                            setEditingItem({
                              type: 'staff',
                              id: s.id,
                              data: { name: s.name, role: s.role || '', icon: s.icon || '👤' }
                            });
                          }}
                          className="p-1.5 sm:p-2 rounded-lg text-[#8B8378] hover:text-[#E0B441] hover:bg-white/5 transition-colors cursor-pointer"
                          title="Editar datos de personal"
                        >
                          <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(s.id)}
                          className="p-1.5 sm:p-2 rounded-lg text-[#8B8378] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Eliminar persona del catálogo"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredStaff.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-xs sm:text-sm">
                  No se encontró personal que coincida con la búsqueda.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CATEGORÍAS */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              {showAddForm && (
                <div className="p-4 rounded-2xl bg-[#1C1814] border border-[#E0B441]/40 shadow-lg animate-fade-in">
                  <h4 className="text-xs font-bold text-[#E0B441] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Nueva Categoría</span>
                  </h4>
                  <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Ej. Congelados Especiales, Panadería Kosher, Café de Origen..."
                      className="flex-1 px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs sm:text-sm focus:border-[#E0B441]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E0B441] text-[#12100E] font-bold text-xs hover:brightness-110 shadow-md cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Guardar</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Grid de Categorías */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5">
                {filteredCategories.map((c) => {
                  const isEditing = editingItem?.type === 'categories' && editingItem?.id === c;

                  if (isEditing) {
                    return (
                      <div key={c} className="p-2.5 rounded-xl bg-[#1E1915] border-2 border-[#E0B441] shadow-lg flex items-center gap-2">
                        <input
                          type="text"
                          required
                          value={editingItem.data.name}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            data: { ...editingItem.data, name: e.target.value }
                          })}
                          className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-[#12100E] border border-[#2A2521] text-white font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditCategory(c)}
                          className="p-1 rounded bg-emerald-500 text-black font-bold"
                          title="Guardar"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingItem(null)}
                          className="p-1 rounded text-gray-400 hover:text-white"
                          title="Cancelar"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={c}
                      className="p-2.5 sm:p-3 rounded-xl bg-[#181411] border border-[#2A2521] flex items-center justify-between text-xs sm:text-sm text-white group hover:border-[#3D3630] transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-[#E0B441]/70 shrink-0" />
                        <span className="truncate font-medium">{c}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            audio.click();
                            setEditingItem({
                              type: 'categories',
                              id: c,
                              data: { name: c }
                            });
                          }}
                          className="p-1 sm:p-1.5 rounded text-[#8B8378] hover:text-[#E0B441] hover:bg-white/5 transition-colors cursor-pointer"
                          title="Editar nombre de categoría"
                        >
                          <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c)}
                          className="p-1 sm:p-1.5 rounded text-[#8B8378] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredCategories.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-xs sm:text-sm">
                  No se encontraron categorías que coincidan con la búsqueda.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: UNIDADES DE MEDIDA */}
          {activeTab === 'units' && (
            <div className="space-y-4">
              {showAddForm && (
                <div className="p-4 rounded-2xl bg-[#1C1814] border border-[#E0B441]/40 shadow-lg animate-fade-in">
                  <h4 className="text-xs font-bold text-[#E0B441] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Nueva Unidad de Medida</span>
                  </h4>
                  <form onSubmit={handleAddUnit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Abreviatura / Clave *</label>
                        <input
                          type="text"
                          required
                          value={newUnitId}
                          onChange={(e) => setNewUnitId(e.target.value)}
                          placeholder="ej. cubeta, rollo, atado..."
                          className="w-full px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs sm:text-sm focus:border-[#E0B441]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Nombre Descriptivo *</label>
                        <input
                          type="text"
                          required
                          value={newUnitLabel}
                          onChange={(e) => setNewUnitLabel(e.target.value)}
                          placeholder="ej. Cubetas (cbt), Rollos (rll)..."
                          className="w-full px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs sm:text-sm focus:border-[#E0B441]"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E0B441] text-[#12100E] font-bold text-xs hover:brightness-110 shadow-md cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Guardar Unidad</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Grid de Unidades */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5">
                {filteredUnits.map((u) => {
                  const isEditing = editingItem?.type === 'units' && editingItem?.id === u.id;

                  if (isEditing) {
                    return (
                      <div key={u.id} className="p-2.5 rounded-xl bg-[#1E1915] border-2 border-[#E0B441] shadow-lg space-y-2">
                        <input
                          type="text"
                          required
                          value={editingItem.data.label}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            data: { ...editingItem.data, label: e.target.value }
                          })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg bg-[#12100E] border border-[#2A2521] text-white font-bold"
                          placeholder="Nombre descriptivo"
                        />
                        <input
                          type="text"
                          value={editingItem.data.short}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            data: { ...editingItem.data, short: e.target.value }
                          })}
                          className="w-full px-2.5 py-1 text-xs rounded-lg bg-[#12100E] border border-[#2A2521] text-white"
                          placeholder="Abreviatura"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="px-2 py-0.5 text-xs text-gray-400"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditUnit(u.id)}
                            className="px-2 py-0.5 rounded bg-emerald-500 text-black font-bold text-xs"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={u.id}
                      className="p-2.5 sm:p-3 rounded-xl bg-[#181411] border border-[#2A2521] flex items-center justify-between text-xs sm:text-sm text-white group hover:border-[#3D3630] transition-all"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{u.label}</div>
                        <span className="text-[10px] text-[#8B8378] font-mono">ID: {u.id}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            audio.click();
                            setEditingItem({
                              type: 'units',
                              id: u.id,
                              data: { label: u.label, short: u.short || u.id }
                            });
                          }}
                          className="p-1 sm:p-1.5 rounded text-[#8B8378] hover:text-[#E0B441] hover:bg-white/5 transition-colors cursor-pointer"
                          title="Editar unidad"
                        >
                          <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUnit(u.id)}
                          className="p-1 sm:p-1.5 rounded text-[#8B8378] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Eliminar unidad"
                        >
                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredUnits.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-xs sm:text-sm">
                  No se encontraron unidades que coincidan con la búsqueda.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Responsivo y Limpio */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 border-t border-[#2A2521] bg-[#1C1814] shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#8B8378] hover:text-[#E0B441] hover:bg-white/5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer Valores de Fábrica</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#E0B441] text-[#12100E] font-bold text-xs sm:text-sm hover:brightness-110 shadow-md shadow-[#E0B441]/20 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Listo, Opciones Actualizadas</span>
          </button>
        </div>

      </div>
    </div>
  );
}
