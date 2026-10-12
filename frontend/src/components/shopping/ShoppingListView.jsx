import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, Plus, Check, Trash2, Share2, 
  Sparkles, Store, CheckSquare, Square, Camera, 
  ArrowRight, Warehouse, DollarSign, RefreshCw, 
  AlertCircle, QrCode, Printer, CheckCircle2, ListChecks 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audio } from '../../services/audioService';
import ItemQrModal from './ItemQrModal';
import ShoppingListQrTicketModal from './ShoppingListQrTicketModal';

export default function ShoppingListView({
  shoppingList,
  products,
  zones,
  activeHouse,
  onToggleItem,
  onRemoveItem,
  onAddItem,
  onAutoGenerateFromPantry,
  onCompletePurchaseToPantry,
  onOpenScanner,
}) {
  const [selectedStore, setSelectedStore] = useState('ALL');
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [selectedQrItem, setSelectedQrItem] = useState(null);
  const [isOrderTicketQrOpen, setIsOrderTicketQrOpen] = useState(false);

  // New manual item state
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('kg');
  const [store, setStore] = useState('Costco');
  const [estimatedPriceMxn, setEstimatedPriceMxn] = useState(0);
  const [targetZone, setTargetZone] = useState(zones[0]?.name || 'Alacena Principal');

  // Stores available in the current list
  const stores = useMemo(() => {
    const list = new Set(shoppingList.map((i) => i.store || 'Supermercado General'));
    return ['ALL', ...Array.from(list)];
  }, [shoppingList]);

  // Metrics
  const metrics = useMemo(() => {
    let pendingCount = 0;
    let inCartCount = 0;
    let totalEstimatedMxn = 0;
    let cartTotalMxn = 0;

    shoppingList.forEach((item) => {
      const itemCost = (item.quantity || 1) * (item.estimatedPriceMxn || 0);
      totalEstimatedMxn += itemCost;
      if (item.checked) {
        inCartCount++;
        cartTotalMxn += itemCost;
      } else {
        pendingCount++;
      }
    });

    const totalItems = shoppingList.length;
    const progressPercent = totalItems > 0 ? Math.round((inCartCount / totalItems) * 100) : 0;

    return { pendingCount, inCartCount, totalEstimatedMxn, cartTotalMxn, totalItems, progressPercent };
  }, [shoppingList]);

  // Filtered by store
  const filteredItems = useMemo(() => {
    if (selectedStore === 'ALL') return shoppingList;
    return shoppingList.filter((i) => (i.store || 'Supermercado General') === selectedStore);
  }, [shoppingList, selectedStore]);

  // WhatsApp formatted export
  const handleShareWhatsApp = () => {
    audio.click();
    const pending = shoppingList.filter((i) => !i.checked);
    if (pending.length === 0) {
      alert('No hay artículos pendientes en la lista de compras.');
      return;
    }

    let text = `🛒 *LISTA DE COMPRAS - ${activeHouse?.name?.toUpperCase() || 'RESIDENCIA'}*\n\n`;
    text += `Total por comprar: ${pending.length} artículos\n`;
    text += `Presupuesto estimado: $${metrics.totalEstimatedMxn.toFixed(2)} MXN\n\n`;

    const byStore = {};
    pending.forEach((i) => {
      const st = i.store || 'Supermercado General';
      if (!byStore[st]) byStore[st] = [];
      byStore[st].push(i);
    });

    Object.entries(byStore).forEach(([stName, items]) => {
      text += `📍 *${stName}*:\n`;
      items.forEach((it) => {
        text += `• [ ] ${it.name} - ${it.quantity} ${it.unit} (~$${((it.estimatedPriceMxn || 0) * it.quantity).toFixed(2)} MXN)\n`;
      });
      text += `\n`;
    });

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    audio.success();
    onAddItem({
      id: `shop-${Date.now()}`,
      name: itemName.trim(),
      quantity: parseFloat(quantity) || 1,
      unit,
      store: store.trim(),
      estimatedPriceMxn: parseFloat(estimatedPriceMxn) || 0,
      targetZone: targetZone || zones[0]?.name || 'Alacena Principal',
      checked: false,
    });

    setItemName('');
    setQuantity(1);
    setEstimatedPriceMxn(0);
    setIsManualAddOpen(false);
  };

  const handleFinishPurchase = () => {
    const checkedItems = shoppingList.filter((i) => i.checked);
    if (checkedItems.length === 0) {
      alert('Marca primero con la casilla los artículos que compraste en el súper para ingresarlos a la alacena.');
      return;
    }

    audio.cook();
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch (_) {}

    onCompletePurchaseToPantry(checkedItems);
  };

  return (
    <div className="space-y-6">
      
      {/* 3-Step Process Pipeline Ribbon */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px]">
            1
          </span>
          <span className="font-semibold text-gray-300">
            <strong>Planear:</strong> Auto-calcular faltantes en casa
          </span>
        </div>
        <div className="hidden sm:block text-gray-600">→</div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[11px]">
            2
          </span>
          <span className="font-semibold text-gray-300">
            <strong>En el Súper:</strong> Tachar y escanear QR / Barras
          </span>
        </div>
        <div className="hidden sm:block text-gray-600">→</div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-[11px]">
            3
          </span>
          <span className="font-semibold text-gray-300">
            <strong>En Casa:</strong> Ingresar a zonas & rotular con QR
          </span>
        </div>
      </div>

      {/* Main Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Lista de Compras Inteligente con Control QR
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Genera tickets QR para el chofer o cocinera, escanea códigos en el súper y transfiere automáticamente a Cuarto Frío o Cava.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Botón Escáner en el Súper */}
          <button
            onClick={() => {
              audio.click();
              onOpenScanner();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-950/40"
          >
            <Camera className="w-4 h-4" />
            <span>📷 Escanear en el Súper</span>
          </button>

          {/* Ticket QR de Orden */}
          <button
            onClick={() => {
              audio.click();
              setIsOrderTicketQrOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 transition-all"
            title="Generar ticket QR imprimible para quien va al supermercado"
          >
            <QrCode className="w-4 h-4" />
            <span>Ticket QR de Orden</span>
          </button>

          {/* Botón Auto-rellenar desde alacena */}
          <button
            onClick={() => {
              audio.success();
              onAutoGenerateFromPantry();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-all"
            title="Calcular compras automáticas según Stock Mínimo e Ideal de la Alacena"
          >
            <RefreshCw className="w-4 h-4" />
            <span>⚡ Auto-Calcular</span>
          </button>

          {/* Botón WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all"
            title="Enviar lista por WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          {/* Botón Agregar Manual */}
          <button
            onClick={() => {
              audio.click();
              setIsManualAddOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Agregar</span>
          </button>
        </div>
      </div>

      {/* Progress & Live Supermarket Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Por Comprar */}
        <div className="glass-panel p-5 rounded-3xl flex items-center justify-between border border-white/10">
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              Pendientes por Comprar
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-mono">
              {metrics.pendingCount} <span className="text-xs text-gray-400 font-sans">artículos</span>
            </div>
            <span className="text-xs text-gray-400 mt-1 block">
              Faltan por echar al carrito
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        {/* En el Carrito & Barra de Progreso */}
        <div className="glass-panel p-5 rounded-3xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                En el Carrito ({metrics.progressPercent}%)
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 mt-1 font-mono">
                {metrics.inCartCount} de {metrics.totalItems}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-3">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${metrics.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Presupuesto Estimado en MXN */}
        <div className="glass-panel p-5 rounded-3xl flex items-center justify-between border border-white/10">
          <div>
            <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
              Presupuesto Estimado
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-mono">
              ${metrics.totalEstimatedMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-xs text-emerald-400 font-sans font-bold">MXN</span>
            </div>
            <span className="text-xs text-gray-400 mt-1 block">
              Comprado en carrito: ${metrics.cartTotalMxn.toFixed(2)} MXN
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Checklist View */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-5">
        
        {/* Store Tabs filter & Finalize Action */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Store className="w-4 h-4 text-gray-400 mr-1" />
            <span className="text-xs font-semibold text-gray-400">Tienda:</span>
            {stores.map((st) => (
              <button
                key={st}
                onClick={() => {
                  audio.click();
                  setSelectedStore(st);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  selectedStore === st
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'Todas las Tiendas' : st}
              </button>
            ))}
          </div>

          {/* Botón Finalizar Compra e Ingresar a Casa */}
          {metrics.inCartCount > 0 && (
            <button
              onClick={handleFinishPurchase}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-950/40 animate-pulse"
            >
              <Warehouse className="w-4 h-4" />
              <span>🏁 Finalizar Compra e Ingresar {metrics.inCartCount} Artículos a Casa</span>
            </button>
          )}
        </div>

        {/* Shopping List Items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
            <ShoppingCart className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white">Lista de compras vacía</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Presiona "Auto-Calcular" para detectar automáticamente los insumos con stock bajo en tus cuartos fríos y alacena.
            </p>
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={() => {
                  audio.success();
                  onAutoGenerateFromPantry();
                }}
                className="px-4 py-2 text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl"
              >
                ⚡ Auto-Calcular Faltantes
              </button>
              <button
                onClick={() => {
                  audio.click();
                  setIsManualAddOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl"
              >
                + Agregar Manualmente
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  audio.click();
                  onToggleItem(item.id);
                }}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer group ${
                  item.checked
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-gray-400'
                    : 'bg-white/[0.03] border-white/5 hover:border-white/20 text-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <button
                    type="button"
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                      item.checked
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-white/30 hover:border-emerald-400'
                    }`}
                  >
                    {item.checked && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <div>
                    <span className={`text-sm font-bold block ${item.checked ? 'line-through text-gray-400' : 'text-white'}`}>
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span className="font-mono text-emerald-300 font-bold">
                        {item.quantity} {item.unit}
                      </span>
                      <span>•</span>
                      <span>{item.store || 'Supermercado'}</span>
                      {item.targetZone && (
                        <>
                          <span>•</span>
                          <span className="text-gray-500">Destino: {item.targetZone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.estimatedPriceMxn > 0 && (
                    <div className="text-right font-mono mr-1">
                      <span className="text-xs text-gray-300 block">
                        ${((item.estimatedPriceMxn || 0) * (item.quantity || 1)).toFixed(2)} MXN
                      </span>
                      <span className="text-[10px] text-gray-500">
                        (${item.estimatedPriceMxn.toFixed(2)} c/u)
                      </span>
                    </div>
                  )}

                  {/* Botón Generar / Imprimir Etiqueta QR del Artículo */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      audio.click();
                      setSelectedQrItem(item);
                    }}
                    className="p-2 text-gray-400 hover:text-emerald-300 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all flex items-center gap-1.5 text-xs font-semibold"
                    title="Ver o imprimir etiqueta QR para frascos / cuarto frío"
                  >
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span className="hidden sm:inline">Etiqueta QR</span>
                  </button>

                  {/* Quitar de la lista */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      audio.delete();
                      onRemoveItem(item.id);
                    }}
                    className="p-2 text-gray-500 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors"
                    title="Quitar de la lista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modal: Agregar Artículo a la Lista */}
      {isManualAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              Agregar Artículo a la Lista de Compras
            </h3>

            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej. Harina, Ribeye, Queso Parmesano..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Unidad
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="litros">litros</option>
                    <option value="piezas">piezas</option>
                    <option value="botellas">botellas</option>
                    <option value="paquetes">paquetes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Tienda Sugerida
                  </label>
                  <input
                    type="text"
                    value={store}
                    onChange={(e) => setStore(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                    placeholder="Costco, City Market..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Precio Estimado ($ MXN)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={estimatedPriceMxn}
                    onChange={(e) => setEstimatedPriceMxn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Zona de Destino al Llegar a Casa
                </label>
                <select
                  value={targetZone}
                  onChange={(e) => setTargetZone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.name}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsManualAddOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl"
                >
                  Agregar a la Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Etiqueta QR del Artículo */}
      <ItemQrModal
        isOpen={!!selectedQrItem}
        onClose={() => setSelectedQrItem(null)}
        item={selectedQrItem}
        activeHouse={activeHouse}
      />

      {/* Modal: Ticket QR de Orden Maestro */}
      <ShoppingListQrTicketModal
        isOpen={isOrderTicketQrOpen}
        onClose={() => setIsOrderTicketQrOpen(false)}
        shoppingList={shoppingList}
        activeHouse={activeHouse}
        totalEstimatedMxn={metrics.totalEstimatedMxn}
      />

    </div>
  );
}
