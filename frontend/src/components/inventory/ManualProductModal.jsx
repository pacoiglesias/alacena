import React, { useState, useEffect } from 'react';
import { X, Check, DollarSign, MapPin, Tag, Box, UserCheck, Store, AlertCircle } from 'lucide-react';
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
  zones, 
  staffList, 
  initialProduct 
}) {
  const [name, setName] = useState('');
  const [zone, setZone] = useState('');
  const [category, setCategory] = useState('Abarrotes');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('kg');
  const [minStock, setMinStock] = useState(2);
  const [idealStock, setIdealStock] = useState(5);
  const [unitPriceMxn, setUnitPriceMxn] = useState(0);
  const [store, setStore] = useState('Costco');
  const [staff, setStaff] = useState('');

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name || '');
      setZone(initialProduct.zone || (zones[0]?.name || 'Alacena Principal'));
      setCategory(initialProduct.category || 'Abarrotes');
      setQuantity(initialProduct.quantity || 1);
      setUnit(initialProduct.unit || 'kg');
      setMinStock(initialProduct.minStock || 2);
      setIdealStock(initialProduct.idealStock || 5);
      setUnitPriceMxn(initialProduct.unitPriceMxn || 0);
      setStore(initialProduct.store || 'Costco');
      setStaff(initialProduct.lastLoggedBy || (staffList[0]?.name || 'María (Jefa de Cocina)'));
    } else {
      setName('');
      setZone(zones[0]?.name || 'Alacena Principal');
      setCategory('Abarrotes');
      setQuantity(1);
      setUnit('kg');
      setMinStock(2);
      setIdealStock(5);
      setUnitPriceMxn(0);
      setStore('Costco');
      setStaff(staffList[0]?.name || 'María (Jefa de Cocina)');
    }
  }, [initialProduct, isOpen, zones, staffList]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    audio.success();
    onSave({
      id: initialProduct?.id || `prod-${Date.now()}`,
      name: name.trim(),
      zone: zone || zones[0]?.name || 'Alacena Principal',
      category,
      quantity: parseFloat(quantity) || 0,
      unit,
      minStock: parseFloat(minStock) || 0,
      idealStock: parseFloat(idealStock) || 0,
      unitPriceMxn: parseFloat(unitPriceMxn) || 0,
      store: store.trim(),
      lastLoggedBy: staff || staffList[0]?.name || 'Administrador General',
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#131C31] sticky top-0 z-10 backdrop-blur-md">
          <div>
            <h3 className="text-lg font-bold text-white">
              {initialProduct ? 'Editar Producto' : 'Capturar Artículo Manual'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Ingresa los datos sin necesidad de código de barras. Valuación en Pesos Mexicanos (MXN).
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Nombre del Artículo / Insumo *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ej. Harina de Trigo Selecta, Ribeye Prime, Vino Tinto..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
            />
          </div>

          {/* Ubicación y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ubicación Física / Zona *</span>
              </label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.name}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Categoría</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
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
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                <Box className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cantidad Actual *</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Unidad de Medida
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {UNITS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Parámetros de Stock (Mínimo e Ideal) */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
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
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Avisa cuando se requiera compra</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                Stock Ideal (Objetivo)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={idealStock}
                onChange={(e) => setIdealStock(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Nivel óptimo para abastecimiento</span>
            </div>
          </div>

          {/* Costo Unitario en Pesos Mexicanos (MXN) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Costo Unitario ($ MXN) *</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-400 font-mono font-bold">$</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="0.00"
                  value={unitPriceMxn}
                  onChange={(e) => setUnitPriceMxn(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tienda o Proveedor</span>
              </label>
              <input
                type="text"
                placeholder="Costco, City Market, Central de Abastos..."
                value={store}
                onChange={(e) => setStore(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* ¿Quién lo registra? (Atribución del personal) */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Personal que Registra (Para Bitácora) *</span>
            </label>
            <select
              value={staff}
              onChange={(e) => setStaff(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Footer actions */}
          <div className="pt-4 flex items-center justify-end border-t border-white/10 gap-3">
            <button
              type="button"
              onClick={() => {
                audio.click();
                onClose();
              }}
              className="px-5 py-2.5 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-950/40"
            >
              <Check className="w-4 h-4" />
              <span>{initialProduct ? 'Guardar Cambios' : 'Registrar en Alacena'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
