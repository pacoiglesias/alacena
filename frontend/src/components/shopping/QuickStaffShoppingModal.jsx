import React, { useState } from 'react';
import { 
  X, ShoppingCart, Plus, Minus, Check, 
  Sparkles, User, Store, AlertCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audio } from '../../services/audioService';

const FREQUENT_HOUSEHOLD_ITEMS = [
  { name: 'Coca-Cola Original 600ml', department: 'ABARROTES', unit: 'piezas', store: 'OXXO / Super', price: 19.50, icon: '🥤' },
  { name: 'Coca-Cola Sin Azúcar 600ml', department: 'ABARROTES', unit: 'piezas', store: 'Supermercado', price: 19.50, icon: '🥤' },
  { name: 'Leche Entera Pasteurizada', department: 'LACTEOS', unit: 'litros', store: 'Supermercado', price: 29.50, icon: '🥛' },
  { name: 'Huevo Blanco San Juan (30 pzas)', department: 'LACTEOS', unit: 'paquetes', store: 'Supermercado', price: 92.00, icon: '🥚' },
  { name: 'Pechuga de Pollo Fresca', department: 'CARNES', unit: 'kg', store: 'Carnicería / Super', price: 145.00, icon: '🍗' },
  { name: 'Corte Ribeye Prime', department: 'CARNES', unit: 'kg', store: 'Carnicería Boutique', price: 680.00, icon: '🥩' },
  { name: 'Aceite de Oliva Extra Virgen', department: 'ABARROTES', unit: 'litros', store: 'City Market', price: 345.00, icon: '🫒' },
  { name: 'Harina de Trigo Selecta', department: 'ABARROTES', unit: 'kg', store: 'Costco', price: 38.50, icon: '🌾' },
  { name: 'Papel Higiénico (Paquete 12)', department: 'LIMPIEZA', unit: 'paquetes', store: 'Costco', price: 145.00, icon: '🧻' },
  { name: 'Detergente Líquido para Ropa', department: 'LIMPIEZA', unit: 'piezas', store: 'Costco', price: 210.00, icon: '🧼' },
  { name: 'Garrafón de Agua 20L', department: 'ABARROTES', unit: 'piezas', store: 'Repartidor / Tienda', price: 55.00, icon: '💧' },
  { name: 'Café Grano Tostado', department: 'PANADERIA', unit: 'kg', store: 'Tostador Local', price: 390.00, icon: '☕' },
];

export default function QuickStaffShoppingModal({
  isOpen,
  onClose,
  onAddItem,
  staffList = [],
}) {
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('piezas');
  const [department, setDepartment] = useState('ABARROTES');
  const [reportedBy, setReportedBy] = useState(staffList[0]?.name || 'Personal de Servicio');
  const [justAddedAlert, setJustAddedAlert] = useState(false);

  if (!isOpen) return null;

  const handleSelectFrequent = (item) => {
    audio.click();
    setProductName(item.name);
    setDepartment(item.department);
    setUnit(item.unit);
    setQuantity(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productName.trim()) return;

    audio.success();
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.65 },
      });
    } catch (_) {}

    onAddItem({
      id: `shop-${Date.now()}`,
      name: productName.trim(),
      quantity: parseFloat(quantity) || 1,
      unit,
      department,
      store: 'Supermercado',
      estimatedPriceMxn: 0,
      targetZone: 'Alacena Principal',
      reportedBy,
      checked: false,
    });

    setJustAddedAlert(true);
    setProductName('');
    setQuantity(1);

    setTimeout(() => {
      setJustAddedAlert(false);
      onClose();
    }, 1300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#162137] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                ¿Qué falta en casa? (Apuntar al Súper)
              </h3>
              <p className="text-xs text-gray-400">
                Diseñado para el personal de servicio. Toca lo que se terminó o escribe su nombre.
              </p>
            </div>
          </div>
          <button aria-label="Cerrar herramienta"
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert if just added */}
        {justAddedAlert && (
          <div className="m-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-3 animate-fade-in">
            <Check className="w-6 h-6 stroke-[3]" />
            <span className="text-sm font-bold">
              ¡Apuntado con éxito! Ya está en la lista de compras del súper.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Insumos Frecuentes Táctiles (1 Toque) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
              Toca un producto frecuente si se terminó:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FREQUENT_HOUSEHOLD_ITEMS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleSelectFrequent(item)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 select-none ${
                    productName === item.name
                      ? 'bg-amber-500/20 border-amber-400 text-white font-bold'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs truncate">{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Campo de Nombre del Producto */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
              O escribe qué se terminó: *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Coca Cola, Servilletas, Aguacates, Sal..."
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-base font-semibold focus:outline-none focus:border-amber-400 placeholder-gray-500"
            />
          </div>

          {/* Selector de Cantidad Gigante y Fácil */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                ¿Cuántos faltan?
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    audio.click();
                    setQuantity((prev) => Math.max(1, prev - 1));
                  }}
                  className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="flex-1 h-11 text-center rounded-xl bg-white/5 border border-white/10 text-white font-mono font-bold text-lg"
                />

                <button
                  type="button"
                  onClick={() => {
                    audio.click();
                    setQuantity((prev) => prev + 1);
                  }}
                  className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Unidad
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm"
              >
                <option value="piezas">piezas</option>
                <option value="litros">litros</option>
                <option value="kg">kg</option>
                <option value="paquetes">paquetes</option>
                <option value="botellas">botellas</option>
                <option value="cajas">cajas</option>
              </select>
            </div>
          </div>

          {/* Personal que Reporta */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span>¿Quién lo reporta?</span>
            </label>
            <select
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
              <option value="Personal de Cocina">Personal de Cocina</option>
              <option value="Chofer / Compras">Chofer / Compras</option>
            </select>
          </div>

          {/* Botón Gigante de Guardar */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl text-base font-extrabold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-950/50"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>✅ APUNTAR PARA EL SÚPER AHORA</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
