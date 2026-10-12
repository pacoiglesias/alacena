import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, Printer, BookOpen, Search, Sparkles, 
  ShoppingCart, Check, Layers, Beef, Milk, 
  Apple, Package, Wine, Coffee, Plus 
} from 'lucide-react';
import { audio } from '../../services/audioService';

export default function PantryQrBookletModal({
  isOpen,
  onClose,
  products,
  activeHouse,
  onQuickAddToShoppingList,
}) {
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [addedItems, setAddedItems] = useState({});

  if (!isOpen) return null;

  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category || 'Abarrotes')))];

  const filteredProducts = products.filter((p) => {
    const matchesCat = filterCategory === 'ALL' || (p.category || 'Abarrotes') === filterCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handlePrint = () => {
    audio.click();
    window.print();
  };

  const handleQuickAdd = (product) => {
    audio.success();
    onQuickAddToShoppingList({
      id: `shop-${Date.now()}-${product.id}`,
      name: product.name,
      quantity: product.minStock || 1,
      unit: product.unit || 'piezas',
      store: product.store || 'Supermercado',
      estimatedPriceMxn: product.unitPriceMxn || 0,
      targetZone: product.zone || 'Alacena Principal',
      checked: false,
    });
    setAddedItems(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in print:bg-white print:p-0 print:static">
      <div className="relative w-full max-w-5xl max-h-[94vh] overflow-hidden flex flex-col rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl print:border-none print:shadow-none print:bg-white print:max-h-none print:rounded-none">
        
        {/* Header - Hidden on Print */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#141F36] print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Librito & Catálogo Físico de Códigos QR para Cocina
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold text-purple-300 bg-purple-500/20 border border-purple-500/30 rounded-full">
                  Personal de Servicio
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Imprime estas fichas en papel o carpeta de cocina. Tu personal sólo apunta la cámara de su teléfono y el producto se añade al súper al instante.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-all shadow-md shadow-purple-950/40"
              title="Imprimir hojas del catálogo"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ Imprimir Librito (PDF)</span>
            </button>
            <button
              onClick={() => {
                audio.click();
                onClose();
              }}
              className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters and Controls - Hidden on Print */}
        <div className="p-4 border-b border-white/5 bg-[#10182A] flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar insumo (ej. Harina, Leche)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  audio.click();
                  setFilterCategory(cat);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  filterCategory === cat
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {cat === 'ALL' ? 'Todos los Insumos' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Printable Sheet Header (Visible Only on Paper / Print) */}
        <div className="hidden print:block p-6 border-b-2 border-black text-black">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">
                CATÁLOGO DE CÓDIGOS QR DE ALACENA & COCINA
              </h1>
              <p className="text-sm font-semibold text-gray-700 mt-1">
                {activeHouse?.name || 'Residencia Principal'} • Instrucción para el Personal: Escanea con tu celular cuando falte un producto para agregarlo a la lista de compras.
              </p>
            </div>
            <div className="text-right text-xs font-mono">
              Fecha: {new Date().toLocaleDateString('es-MX')}
            </div>
          </div>
        </div>

        {/* Card Grid Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-4 print:overflow-visible bg-black/20 print:bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
            {filteredProducts.map((p) => {
              const qrPayload = JSON.stringify({
                type: 'PANTRY_ITEM',
                id: p.id,
                name: p.name,
                unit: p.unit || 'kg',
                zone: p.zone || 'Alacena Principal',
                store: p.store || 'Supermercado',
                action: 'ADD_TO_SHOPPING',
              });

              const wasAdded = addedItems[p.id];

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col justify-between transition-all hover:border-purple-500/40 print:border print:border-dashed print:border-gray-500 print:bg-white print:text-black print:break-inside-avoid print:p-3 shadow-sm"
                >
                  {/* Top Product info */}
                  <div className="text-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 print:bg-gray-100 print:text-black inline-block mb-1">
                      {p.category || 'Abarrotes'}
                    </span>

                    <h4 className="font-display text-base print:text-lg font-bold text-white print:text-black leading-snug">
                      {p.name}
                    </h4>
                    <p className="text-xs text-[#8B8378] print:text-gray-600 mt-0.5 font-medium">
                      {p.unit || 'unidad'} • {p.store || 'Super'} • {p.zone || 'Alacena'}
                    </p>
                  </div>

                  {/* QR Code 40x40mm Level H (30% error correction) */}
                  <div className="my-3 flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-black/10 shadow-inner">
                    <QRCodeSVG
                      value={qrPayload}
                      size={130}
                      level="H"
                      includeMargin={false}
                    />
                    <span className="text-[10px] font-bold text-gray-700 mt-2 tracking-wide text-center uppercase print:text-black">
                      Si se acabó, escanea aquí
                    </span>
                  </div>

                  {/* Bottom Touch Button for Tablet / Phone (Hidden on Print) */}
                  <div className="print:hidden pt-2 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => handleQuickAdd(p)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        wasAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white/10 hover:bg-purple-600 text-white'
                      }`}
                    >
                      {wasAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>¡Agregado al Súper!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5 text-purple-300" />
                          <span>+1 a Lista de Compras</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Instruction Box - Hidden on Print */}
        <div className="p-4 border-t border-white/10 bg-[#121A2C] flex items-center justify-between text-xs text-gray-400 print:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>
              <strong>Tip de Operación:</strong> Imprime este catálogo en hojas y colócalo en una carpeta cerca de la cocina o alacena.
            </span>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Ahora</span>
          </button>
        </div>

      </div>
    </div>
  );
}
