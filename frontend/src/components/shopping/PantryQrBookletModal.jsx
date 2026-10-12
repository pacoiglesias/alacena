import React, { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, Printer, BookOpen, Search, Sparkles, 
  ShoppingCart, Check, Layers, Wine, Warehouse, 
  Scissors, Tag, Filter, FileText, CheckCircle2
} from 'lucide-react';
import { audio } from '../../services/audioService';

export default function PantryQrBookletModal({
  isOpen,
  onClose,
  products = [],
  zones = [],
  activeHouse,
  onQuickAddToShoppingList,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('ALL');
  const [printFormat, setPrintFormat] = useState('STICKERS'); // 'STICKERS' | 'WINE_TAGS' | 'CATALOG'
  const [addedItems, setAddedItems] = useState({});

  if (!isOpen) return null;

  // Filtrado de insumos
  const filteredProducts = products.filter((p) => {
    const matchesZone = selectedZoneFilter === 'ALL' || p.zone === selectedZoneFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesZone && matchesSearch;
  });

  const handlePrint = () => {
    audio.click();
    window.print();
  };

  const handleQuickAdd = (product) => {
    audio.success();
    if (onQuickAddToShoppingList) {
      onQuickAddToShoppingList({
        id: `shop-${Date.now()}-${product.id}`,
        name: product.name,
        quantity: 1,
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
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in print:bg-white print:p-0 print:static print:z-0">
      
      {/* Estilos CSS Específicos para Aislamiento Absoluto en Impresión */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-qr-catalog, #printable-qr-catalog * {
            visibility: visible !important;
          }
          #printable-qr-catalog {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
        }
      `}</style>

      <div className="relative w-full max-w-5xl max-h-[94vh] overflow-hidden flex flex-col rounded-3xl bg-[#14110F] border border-[#E0B441]/30 shadow-2xl print:border-none print:shadow-none print:bg-white print:max-h-none print:rounded-none">
        
        {/* Header - Hidden on Print */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#2A2521] bg-[#1C1814] print:hidden no-print">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#E0B441]/20 to-[#C8542A]/20 border border-[#E0B441]/40 text-[#E0B441]">
              <Printer className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white font-display">
                  Centro de Impresión Profesional de Códigos QR
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold text-[#E0B441] bg-[#E0B441]/20 border border-[#E0B441]/30 rounded-full font-mono">
                  {filteredProducts.length} etiquetas
                </span>
              </div>
              <p className="text-xs text-[#B8AFA3] mt-0.5">
                Stickers adhesivos para frascos, fichas para botellas de cava y catálogo físico de cocina.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#C8542A] to-[#E0B441] hover:brightness-110 rounded-xl transition-all shadow-md shadow-[#C8542A]/30 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ Mandar a Imprimir (PDF)</span>
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

        {/* Controles de Formato y Filtros - Hidden on Print */}
        <div className="p-4 border-b border-[#2A2521] bg-[#161311] space-y-3 print:hidden no-print">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Selector de Formato de Impresión */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#1C1814] border border-[#2A2521] overflow-x-auto">
              {[
                { id: 'STICKERS', label: '🏷️ Stickers Frascos (Guías de Corte)', icon: Scissors },
                { id: 'WINE_TAGS', label: '🍷 Fichas de Cava (Botellas)', icon: Wine },
                { id: 'CATALOG', label: '📖 Catálogo Editorial (Carpeta)', icon: BookOpen },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => {
                    audio.click();
                    setPrintFormat(fmt.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    printFormat === fmt.id
                      ? 'bg-[#E0B441] text-black shadow-sm'
                      : 'text-[#B8AFA3] hover:text-white'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>

            {/* Búsqueda rápida */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar insumo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#E0B441]"
              />
            </div>
          </div>

          {/* Filtro por Ubicación (Zonas del Hogar) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <span className="text-[11px] font-bold text-[#8B8378] uppercase shrink-0 mr-1">
              Zona:
            </span>
            <button
              onClick={() => { audio.click(); setSelectedZoneFilter('ALL'); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                selectedZoneFilter === 'ALL'
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-[#8B8378] hover:text-white'
              }`}
            >
              Todas las Zonas
            </button>
            {zones.map((z) => (
              <button
                key={z.id}
                onClick={() => { audio.click(); setSelectedZoneFilter(z.name); }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  selectedZoneFilter === z.name
                    ? 'bg-[#E0B441]/20 text-[#E0B441] border border-[#E0B441]/40'
                    : 'bg-white/5 text-[#8B8378] hover:text-white'
                }`}
              >
                {z.type === 'WINE_CELLAR' ? '🍷' : '🏠'}
                <span>{z.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            ÁREA DE IMPRESIÓN OFICIAL (100% LIMPIA PARA IMPRESORA Y PDF)
           ═════════════════════════════════════════════════════════════════ */}
        <div id="printable-qr-catalog" className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-6 print:overflow-visible bg-[#0F0D0B] print:bg-white text-white print:text-black">
          
          {/* Cabecera Impresa del Documento (Solo en papel) */}
          <div className="hidden print:block pb-4 mb-5 border-b-2 border-black text-black">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-600 block">
                  SISTEMA ALACENA & CAVA • CONTROL DE INVENTARIO DEL HOGAR
                </span>
                <h1 className="text-xl font-black uppercase tracking-tight text-black mt-0.5">
                  {printFormat === 'STICKERS' 
                    ? 'PLANILLA DE ETIQUETAS ADHESIVAS PARA FRASCOS Y ENVASES'
                    : printFormat === 'WINE_TAGS'
                    ? 'CATÁLOGO DE COLLARINES PARA CAVA Y BOTELLAS'
                    : 'CATÁLOGO FÍSICO DE ALACENA Y COCINA'}
                </h1>
                <p className="text-xs font-semibold text-gray-700 mt-1">
                  Residencia: {activeHouse?.name || 'Residencia Principal'} • Ubicación: {selectedZoneFilter === 'ALL' ? 'Todas las Zonas' : selectedZoneFilter}
                </p>
              </div>
              <div className="text-right text-xs font-mono text-gray-600">
                Impreso: {new Date().toLocaleDateString('es-MX')} • {filteredProducts.length} ítems
              </div>
            </div>
            <div className="text-[10px] bg-gray-100 p-2 rounded-lg mt-2 border border-gray-300 font-medium">
              💡 <strong>Instrucciones para el Personal del Hogar:</strong> Apunta con la app en tu celular al código para agregar (+1), descontar consumo (-1) o enviar a la lista de compras cuando el envase esté por acabarse.
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════
              FORMATO 1: STICKERS PARA FRASCOS Y TUPPERS (3x4 con guías de corte)
             ═════════════════════════════════════════════════════════════ */}
          {printFormat === 'STICKERS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-4">
              {filteredProducts.map((p) => {
                const barcode = p.barcode || `ALC-${p.id.replace('prod-', '').toUpperCase()}`;
                const qrPayload = JSON.stringify({
                  app: 'ALACENA_ENTERPRISE',
                  type: 'PANTRY_ITEM',
                  id: p.id,
                  barcode,
                  name: p.name,
                  unit: p.unit || 'kg',
                  zone: p.zone || 'Alacena Principal',
                });

                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-[#1C1814] border border-[#2A2521] flex flex-col justify-between print:bg-white print:text-black print:border-2 print:border-dashed print:border-gray-400 print:rounded-xl print:p-3 print:break-inside-avoid shadow-sm relative group"
                  >
                    {/* Tijera decorativa de recorte en papel */}
                    <div className="hidden print:flex absolute -top-2.5 right-3 bg-white px-1 text-[9px] text-gray-500 font-mono items-center gap-0.5">
                      <Scissors className="w-2.5 h-2.5" />
                      <span>recortar</span>
                    </div>

                    <div className="text-center border-b border-[#2A2521] print:border-gray-200 pb-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#E0B441] print:text-gray-600 block">
                        {p.category || 'Abarrotes'} • {p.zone || 'Alacena'}
                      </span>
                      <h4 className="font-display text-sm font-bold text-white print:text-black leading-tight mt-0.5 truncate">
                        {p.name}
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-[#8B8378] print:text-gray-600 block mt-0.5">
                        {barcode}
                      </span>
                    </div>

                    {/* QR Code Nítido */}
                    <div className="my-2.5 flex justify-center">
                      <div className="p-2.5 bg-white rounded-xl border border-gray-200 inline-block shadow-sm">
                        <QRCodeSVG
                          value={qrPayload}
                          size={110}
                          level="H"
                          includeMargin={false}
                        />
                      </div>
                    </div>

                    {/* Pie del sticker */}
                    <div className="text-[9px] text-center font-bold text-[#8B8378] print:text-black bg-white/5 print:bg-gray-100 py-1 px-2 rounded-lg border border-white/5 print:border-gray-200">
                      📱 ➕ Entrada • ➖ Consumo • 🛒 Súper
                    </div>

                    {/* Botón rápido en pantalla (oculto en papel) */}
                    <div className="print:hidden no-print pt-2 mt-2 border-t border-[#2A2521] flex justify-center">
                      <button
                        onClick={() => handleQuickAdd(p)}
                        className="text-[11px] font-bold text-[#E0B441] hover:underline flex items-center gap-1"
                      >
                        {addedItems[p.id] ? '✓ Agregado al Súper' : '+ Añadir al Súper'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              FORMATO 2: FICHAS / COLLARINES DE CAVA (Para Cuello de Botella)
             ═════════════════════════════════════════════════════════════ */}
          {printFormat === 'WINE_TAGS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-4">
              {filteredProducts.map((p) => {
                const barcode = p.barcode || `ALC-${p.id.replace('prod-', '').toUpperCase()}`;
                const qrPayload = JSON.stringify({
                  app: 'ALACENA_ENTERPRISE',
                  type: 'PANTRY_ITEM',
                  id: p.id,
                  barcode,
                  name: p.name,
                  vintage: p.vintage,
                  zone: p.zone || 'Cava',
                });

                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-[#1C1814] border border-[#2A2521] flex flex-col justify-between print:bg-white print:text-black print:border-2 print:border-dashed print:border-gray-400 print:rounded-2xl print:p-4 print:break-inside-avoid shadow-sm relative"
                  >
                    {/* Círculo guía para perforar cuello de botella */}
                    <div className="hidden print:flex flex-col items-center justify-center mb-2 pb-2 border-b border-gray-200">
                      <div className="w-8 h-8 rounded-full border border-dashed border-gray-400 flex items-center justify-center text-[7px] text-gray-400 font-mono">
                        corte
                      </div>
                      <span className="text-[7px] text-gray-400 mt-0.5">Colgar en cuello de botella</span>
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E0B441] print:text-[#6B1F2E] block">
                        🍷 CAVA DE VINOS & RESERVA
                      </span>
                      <h4 className="font-display text-base font-bold text-white print:text-black leading-tight mt-1">
                        {p.name}
                      </h4>
                      <p className="text-xs text-[#E0B441] print:text-gray-700 font-bold mt-0.5">
                        {p.vintage ? `Añada ${p.vintage}` : ''} • {p.region || 'Cava'} • {p.sommelierPoints ? `${p.sommelierPoints} Pts` : ''}
                      </p>
                    </div>

                    <div className="my-3 flex justify-center">
                      <div className="p-2.5 bg-white rounded-xl border border-gray-200 inline-block">
                        <QRCodeSVG value={qrPayload} size={110} level="H" />
                      </div>
                    </div>

                    <div className="text-[9px] text-gray-400 print:text-gray-700 border-t border-[#2A2521] print:border-gray-200 pt-2 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Ubicación:</span>
                        <strong className="text-white print:text-black">{p.cavaLocation || p.zone || 'Cava'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Maridaje:</span>
                        <span className="truncate max-w-[130px]">{p.foodPairing || 'Cortes y quesos'}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>Código:</span>
                        <span>{barcode}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              FORMATO 3: CATÁLOGO EDITORIAL DE COCINA (Lista Compacta Carpeta)
             ═════════════════════════════════════════════════════════════ */}
          {printFormat === 'CATALOG' && (
            <div className="space-y-3 print:space-y-2">
              {filteredProducts.map((p, idx) => {
                const barcode = p.barcode || `ALC-${p.id.replace('prod-', '').toUpperCase()}`;
                const qrPayload = JSON.stringify({
                  type: 'PANTRY_ITEM',
                  id: p.id,
                  barcode,
                  name: p.name,
                  zone: p.zone,
                });

                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-[#1C1814] border border-[#2A2521] flex items-center justify-between gap-4 print:bg-white print:text-black print:border-b print:border-gray-300 print:rounded-none print:break-inside-avoid"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-xs font-mono text-[#8B8378] print:text-gray-500 shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white print:text-black truncate">
                          {p.name}
                        </h4>
                        <div className="text-[11px] text-[#8B8378] print:text-gray-600 flex items-center gap-2 mt-0.5">
                          <span>{p.category}</span>
                          <span>•</span>
                          <span>{p.zone}</span>
                          <span>•</span>
                          <span className="font-mono text-[#E0B441] print:text-black">{barcode}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block print:block text-xs">
                        <div className="font-bold text-white print:text-black">
                          {p.quantity} {p.unit}
                        </div>
                        <div className="text-[10px] text-[#8B8378] print:text-gray-500">
                          ${(p.unitPriceMxn || 0).toFixed(2)} MXN
                        </div>
                      </div>

                      <div className="p-1.5 bg-white rounded-lg border border-gray-200">
                        <QRCodeSVG value={qrPayload} size={55} level="M" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer Bar - Hidden on Print */}
        <div className="p-4 border-t border-[#2A2521] bg-[#161311] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8B8378] print:hidden no-print">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E0B441]" />
            <span>
              <strong>Recomendación:</strong> Puedes imprimir en papel normal y recortar con tijera, o imprimir sobre hojas de etiquetas autoadhesivas tamaño carta.
            </span>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#C8542A] to-[#E0B441] hover:brightness-110 rounded-xl transition-all shadow-md shrink-0 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir {filteredProducts.length} Etiquetas</span>
          </button>
        </div>

      </div>
    </div>
  );
}
