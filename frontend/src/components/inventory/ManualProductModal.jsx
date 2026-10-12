import React, { useState, useEffect } from 'react';
import { 
  X, Check, DollarSign, MapPin, Tag, Box, UserCheck, Store, 
  AlertCircle, QrCode, Sparkles, Printer, Calendar
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { audio } from '../../services/audioService';

const CATEGORIES = [
  'Abarrotes',
  'Carnes & Proteínas',
  'Pescados & Mariscos',
  'Lácteos & Quesos',
  'Vinos & Licores',
  'Bebidas Calientes',
  'Frutas & Verduras',
  'Especias & Panadería',
  'Limpieza & Hogar',
];

const UNITS = [
  { id: 'kg', label: 'Kilogramos (kg)' },
  { id: 'g', label: 'Gramos (g)' },
  { id: 'litros', label: 'Litros (L)' },
  { id: 'ml', label: 'Mililitros (ml)' },
  { id: 'piezas', label: 'Piezas (pza)' },
  { id: 'botellas', label: 'Botellas' },
  { id: 'paquetes', label: 'Paquetes' },
];

export default function ManualProductModal({ 
  isOpen, 
  onClose, 
  onSave, 
  zones = [], 
  staffList = [], 
  initialProduct 
}) {
  const [name, setName] = useState('');
  const [zone, setZone] = useState('');
  const [category, setCategory] = useState('Abarrotes');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('kg');
  const [minStock, setMinStock] = useState(2);
  const [maxStock, setMaxStock] = useState(6);
  const [unitPriceMxn, setUnitPriceMxn] = useState(0);
  const [store, setStore] = useState('Costco');
  const [staff, setStaff] = useState('');
  const [barcode, setBarcode] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showQrPreview, setShowQrPreview] = useState(false);

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
      setStore(initialProduct.store || 'Costco');
      setStaff(initialProduct.lastLoggedBy || (staffList[0]?.name || 'María (Jefa de Cocina)'));
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
      setStore('Costco');
      setStaff(staffList[0]?.name || 'María (Jefa de Cocina)');
      setBarcode(`ALC-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`);
      setExpiryDate('');
    }
  }, [initialProduct, isOpen, zones, staffList]);

  if (!isOpen) return null;

  const activeBarcode = barcode || `ALC-${Date.now().toString(36).toUpperCase()}`;

  const qrPayload = JSON.stringify({
    app: 'ALACENA_ENTERPRISE',
    type: 'PANTRY_ITEM',
    id: initialProduct?.id || activeBarcode,
    barcode: activeBarcode,
    name: name.trim() || 'Insumo',
    qty: parseFloat(quantity) || 1,
    unit,
    zone: zone || 'Alacena Principal',
    store: store.trim(),
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    audio.success();
    onSave({
      id: initialProduct?.id || `prod-${Date.now()}`,
      barcode: activeBarcode,
      name: name.trim(),
      zone: zone || zones[0]?.name || 'Alacena Principal',
      category,
      quantity: parseFloat(quantity) || 0,
      unit,
      minStock: parseFloat(minStock) || 0,
      maxStock: parseFloat(maxStock) || 6,
      idealStock: parseFloat(maxStock) || 6,
      unitPriceMxn: parseFloat(unitPriceMxn) || 0,
      store: store.trim(),
      lastLoggedBy: staff || staffList[0]?.name || 'Administrador General',
      expiryDate: expiryDate || null,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#14110F] border border-[#E0B441]/30 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#2A2521] bg-[#1C1814] sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-bold text-white font-display">
              {initialProduct ? 'Editar Insumo del Hogar' : 'Captura Manual de Insumo'}
            </h3>
            <p className="text-xs text-[#B8AFA3] mt-0.5">
              Si no tiene código comercial, el sistema autogenera su QR único para frascos y stickers.
            </p>
          </div>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Banner de Código QR Autogenerado */}
          <div className="p-3.5 rounded-2xl bg-[#1C1814] border border-[#E0B441]/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#E0B441]/15 text-[#E0B441] border border-[#E0B441]/30 shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  ✓ QR Autogenerado y Guardado
                  <Sparkles className="w-3.5 h-3.5 text-[#E0B441]" />
                </span>
                <span className="font-mono text-[11px] text-[#E0B441] block">
                  {activeBarcode}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                audio.click();
                setShowQrPreview(!showQrPreview);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#E0B441] border border-[#E0B441]/30 font-bold transition-all"
            >
              {showQrPreview ? 'Ocultar' : 'Ver Etiqueta'}
            </button>
          </div>

          {/* Vista previa del QR imprimible */}
          {showQrPreview && (
            <div className="p-4 rounded-2xl bg-white text-black space-y-2 border-2 border-dashed border-gray-300 animate-fade-in text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6B1F2E] block">
                ALACENA DEL HOGAR • ETIQUETA QR
              </span>
              <h4 className="text-sm font-bold text-gray-900 truncate">
                {name || 'Insumo sin nombre'}
              </h4>
              <div className="flex justify-center py-2">
                <div className="p-2 bg-white rounded-xl border border-gray-200 inline-block shadow-sm">
                  <QRCodeSVG value={qrPayload} size={130} level="H" />
                </div>
              </div>
              <span className="text-[10px] font-mono text-gray-500 block">
                {activeBarcode} • Zona: {zone || 'Alacena'}
              </span>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
              Nombre del Artículo / Insumo *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ej. Harina Selecta, Aceite de Oliva Oleo, Ribeye Prime..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#12100E] border border-[#2A2521] text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#E0B441] focus:ring-1 focus:ring-[#E0B441] transition-all font-medium"
            />
          </div>

          {/* Ubicación y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#B8AFA3] uppercase tracking-wider mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#E0B441]" />
                <span>Ubicación Física (Cava, Alacena...) *</span>
              </label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-sm focus:outline-none focus:border-[#E0B441]"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.name}>
                    {z.type === 'WINE_CELLAR' ? '🍷' : z.type === 'FRIDGE' ? '❄️' : '🏠'} {z.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#B8AFA3] uppercase tracking-wider mb-1.5">
                <Tag className="w-3.5 h-3.5 text-[#E0B441]" />
                <span>Categoría</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-sm focus:outline-none focus:border-[#E0B441]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cantidad y Unidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#B8AFA3] uppercase tracking-wider mb-1.5">
                <Box className="w-3.5 h-3.5 text-[#E0B441]" />
                <span>Cantidad Actual en Casa *</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-sm focus:outline-none focus:border-[#E0B441] font-mono font-bold"
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
                {UNITS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stocks Mínimo y Máximo de la Casa */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#1C1814] border border-[#2A2521]">
            <div>
              <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                Stock Mínimo (Alerta)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#12100E] border border-[#2A2521] text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
              <span className="text-[10px] text-[#8B8378] mt-1 block">Alerta cuando se requiera compra</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                Capacidad Máxima (No Saturar)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={maxStock}
                onChange={(e) => setMaxStock(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#12100E] border border-[#2A2521] text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[10px] text-[#8B8378] mt-1 block">Límite para no sobrecargar muebles</span>
            </div>
          </div>

          {/* Costo Unitario en Pesos Mexicanos (MXN) y Caducidad FEFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#B8AFA3] uppercase tracking-wider mb-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Costo Unitario ($ MXN)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-gray-400 font-mono font-bold">$</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={unitPriceMxn}
                  onChange={(e) => setUnitPriceMxn(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-sm focus:outline-none focus:border-[#E0B441] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#B8AFA3] uppercase tracking-wider mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#E0B441]" />
                <span>Caducidad (Opcional FEFO)</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-sm focus:outline-none focus:border-[#E0B441]"
              />
            </div>
          </div>

          {/* Tienda y Personal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#B8AFA3] uppercase tracking-wider mb-1.5">
                <Store className="w-3.5 h-3.5 text-[#E0B441]" />
                <span>Tienda de Compra Habitual</span>
              </label>
              <input
                type="text"
                placeholder="Ej. City Market, Costco, Chedraui..."
                value={store}
                onChange={(e) => setStore(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-sm focus:outline-none focus:border-[#E0B441]"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#B8AFA3] uppercase tracking-wider mb-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#E0B441]" />
                <span>Registrado por</span>
              </label>
              <select
                value={staff}
                onChange={(e) => setStaff(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-sm focus:outline-none focus:border-[#E0B441]"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#2A2521]">
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
        </form>

      </div>
    </div>
  );
}
