import React, { useState, useEffect } from 'react';
import { 
  X, Check, DollarSign, MapPin, Tag, Box, UserCheck, Store, 
  AlertCircle, QrCode, Sparkles, Printer, Calendar, Trash2, 
  Plus, Settings, Star
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { audio } from '../../services/audioService';
import { getCatalogs, addCustomStore, addCustomStaff } from '../../services/catalogsService';

export default function ManualProductModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  onOpenCatalogs,
  zones = [], 
  staffList = [], 
  initialProduct,
  activeHouse
}) {
  const [catalogs, setCatalogs] = useState(() => getCatalogs());
  const [name, setName] = useState('');
  const [zone, setZone] = useState('');
  const [category, setCategory] = useState('Abarrotes');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('kg');
  const [minStock, setMinStock] = useState(2);
  const [maxStock, setMaxStock] = useState(6);
  const [unitPriceMxn, setUnitPriceMxn] = useState(0);
  const [store, setStore] = useState('Costco Wholesale');
  const [staff, setStaff] = useState('');
  const [barcode, setBarcode] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showQrPreview, setShowQrPreview] = useState(false);

  // Inline quick adds
  const [isAddingQuickStore, setIsAddingQuickStore] = useState(false);
  const [quickStoreInput, setQuickStoreInput] = useState('');
  const [isAddingQuickStaff, setIsAddingQuickStaff] = useState(false);
  const [quickStaffInput, setQuickStaffInput] = useState('');

  // Reload catalogs when opened or updated
  useEffect(() => {
    if (isOpen) {
      const current = getCatalogs();
      setCatalogs(current);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleCatalogsUpdate = (e) => {
      if (e.detail) setCatalogs(e.detail);
    };
    window.addEventListener('alacena_catalogs_updated', handleCatalogsUpdate);
    return () => window.removeEventListener('alacena_catalogs_updated', handleCatalogsUpdate);
  }, []);

  const effectiveStaffList = catalogs.staff.length > 0 ? catalogs.staff : staffList;
  const effectiveStores = catalogs.stores.length > 0 ? catalogs.stores : [
    { id: 'st-1', name: 'Costco Wholesale' },
    { id: 'st-2', name: 'City Market' },
    { id: 'st-3', name: 'Chedraui Selecto' },
  ];
  const effectiveCategories = catalogs.categories || [
    'Abarrotes', 'Carnes & Proteínas', 'Lácteos & Quesos', 'Vinos & Licores', 'Limpieza & Hogar'
  ];
  const effectiveUnits = catalogs.units || [
    { id: 'kg', label: 'Kilogramos (kg)' },
    { id: 'piezas', label: 'Piezas (pza)' },
    { id: 'litros', label: 'Litros (L)' }
  ];

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name || '');
      setZone(initialProduct.zone || (zones[0]?.name || 'Alacena Principal'));
      setCategory(initialProduct.category || 'Abarrotes');
      setQuantity(initialProduct.quantity || 1);
      setUnit(initialProduct.unit || 'kg');
      setMinStock(initialProduct.minStock ?? 2);
      setMaxStock(initialProduct.maxStock ?? initialProduct.idealStock ?? 6);
      setUnitPriceMxn(initialProduct.unitPriceMxn || 0);
      setStore(initialProduct.store || 'Costco Wholesale');
      setStaff(initialProduct.lastLoggedBy || (effectiveStaffList[0]?.name || 'María (Jefa de Cocina)'));
      setBarcode(initialProduct.barcode || `ALC-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`);
      setExpiryDate(initialProduct.expiryDate || '');
    } else {
      setName('');
      setZone(zones[0]?.name || 'Alacena Principal');
      setCategory('Abarrotes');
      setQuantity(1);
      setUnit('kg');
      setMinStock(2);
      setMaxStock(6);
      setUnitPriceMxn(0);
      setStore('Costco Wholesale');
      setStaff(effectiveStaffList[0]?.name || 'María (Jefa de Cocina)');
      setBarcode(`ALC-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`);
      setExpiryDate('');
    }
  }, [initialProduct, isOpen, zones, catalogs]);

  if (!isOpen) return null;

  const activeBarcode = barcode || `ALC-${Date.now().toString(36).toUpperCase()}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    audio.success();

    const productPayload = {
      id: initialProduct?.id || `prod-${Date.now()}`,
      name: name.trim(),
      zone: zone || zones[0]?.name || 'Alacena Principal',
      category: category || 'Abarrotes',
      quantity: parseFloat(quantity) || 0,
      unit,
      minStock: parseFloat(minStock) || 0,
      maxStock: parseFloat(maxStock) || 6,
      idealStock: parseFloat(maxStock) || 6,
      unitPriceMxn: parseFloat(unitPriceMxn) || 0,
      store: store.trim() || 'Costco Wholesale',
      lastLoggedBy: staff || effectiveStaffList[0]?.name || 'Administrador General',
      barcode: activeBarcode,
      expiryDate: expiryDate || null,
      updatedAt: new Date().toISOString(),
    };

    onSave(productPayload);
    onClose();
  };

  const handleSaveQuickStore = (e) => {
    e.preventDefault();
    if (!quickStoreInput.trim()) return;
    const added = addCustomStore(quickStoreInput.trim());
    if (added) {
      setStore(added.name);
      audio.success();
    }
    setQuickStoreInput('');
    setIsAddingQuickStore(false);
  };

  const handleSaveQuickStaff = (e) => {
    e.preventDefault();
    if (!quickStaffInput.trim()) return;
    const added = addCustomStaff(quickStaffInput.trim());
    if (added) {
      setStaff(added.name);
      audio.success();
    }
    setQuickStaffInput('');
    setIsAddingQuickStaff(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#14110F] border border-[#2A2521] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2A2521] bg-[#1C1814]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#C8542A]/20 to-[#E0B441]/20 text-[#E0B441] border border-[#E0B441]/30">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-bold text-[#F2EDE4]">
                {initialProduct ? 'Editar Insumo de la Alacena' : 'Registrar Nuevo Insumo'}
              </h2>
              <p className="text-xs text-[#B8AFA3] mt-0.5">
                {initialProduct ? 'Modifica detalles, existencias, tienda o elimina' : 'Genera un nuevo artículo con código QR único para botes, sobres o latas'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Nombre y Código de Barra */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#B8AFA3] uppercase tracking-wider">
              Nombre del Insumo / Producto *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Arroz Basmati de la India, Leche Entera, Sal de Mar..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-sm focus:outline-none focus:border-[#E0B441]"
            />
          </div>

          {/* Zona y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#B8AFA3] uppercase tracking-wider mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#E0B441]" />
                <span>Zona / Almacén Físico</span>
              </label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-sm focus:outline-none focus:border-[#E0B441]"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.name}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center justify-between text-xs font-bold text-[#B8AFA3] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#E0B441]" />
                  <span>Categoría</span>
                </span>
                {onOpenCatalogs && (
                  <button
                    type="button"
                    onClick={() => { audio.click(); onOpenCatalogs(); }}
                    className="text-[10px] text-[#E0B441] hover:underline flex items-center gap-1 font-mono"
                  >
                    <Settings className="w-2.5 h-2.5" />
                    <span>Gestionar</span>
                  </button>
                )}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-sm focus:outline-none focus:border-[#E0B441]"
              >
                {effectiveCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Existencia Actual y Unidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#B8AFA3] uppercase tracking-wider mb-1.5">
                Existencia Actual en Casa *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white font-mono text-sm focus:outline-none focus:border-[#E0B441]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#B8AFA3] uppercase tracking-wider mb-1.5">
                Unidad de Medida
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-sm focus:outline-none focus:border-[#E0B441]"
              >
                {effectiveUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mínimo, Máximo y Precio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#B8AFA3] uppercase tracking-wider mb-1.5">
                Stock Mínimo (Alerta)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white font-mono text-xs focus:outline-none focus:border-[#E0B441]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#B8AFA3] uppercase tracking-wider mb-1.5">
                Capacidad Máxima
              </label>
              <input
                type="number"
                step="any"
                min="1"
                value={maxStock}
                onChange={(e) => setMaxStock(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white font-mono text-xs focus:outline-none focus:border-[#E0B441]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#B8AFA3] uppercase tracking-wider mb-1.5">
                Costo Unitario ({activeHouse?.currency === 'EUR' ? '€ EUR' : '$ MXN'})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[#8B8378] text-xs font-mono">
                  {activeHouse?.currency === 'EUR' ? '€' : '$'}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={unitPriceMxn}
                  onChange={(e) => setUnitPriceMxn(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white font-mono text-xs focus:outline-none focus:border-[#E0B441]"
                />
              </div>
            </div>
          </div>

          {/* Fecha de Caducidad y Código de Barras */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#B8AFA3] uppercase tracking-wider mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#E0B441]" />
                <span>Fecha de Caducidad (FEFO)</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-sm focus:outline-none focus:border-[#E0B441]"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#B8AFA3] uppercase tracking-wider mb-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#E0B441]" />
                <span>Código Identificador Único</span>
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-[#E0B441] font-mono text-xs focus:outline-none focus:border-[#E0B441]"
              />
            </div>
          </div>

          {/* SECCIÓN PROACTIVA: TIENDA DE COMPRA HABITUAL */}
          <div className="p-3.5 rounded-2xl bg-[#181411] border border-[#2A2521] space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#E0B441] uppercase tracking-wider">
                <Store className="w-3.5 h-3.5 text-[#E0B441]" />
                <span>Tienda de Compra Habitual</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingQuickStore(!isAddingQuickStore)}
                  className="text-[10px] text-[#E0B441] hover:underline flex items-center gap-1 font-mono font-bold"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isAddingQuickStore ? 'Cerrar' : '+ Nueva Tienda'}</span>
                </button>
                {onOpenCatalogs && (
                  <button
                    type="button"
                    onClick={() => { audio.click(); onOpenCatalogs(); }}
                    className="p-1 rounded text-[#8B8378] hover:text-[#E0B441]"
                    title="Configurar catálogo de tiendas"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Chips de selección rápida de 1 toque */}
            <div className="flex flex-wrap gap-1.5">
              {effectiveStores.slice(0, 5).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => { audio.click(); setStore(st.name); }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                    store === st.name
                      ? 'bg-[#E0B441] text-[#12100E] font-bold shadow-sm'
                      : 'bg-[#12100E] text-[#B8AFA3] hover:text-white border border-[#2A2521]'
                  }`}
                >
                  <span>{st.icon || '🏪'}</span>
                  <span>{st.name}</span>
                </button>
              ))}
            </div>

            {/* Input con Datalist para escribir o seleccionar cualquiera */}
            <div className="relative">
              <input
                type="text"
                list="stores-datalist"
                placeholder="Escribe o selecciona (ej. Costco, City Market...)"
                value={store}
                onChange={(e) => setStore(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs sm:text-sm focus:outline-none focus:border-[#E0B441]"
              />
              <datalist id="stores-datalist">
                {effectiveStores.map((st) => (
                  <option key={st.id} value={st.name} />
                ))}
              </datalist>
            </div>

            {/* Formulario rápido para agregar nueva tienda si hace clic en + Nueva Tienda */}
            {isAddingQuickStore && (
              <div className="pt-2 border-t border-[#2A2521] flex gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Nombre de la nueva tienda (ej. La Comer, Carnicería Don Pepe)"
                  value={quickStoreInput}
                  onChange={(e) => setQuickStoreInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#12100E] border border-[#E0B441]/40 text-white text-xs"
                />
                <button
                  type="button"
                  onClick={handleSaveQuickStore}
                  className="px-3 py-1.5 rounded-xl bg-[#E0B441] text-[#12100E] text-xs font-bold"
                >
                  Guardar Tienda
                </button>
              </div>
            )}
          </div>

          {/* SECCIÓN PROACTIVA: REGISTRADO POR */}
          <div className="p-3.5 rounded-2xl bg-[#181411] border border-[#2A2521] space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#E0B441] uppercase tracking-wider">
                <UserCheck className="w-3.5 h-3.5 text-[#E0B441]" />
                <span>Registrado por</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingQuickStaff(!isAddingQuickStaff)}
                  className="text-[10px] text-[#E0B441] hover:underline flex items-center gap-1 font-mono font-bold"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isAddingQuickStaff ? 'Cerrar' : '+ Agregar Persona'}</span>
                </button>
                {onOpenCatalogs && (
                  <button
                    type="button"
                    onClick={() => { audio.click(); onOpenCatalogs(); }}
                    className="p-1 rounded text-[#8B8378] hover:text-[#E0B441]"
                    title="Configurar catálogo de personal"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Chips de selección rápida de personal */}
            <div className="flex flex-wrap gap-1.5">
              {effectiveStaffList.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => { audio.click(); setStaff(st.name); }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                    staff === st.name
                      ? 'bg-[#E0B441] text-[#12100E] font-bold shadow-sm'
                      : 'bg-[#12100E] text-[#B8AFA3] hover:text-white border border-[#2A2521]'
                  }`}
                >
                  <span>{st.icon || '👤'}</span>
                  <span>{st.name}</span>
                </button>
              ))}
            </div>

            <select
              value={staff}
              onChange={(e) => setStaff(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs sm:text-sm focus:outline-none focus:border-[#E0B441]"
            >
              {effectiveStaffList.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.icon ? `${s.icon} ` : ''}{s.name} ({s.role || 'Personal'})
                </option>
              ))}
            </select>

            {/* Formulario rápido para agregar nueva persona si hace clic en + Agregar Persona */}
            {isAddingQuickStaff && (
              <div className="pt-2 border-t border-[#2A2521] flex gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Nombre de la persona (ej. Chofer Pedro, Chef Invitado)"
                  value={quickStaffInput}
                  onChange={(e) => setQuickStaffInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#12100E] border border-[#E0B441]/40 text-white text-xs"
                />
                <button
                  type="button"
                  onClick={handleSaveQuickStaff}
                  className="px-3 py-1.5 rounded-xl bg-[#E0B441] text-[#12100E] text-xs font-bold"
                >
                  Guardar Persona
                </button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-between gap-3 border-t border-[#2A2521]">
            
            {/* BOTÓN ELIMINAR ARTÍCULO (SOLICITADO POR EL USUARIO) */}
            {initialProduct && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  audio.click();
                  if (confirm(`¿Estás seguro de que deseas eliminar permanentemente "${initialProduct.name}" del inventario de la alacena?`)) {
                    onDelete(initialProduct.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-xl transition-all border border-rose-500/30"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Producto</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  audio.click();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-[#B8AFA3] hover:text-white rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#C8542A] to-[#E0B441] hover:brightness-110 rounded-xl transition-all shadow-md shadow-[#C8542A]/20"
              >
                <Check className="w-4 h-4" />
                <span>{initialProduct ? 'Guardar Cambios' : 'Guardar con QR Único'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
