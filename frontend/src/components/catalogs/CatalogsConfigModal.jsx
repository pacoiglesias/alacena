import React, { useState } from 'react';
import { 
  X, Check, Store, Users, Tag, Scale, Plus, Trash2, 
  Sparkles, Star, AlertCircle, RefreshCw, ShoppingCart, UserCheck
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { 
  getCatalogs, saveCatalogs, DEFAULT_STORES, DEFAULT_STAFF, 
  DEFAULT_CATEGORIES, DEFAULT_UNITS 
} from '../../services/catalogsService';

export default function CatalogsConfigModal({ isOpen, onClose, onCatalogsUpdated }) {
  const [activeTab, setActiveTab] = useState('stores'); // 'stores' | 'staff' | 'categories' | 'units'
  const [catalogs, setCatalogs] = useState(() => getCatalogs());

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
    if (!catalogs.categories.includes(trimmed)) {
      const updated = {
        ...catalogs,
        categories: [...catalogs.categories, trimmed],
      };
      handleUpdate(updated);
    }
    setNewCategoryName('');
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
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#14110F] border border-[#E0B441]/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2A2521] bg-[#1C1814]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#E0B441]/15 text-[#E0B441] border border-[#E0B441]/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-bold text-[#F2EDE4] flex items-center gap-2">
                <span>Catálogos & Opciones Desplegables del Sistema</span>
                <span className="px-2 py-0.5 rounded-full bg-[#E0B441]/20 text-[#E0B441] text-[10px] font-mono font-bold">
                  Proactivo
                </span>
              </h2>
              <p className="text-xs text-[#B8AFA3] mt-0.5">
                Configura tiendas de compra habitual, personal que registra, categorías y unidades
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="p-2 rounded-xl text-[#B8AFA3] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-[#2A2521] bg-[#181411] overflow-x-auto no-scrollbar">
          <button
            onClick={() => { audio.click(); setActiveTab('stores'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'stores'
                ? 'bg-[#E0B441] text-[#12100E] font-bold shadow-md shadow-[#E0B441]/20'
                : 'text-[#B8AFA3] hover:text-white hover:bg-white/5'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>🏪 Tiendas ({catalogs.stores.length})</span>
          </button>

          <button
            onClick={() => { audio.click(); setActiveTab('staff'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'staff'
                ? 'bg-[#E0B441] text-[#12100E] font-bold shadow-md shadow-[#E0B441]/20'
                : 'text-[#B8AFA3] hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👤 Registrado por / Personal ({catalogs.staff.length})</span>
          </button>

          <button
            onClick={() => { audio.click(); setActiveTab('categories'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'categories'
                ? 'bg-[#E0B441] text-[#12100E] font-bold shadow-md shadow-[#E0B441]/20'
                : 'text-[#B8AFA3] hover:text-white hover:bg-white/5'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>🏷️ Categorías ({catalogs.categories.length})</span>
          </button>

          <button
            onClick={() => { audio.click(); setActiveTab('units'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'units'
                ? 'bg-[#E0B441] text-[#12100E] font-bold shadow-md shadow-[#E0B441]/20'
                : 'text-[#B8AFA3] hover:text-white hover:bg-white/5'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>⚖️ Unidades ({catalogs.units.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* TAB 1: TIENDAS */}
          {activeTab === 'stores' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#1C1814] border border-[#2A2521]">
                <h4 className="text-xs font-bold text-[#E0B441] uppercase tracking-wider mb-2">
                  ➕ Agregar Nueva Tienda o Proveedor Habitual
                </h4>
                <form onSubmit={handleAddStore} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      maxLength={2}
                      value={newStoreIcon}
                      onChange={(e) => setNewStoreIcon(e.target.value)}
                      placeholder="🛒"
                      className="w-full text-center px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-base focus:border-[#E0B441]"
                      title="Ícono o emoji"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      required
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                      placeholder="Nombre (ej. Costco, Mercado San Juan...)"
                      className="w-full px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs sm:text-sm focus:border-[#E0B441]"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={newStoreCategory}
                      onChange={(e) => setNewStoreCategory(e.target.value)}
                      placeholder="Tipo (ej. Club de Precios)"
                      className="w-full px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs sm:text-sm focus:border-[#E0B441]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="w-full h-full flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-[#E0B441] text-[#12100E] font-bold text-xs hover:brightness-110 shadow-md shadow-[#E0B441]/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {catalogs.stores.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-2xl bg-[#181411] border border-[#2A2521] flex items-center justify-between gap-3 group hover:border-[#3D3630] transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{s.icon || '🏪'}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-white truncate">
                            {s.name}
                          </span>
                          {s.isDefault && (
                            <span className="px-1.5 py-0.2 rounded-full bg-[#E0B441]/20 text-[#E0B441] text-[9px] font-bold">
                              Predeterminada
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
                          onClick={() => handleSetDefaultStore(s.id)}
                          className="p-1.5 rounded-lg text-[#8B8378] hover:text-[#E0B441] hover:bg-white/5 transition-colors"
                          title="Establecer como tienda favorita/predeterminada"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteStore(s.id)}
                        className="p-1.5 rounded-lg text-[#8B8378] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Eliminar tienda del catálogo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PERSONAL / REGISTRADO POR */}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#1C1814] border border-[#2A2521]">
                <h4 className="text-xs font-bold text-[#E0B441] uppercase tracking-wider mb-2">
                  ➕ Agregar Personal o Familiar ("Registrado por")
                </h4>
                <form onSubmit={handleAddStaff} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      maxLength={2}
                      value={newStaffIcon}
                      onChange={(e) => setNewStaffIcon(e.target.value)}
                      placeholder="👤"
                      className="w-full text-center px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-base focus:border-[#E0B441]"
                      title="Ícono o emoji"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      required
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="Nombre (ej. Lupita, Chofer Juan...)"
                      className="w-full px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs sm:text-sm focus:border-[#E0B441]"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      placeholder="Puesto (ej. Ama de Llaves)"
                      className="w-full px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs sm:text-sm focus:border-[#E0B441]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="w-full h-full flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-[#E0B441] text-[#12100E] font-bold text-xs hover:brightness-110 shadow-md shadow-[#E0B441]/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {catalogs.staff.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-2xl bg-[#181411] border border-[#2A2521] flex items-center justify-between gap-3 group hover:border-[#3D3630] transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{s.icon || '👤'}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-white truncate">
                            {s.name}
                          </span>
                          {s.isDefault && (
                            <span className="px-1.5 py-0.2 rounded-full bg-[#E0B441]/20 text-[#E0B441] text-[9px] font-bold">
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
                          onClick={() => handleSetDefaultStaff(s.id)}
                          className="p-1.5 rounded-lg text-[#8B8378] hover:text-[#E0B441] hover:bg-white/5 transition-colors"
                          title="Establecer como persona predeterminada para registros"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteStaff(s.id)}
                        className="p-1.5 rounded-lg text-[#8B8378] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Eliminar persona del catálogo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORÍAS */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#1C1814] border border-[#2A2521]">
                <h4 className="text-xs font-bold text-[#E0B441] uppercase tracking-wider mb-2">
                  ➕ Agregar Nueva Categoría
                </h4>
                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ej. Congelados Especiales, Mascotas..."
                    className="flex-1 px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs sm:text-sm focus:border-[#E0B441]"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#E0B441] text-[#12100E] font-bold text-xs hover:brightness-110 shadow-md shadow-[#E0B441]/20 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {catalogs.categories.map((c) => (
                  <div
                    key={c}
                    className="p-2.5 rounded-xl bg-[#181411] border border-[#2A2521] flex items-center justify-between text-xs text-white"
                  >
                    <span className="truncate">{c}</span>
                    <button
                      onClick={() => handleDeleteCategory(c)}
                      className="p-1 rounded text-[#8B8378] hover:text-rose-400"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: UNIDADES */}
          {activeTab === 'units' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#1C1814] border border-[#2A2521]">
                <h4 className="text-xs font-bold text-[#E0B441] uppercase tracking-wider mb-2">
                  ➕ Agregar Nueva Unidad de Medida
                </h4>
                <form onSubmit={handleAddUnit} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={newUnitId}
                    onChange={(e) => setNewUnitId(e.target.value)}
                    placeholder="Abreviatura (ej. rollo, cubeta)"
                    className="px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs sm:text-sm focus:border-[#E0B441]"
                  />
                  <input
                    type="text"
                    required
                    value={newUnitLabel}
                    onChange={(e) => setNewUnitLabel(e.target.value)}
                    placeholder="Nombre completo (ej. Rollos (rll))"
                    className="px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs sm:text-sm focus:border-[#E0B441]"
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-[#E0B441] text-[#12100E] font-bold text-xs hover:brightness-110 shadow-md shadow-[#E0B441]/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Unidad</span>
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {catalogs.units.map((u) => (
                  <div
                    key={u.id}
                    className="p-2.5 rounded-xl bg-[#181411] border border-[#2A2521] flex items-center justify-between text-xs text-white"
                  >
                    <span className="truncate">{u.label}</span>
                    <button
                      onClick={() => handleDeleteUnit(u.id)}
                      className="p-1 rounded text-[#8B8378] hover:text-rose-400"
                      title="Eliminar unidad"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#2A2521] bg-[#1C1814]">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#8B8378] hover:text-[#E0B441] hover:bg-white/5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer Originales</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E0B441] text-[#12100E] font-bold text-xs sm:text-sm hover:brightness-110 shadow-md shadow-[#E0B441]/20"
          >
            <Check className="w-4 h-4" />
            <span>Listo, Opciones Actualizadas</span>
          </button>
        </div>

      </div>
    </div>
  );
}
