import React, { useState, useEffect } from 'react';
import { 
  X, Check, MapPin, Tag, Box, UserCheck, Store, 
  QrCode, Calendar, Trash2, 
  Plus, Settings, Camera
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { getCatalogs, addCustomStore, addCustomStaff } from '../../services/catalogsService';
import { isCavaZone } from '../../utils/cavaGuard';
import { confirmDialog } from '../../services/notice';
import { normalizeLots, totalLotsQuantity } from '../../utils/productLots';

// Última zona usada en altas (la comparte el escáner, misma clave).
export const LAST_ZONE_KEY = 'alacena:scan_target_zone';
export function lastUsedZone(zones = []) {
  try {
    const saved = window.localStorage.getItem(LAST_ZONE_KEY);
    if (saved && zones.some((z) => z.name === saved)) return saved;
  } catch (_) { /* sin almacenamiento: se usa la primera zona */ }
  return '';
}

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
  const [photo, setPhoto] = useState('');
  // Lotes por caducidad (3.11.0): [{ expiryDate, quantity }]
  const [lots, setLots] = useState([]);
  // «Guardar y siguiente»: contador de altas encadenadas de esta sesión
  const [savedNextCount, setSavedNextCount] = useState(0);
  const saveAndNextRef = React.useRef(false);

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
      setLots(Array.isArray(initialProduct.lots) ? initialProduct.lots.map((l) => ({ expiryDate: l.expiryDate || '', quantity: l.quantity ?? '' })) : []);
      setPhoto(initialProduct.photo || '');
    } else {
      setName('');
      // Alta nueva: arranca en la última zona usada (escáner o alta
      // anterior) si sigue existiendo; si no, la primera zona.
      setZone(lastUsedZone(zones) || zones[0]?.name || 'Alacena Principal');
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
      setLots([]);
      setPhoto('');
    }
    setSavedNextCount(0);
  }, [initialProduct, isOpen, zones, catalogs]);

  if (!isOpen) return null;

  const activeBarcode = barcode || `ALC-${Date.now().toString(36).toUpperCase()}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const andNext = saveAndNextRef.current && !initialProduct?.id;
    saveAndNextRef.current = false;

    const isCava = isCavaZone(zone, zones);
    const finalUnit = isCava ? 'botellas' : unit;
    const finalCategory = isCava ? 'Vinos & Licores' : (category || 'Abarrotes');

    // Lotes FEFO: solo viajan los lotes válidos (fecha + cantidad > 0).
    // Si hay lotes, la existencia es su suma y la caducidad visible es la
    // del lote que antes vence. Sin lotes, el producto queda como siempre.
    const validLots = normalizeLots({ lots });
    const hasLots = validLots.length > 0;

    const productPayload = {
      id: initialProduct?.id || `prod-${Date.now()}`,
      name: name.trim(),
      zone: zone || zones[0]?.name || 'Alacena Principal',
      category: finalCategory,
      quantity: hasLots ? totalLotsQuantity(validLots) : (parseFloat(quantity) || 0),
      unit: finalUnit,
      minStock: parseFloat(minStock) || 0,
      maxStock: parseFloat(maxStock) || 6,
      idealStock: parseFloat(maxStock) || 6,
      unitPriceMxn: parseFloat(unitPriceMxn) || 0,
      store: store.trim() || 'Costco Wholesale',
      lastLoggedBy: staff || effectiveStaffList[0]?.name || 'Administrador General',
      barcode: activeBarcode,
      expiryDate: hasLots ? validLots[0].expiryDate : (expiryDate || null),
      lots: validLots,
      photo: photo || null,
      isWine: isCava ? true : Boolean(initialProduct?.isWine),
      updatedAt: new Date().toISOString(),
    };

    const result = onSave(productPayload);
    if (result === false) return; // El guardado fue rechazado: no cerrar ni encadenar.
    audio.success();

    // Recordar la zona para la siguiente alta (escáner y manual comparten).
    try { window.localStorage.setItem(LAST_ZONE_KEY, productPayload.zone); } catch (_) { /* sin almacenamiento */ }

    if (andNext) {
      // Guardar y siguiente: se limpia SOLO lo propio del producto y se
      // conserva zona, categoría, unidad, tienda y personal para seguir
      // dando altas de la misma zona sin salir del formulario.
      setSavedNextCount((n) => n + 1);
      setName('');
      setBarcode(`ALC-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`);
      setQuantity(1);
      setUnitPriceMxn(0);
      setExpiryDate('');
      setLots([]);
      setPhoto('');
      return;
    }
    onClose();
  };

  // E7: foto propia del producto (cámara o galería), reducida a 512 px
  // para que no infle el respaldo ni el documento en la nube.
  const handlePhotoFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 512 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
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
      <div className="relative w-full max-w-2xl rounded-3xl bg-[var(--bg-base)] border border-[var(--border-soft)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-soft)] bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[var(--terracotta)]/20 to-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold)]/30">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-bold text-[var(--ink-primary)]">
                {initialProduct ? 'Editar Insumo de la Alacena' : 'Registrar Nuevo Insumo'}
              </h2>
              <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                {initialProduct ? 'Modifica detalles, existencias, tienda o elimina' : 'Genera un nuevo artículo con código QR único para botes, sobres o latas'}
              </p>
            </div>
          </div>
          <button aria-label="Cerrar"
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Nombre y Código de Barra */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--ink-secondary)] uppercase tracking-wider">
              Nombre del Insumo / Producto *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Arroz Basmati de la India, Leche Entera, Sal de Mar..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-sm focus:outline-none focus:border-[var(--gold)]"
            />
          </div>

          {/* E7: foto propia del producto */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-soft)]">
            {photo ? (
              <img src={photo} alt="Foto del producto" className="w-14 h-14 rounded-xl object-cover border border-[var(--border-soft)]" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-white/5 border border-[var(--border-soft)] flex items-center justify-center text-[var(--ink-tertiary)]">
                <Camera className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-[var(--ink-secondary)] uppercase tracking-wider">Foto del producto</span>
              <span className="block text-[11px] text-[var(--ink-tertiary)]">Se ve en la tarjeta en vez del icono gris. Opcional.</span>
            </div>
            <label className="px-3 py-2 rounded-xl bg-[var(--gold)] text-[var(--on-gold)] text-xs font-bold cursor-pointer shrink-0">
              {photo ? 'Cambiar foto' : 'Tomar foto'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhotoFile(e.target.files?.[0])}
              />
            </label>
            {photo && (
              <button type="button" onClick={() => setPhoto('')} className="px-2 py-2 text-xs font-bold text-rose-400 hover:text-white shrink-0" aria-label="Quitar foto">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Zona y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink-secondary)] uppercase tracking-wider mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--gold)]" />
                <span>Zona / Almacén Físico</span>
              </label>
              <select
                value={zone}
                onChange={(e) => {
                  const newZ = e.target.value;
                  setZone(newZ);
                  if (isCavaZone(newZ, zones)) {
                    setUnit('botellas');
                    setCategory('Vinos & Licores');
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-sm focus:outline-none focus:border-[var(--gold)]"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.name}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center justify-between text-xs font-bold text-[var(--ink-secondary)] uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[var(--gold)]" />
                  <span>Categoría</span>
                </span>
                {onOpenCatalogs && (
                  <button
                    type="button"
                    onClick={() => { audio.click(); onOpenCatalogs(); }}
                    className="text-[10px] text-[var(--gold)] hover:underline flex items-center gap-1 font-mono"
                  >
                    <Settings className="w-2.5 h-2.5" />
                    <span>Gestionar</span>
                  </button>
                )}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isCavaZone(zone, zones)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${
                  isCavaZone(zone, zones)
                    ? 'bg-[var(--bg-elevated)] border-[var(--wine)] text-amber-200 cursor-not-allowed'
                    : 'bg-[var(--bg-base)] border-[var(--border-soft)] text-white focus:border-[var(--gold)]'
                }`}
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
              <label className="block text-xs font-bold text-[var(--ink-secondary)] uppercase tracking-wider mb-1.5">
                Existencia Actual en Casa *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white font-mono text-sm focus:outline-none focus:border-[var(--gold)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink-secondary)] uppercase tracking-wider mb-1.5">
                Unidad de Medida
              </label>
              {isCavaZone(zone, zones) ? (
                <div>
                  <div className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--gold)]/50 text-[var(--gold)] font-bold text-sm flex items-center justify-between">
                    <span>🍷 Botellas (Exclusivo Cava)</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--gold)]/20">Regla Cava</span>
                  </div>
                  <span className="text-[11px] text-[var(--gold)] mt-1 block">
                    ✓ En la Cava sólo se admiten botellas de vinos o licores.
                  </span>
                </div>
              ) : (
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-sm focus:outline-none focus:border-[var(--gold)]"
                >
                  {effectiveUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Mínimo, Máximo y Precio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--ink-secondary)] uppercase tracking-wider mb-1.5">
                Stock Mínimo (Alerta)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white font-mono text-xs focus:outline-none focus:border-[var(--gold)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink-secondary)] uppercase tracking-wider mb-1.5">
                Capacidad Máxima
              </label>
              <input
                type="number"
                step="any"
                min="1"
                value={maxStock}
                onChange={(e) => setMaxStock(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white font-mono text-xs focus:outline-none focus:border-[var(--gold)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink-secondary)] uppercase tracking-wider mb-1.5">
                Costo Unitario ({activeHouse?.currency === 'EUR' ? '€ EUR' : '$ MXN'})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[var(--ink-tertiary)] text-xs font-mono">
                  {activeHouse?.currency === 'EUR' ? '€' : '$'}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={unitPriceMxn}
                  onChange={(e) => setUnitPriceMxn(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white font-mono text-xs focus:outline-none focus:border-[var(--gold)]"
                />
              </div>
            </div>
          </div>

          {/* Fecha de Caducidad y Código de Barras */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink-secondary)] uppercase tracking-wider mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--gold)]" />
                <span>Fecha de Caducidad (FEFO)</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-sm focus:outline-none focus:border-[var(--gold)]"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink-secondary)] uppercase tracking-wider mb-1.5">
                <QrCode className="w-3.5 h-3.5 text-[var(--gold)]" />
                <span>Código Identificador Único</span>
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-[var(--gold)] font-mono text-xs focus:outline-none focus:border-[var(--gold)]"
              />
            </div>
          </div>

          {/* Lotes por caducidad (FEFO, 3.11.0) */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-soft)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--gold)] uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-[var(--gold)]" />
                <span>Lotes por caducidad (opcional)</span>
              </label>
              <button
                type="button"
                onClick={() => { audio.click(); setLots((prev) => [...prev, { expiryDate: expiryDate || '', quantity: '' }]); }}
                className="text-[10px] text-[var(--gold)] hover:underline flex items-center gap-1 font-mono font-bold"
              >
                <Plus className="w-3 h-3" />
                <span>+ Añadir lote</span>
              </button>
            </div>
            {lots.length === 0 ? (
              <p className="text-[11px] text-[var(--ink-tertiary)] leading-relaxed">
                Sin lotes: el producto usa su fecha de caducidad única, como siempre. Añade lotes si tienes el mismo producto con caducidades distintas: al consumir, se descuenta primero del que antes vence.
              </p>
            ) : (
              <>
                {lots.map((lot, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="date"
                      aria-label={`Caducidad del lote ${idx + 1}`}
                      value={lot.expiryDate || ''}
                      onChange={(e) => setLots((prev) => prev.map((l, i) => i === idx ? { ...l, expiryDate: e.target.value } : l))}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-soft)] text-white text-xs focus:outline-none focus:border-[var(--gold)]"
                    />
                    <input
                      type="number"
                      aria-label={`Cantidad del lote ${idx + 1}`}
                      step="any"
                      min="0"
                      value={lot.quantity}
                      onChange={(e) => setLots((prev) => prev.map((l, i) => i === idx ? { ...l, quantity: e.target.value } : l))}
                      className="w-24 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-soft)] text-white font-mono text-xs focus:outline-none focus:border-[var(--gold)]"
                      placeholder="Cant."
                    />
                    <span className="text-[11px] text-[var(--ink-secondary)]">{unit}</span>
                    <button
                      type="button"
                      aria-label={`Quitar lote ${idx + 1}`}
                      onClick={() => { audio.click(); setLots((prev) => prev.filter((_, i) => i !== idx)); }}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <p className="text-[11px] text-[var(--ink-secondary)]">
                  Con lotes, la existencia guardada es su suma: <strong className="text-white">{totalLotsQuantity(normalizeLots({ lots }))} {unit}</strong> y la caducidad visible es la del lote más próximo.
                </p>
              </>
            )}
          </div>

          {/* SECCIÓN PROACTIVA: TIENDA DE COMPRA HABITUAL */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-soft)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--gold)] uppercase tracking-wider">
                <Store className="w-3.5 h-3.5 text-[var(--gold)]" />
                <span>Tienda de Compra Habitual</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingQuickStore(!isAddingQuickStore)}
                  className="text-[10px] text-[var(--gold)] hover:underline flex items-center gap-1 font-mono font-bold"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isAddingQuickStore ? 'Cerrar' : '+ Nueva Tienda'}</span>
                </button>
                {onOpenCatalogs && (
                  <button
                    type="button"
                    onClick={() => { audio.click(); onOpenCatalogs(); }}
                    className="p-1 rounded text-[var(--ink-tertiary)] hover:text-[var(--gold)]"
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
                      ? 'bg-[var(--gold)] text-[var(--on-gold)] font-bold shadow-sm'
                      : 'bg-[var(--bg-base)] text-[var(--ink-secondary)] hover:text-white border border-[var(--border-soft)]'
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
                className="w-full px-4 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-xs sm:text-sm focus:outline-none focus:border-[var(--gold)]"
              />
              <datalist id="stores-datalist">
                {effectiveStores.map((st) => (
                  <option key={st.id} value={st.name} />
                ))}
              </datalist>
            </div>

            {/* Formulario rápido para agregar nueva tienda si hace clic en + Nueva Tienda */}
            {isAddingQuickStore && (
              <div className="pt-2 border-t border-[var(--border-soft)] flex gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Nombre de la nueva tienda (ej. La Comer, Carnicería Don Pepe)"
                  value={quickStoreInput}
                  onChange={(e) => setQuickStoreInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--bg-base)] border border-[var(--gold)]/40 text-white text-xs"
                />
                <button
                  type="button"
                  onClick={handleSaveQuickStore}
                  className="px-3 py-1.5 rounded-xl bg-[var(--gold)] text-[var(--on-gold)] text-xs font-bold"
                >
                  Guardar Tienda
                </button>
              </div>
            )}
          </div>

          {/* SECCIÓN PROACTIVA: REGISTRADO POR */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-soft)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--gold)] uppercase tracking-wider">
                <UserCheck className="w-3.5 h-3.5 text-[var(--gold)]" />
                <span>Registrado por</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingQuickStaff(!isAddingQuickStaff)}
                  className="text-[10px] text-[var(--gold)] hover:underline flex items-center gap-1 font-mono font-bold"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isAddingQuickStaff ? 'Cerrar' : '+ Agregar Persona'}</span>
                </button>
                {onOpenCatalogs && (
                  <button
                    type="button"
                    onClick={() => { audio.click(); onOpenCatalogs(); }}
                    className="p-1 rounded text-[var(--ink-tertiary)] hover:text-[var(--gold)]"
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
                      ? 'bg-[var(--gold)] text-[var(--on-gold)] font-bold shadow-sm'
                      : 'bg-[var(--bg-base)] text-[var(--ink-secondary)] hover:text-white border border-[var(--border-soft)]'
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
              className="w-full px-4 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-xs sm:text-sm focus:outline-none focus:border-[var(--gold)]"
            >
              {effectiveStaffList.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.icon ? `${s.icon} ` : ''}{s.name} ({s.role || 'Personal'})
                </option>
              ))}
            </select>

            {/* Formulario rápido para agregar nueva persona si hace clic en + Agregar Persona */}
            {isAddingQuickStaff && (
              <div className="pt-2 border-t border-[var(--border-soft)] flex gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Nombre de la persona (ej. Chofer Pedro, Chef Invitado)"
                  value={quickStaffInput}
                  onChange={(e) => setQuickStaffInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--bg-base)] border border-[var(--gold)]/40 text-white text-xs"
                />
                <button
                  type="button"
                  onClick={handleSaveQuickStaff}
                  className="px-3 py-1.5 rounded-xl bg-[var(--gold)] text-[var(--on-gold)] text-xs font-bold"
                >
                  Guardar Persona
                </button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-between gap-3 border-t border-[var(--border-soft)]">
            
            {/* BOTÓN ELIMINAR ARTÍCULO (SOLICITADO POR EL USUARIO) */}
            {initialProduct && onDelete ? (
              <button
                type="button"
                onClick={async () => {
                  audio.click();
                  if (await confirmDialog(`¿Estás seguro de que deseas eliminar permanentemente "${initialProduct.name}" del inventario de la alacena?`)) {
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
                className="px-4 py-2 text-xs font-bold text-[var(--ink-secondary)] hover:text-white rounded-xl transition-all"
              >
                Cancelar
              </button>
              {!initialProduct?.id && (
                <button
                  type="submit"
                  onClick={() => { saveAndNextRef.current = true; }}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[var(--gold)] bg-[var(--gold)]/10 hover:bg-[var(--gold)]/20 border border-[var(--gold)]/40 rounded-xl transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Guardar y siguiente{savedNextCount > 0 ? ` (${savedNextCount})` : ''}</span>
                </button>
              )}
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[var(--terracotta)] to-[var(--gold)] hover:brightness-110 rounded-xl transition-all shadow-md shadow-[var(--terracotta)]/20"
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
