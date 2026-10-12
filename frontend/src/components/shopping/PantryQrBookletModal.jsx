import React, { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, Printer, BookOpen, Search, Sparkles, 
  ShoppingCart, Check, Layers, Wine, Warehouse, 
  Scissors, Tag, Filter, FileText, CheckCircle2,
  Plus, Minus, CheckSquare, Square
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
  const [selectedProductIds, setSelectedProductIds] = useState(() => new Set(products.map(p => p.id)));
  const [copiesPerProduct, setCopiesPerProduct] = useState({});

  if (!isOpen) return null;

  // Filtrado de insumos
  const filteredProducts = products.filter((p) => {
    const matchesZone = selectedZoneFilter === 'ALL' || p.zone === selectedZoneFilter;
    const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.barcode || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesZone && matchesSearch;
  });

  // Toggle selección de un producto individual
  const toggleSelectProduct = (id) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Seleccionar / Deseleccionar todos
  const toggleSelectAll = () => {
    if (selectedProductIds.size === filteredProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  // Manejar copias por producto
  const handleCopiesChange = (id, delta) => {
    setCopiesPerProduct(prev => {
      const current = prev[id] || 1;
      const next = Math.max(1, Math.min(10, current + delta));
      return { ...prev, [id]: next };
    });
  };

  // Lista final a imprimir multiplicada por copias
  const printableList = useMemo(() => {
    const list = [];
    filteredProducts.forEach(p => {
      if (selectedProductIds.has(p.id)) {
        const copies = copiesPerProduct[p.id] || 1;
        for (let i = 0; i < copies; i++) {
          list.push({ ...p, copyIndex: i });
        }
      }
    });
    return list;
  }, [filteredProducts, selectedProductIds, copiesPerProduct]);

  const handlePrint = () => {
    audio.click();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in print:bg-white print:p-0 print:static print:z-0">
      
      {/* ═══════════════════════════════════════════════════════════════
          ESTILOS DE AISLAMIENTO ABSOLUTO PARA IMPRESIÓN LIMPIA EN PAPEL
         ═══════════════════════════════════════════════════════════════ */}
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
            padding: 5mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: letter portrait;
            margin: 8mm;
          }
          .break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .print-grid-stickers {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 5mm !important;
          }
          .print-grid-wine {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 6mm !important;
          }
          .print-grid-catalog {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 3mm !important;
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
                  Impresor de Etiquetas QR, Stickers & Cava
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E0B441]/15 text-[#E0B441] border border-[#E0B441]/30">
                  {printableList.length} etiquetas a imprimir
                </span>
              </div>
              <p className="text-xs text-[#B8AFA3]">
                Selecciona artículos, ajusta copias y manda a imprimir con líneas de corte limpias en papel blanco
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={printableList.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#12100E] bg-gradient-to-r from-[#E0B441] to-[#E5724A] hover:brightness-110 shadow-lg shadow-[#E0B441]/20 transition-all disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir ({printableList.length})</span>
            </button>
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
        </div>

        {/* Barra de Controles y Formatos - Hidden on Print */}
        <div className="p-3 sm:p-4 border-b border-[#2A2521] bg-[#171412] space-y-3 print:hidden no-print">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Formatos de Impresión */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#1C1814] border border-[#2A2521] overflow-x-auto no-scrollbar">
              <button
                onClick={() => { audio.click(); setPrintFormat('STICKERS'); }}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  printFormat === 'STICKERS'
                    ? 'bg-[#E0B441] text-[#12100E] font-bold shadow-sm'
                    : 'text-[#B8AFA3] hover:text-white'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Planilla Frascos (3x4)</span>
              </button>

              <button
                onClick={() => { audio.click(); setPrintFormat('WINE_TAGS'); }}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  printFormat === 'WINE_TAGS'
                    ? 'bg-[#A83A50] text-white font-bold shadow-sm'
                    : 'text-[#B8AFA3] hover:text-white'
                }`}
              >
                <Wine className="w-3.5 h-3.5" />
                <span>Collarines para Botellas</span>
              </button>

              <button
                onClick={() => { audio.click(); setPrintFormat('CATALOG'); }}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  printFormat === 'CATALOG'
                    ? 'bg-[#3D8B6E] text-white font-bold shadow-sm'
                    : 'text-[#B8AFA3] hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Catálogo de Alacena</span>
              </button>
            </div>

            {/* Búsqueda y Selección Rápida */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-[#8B8378] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar insumo..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#1C1814] border border-[#3D3630] text-xs text-[#F2EDE4] placeholder:text-[#6E655F] outline-none"
                />
              </div>

              <button
                onClick={toggleSelectAll}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#E0B441] border border-[#3D3630] transition-all shrink-0"
              >
                {selectedProductIds.size === filteredProducts.length ? 'Deseleccionar' : 'Todos'}
              </button>
            </div>

          </div>

          {/* Filtro de Zonas */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <span className="text-[11px] font-bold text-[#8B8378] uppercase tracking-wider shrink-0 mr-1">
              Zona:
            </span>
            <button
              onClick={() => setSelectedZoneFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                selectedZoneFilter === 'ALL'
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-white/5 text-[#8B8378] hover:text-white'
              }`}
            >
              Todas ({products.length})
            </button>
            {zones.map((z) => (
              <button
                key={z.id}
                onClick={() => setSelectedZoneFilter(z.name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  selectedZoneFilter === z.name
                    ? 'bg-[#E0B441]/25 text-[#E0B441] font-bold border border-[#E0B441]/40'
                    : 'bg-white/5 text-[#8B8378] hover:text-white'
              }`}
              >
                {z.name}
              </button>
            ))}
          </div>

        </div>

        {/* ═══════════════════════════════════════════════════════════════
            ÁREA DE IMPRESIÓN AISLADA (#printable-qr-catalog)
           ═══════════════════════════════════════════════════════════════ */}
        <div id="printable-qr-catalog" className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-4 bg-[#0F0D0B] print:bg-white text-white print:text-black custom-scrollbar">
          
          {/* Encabezado Oficial Impreso en Papel */}
          <div className="hidden print:block pb-3 mb-4 border-b-2 border-black text-black">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-700 block">
                  ALACENA ENTERPRISE • SISTEMA RESIDENCIAL DE ALMACÉN & CAVA
                </span>
                <h1 className="text-lg font-black uppercase tracking-tight text-black mt-0.5">
                  {printFormat === 'STICKERS' 
                    ? 'PLANILLA DE ETIQUETAS ADHESIVAS PARA FRASCOS (RECORTABLES)'
                    : printFormat === 'WINE_TAGS'
                    ? 'COLLARINES CON TROQUEL PARA CUELLO DE BOTELLAS DE CAVA'
                    : 'CATÁLOGO FÍSICO DE ALMACÉN Y ALACENA DE COCINA'}
                </h1>
                <p className="text-[10px] font-semibold text-gray-700">
                  Residencia: <strong>{activeHouse?.name || 'Residencia Principal'}</strong> • Ubicación: <strong>{selectedZoneFilter === 'ALL' ? 'Todas las Zonas' : selectedZoneFilter}</strong>
                </p>
              </div>
              <div className="text-right text-[10px] font-mono text-gray-700">
                Impreso: {new Date().toLocaleDateString('es-MX')} • Total: {printableList.length} etiquetas
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════
              FORMATO 1: STICKERS PARA FRASCOS Y ENVASES (Con Guías de Corte)
             ═════════════════════════════════════════════════════════════ */}
          {printFormat === 'STICKERS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:print-grid-stickers">
              {filteredProducts.map((p) => {
                const isSelected = selectedProductIds.has(p.id);
                const copies = copiesPerProduct[p.id] || 1;
                const barcode = p.barcode || `ALC-${p.id.replace('prod-', '').toUpperCase()}`;
                
                // QR Ultracompacto para máxima legibilidad con cámara
                const compactQr = barcode;

                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between break-inside-avoid relative ${
                      isSelected 
                        ? 'bg-[#1C1814] border-[#3D3630] print:bg-white print:border-2 print:border-dashed print:border-gray-500' 
                        : 'bg-[#14110F]/40 border-[#2A2521] opacity-40 print:hidden'
                    }`}
                  >
                    {/* Guía de tijera recortable en papel */}
                    <div className="hidden print:flex absolute -top-2.5 right-3 bg-white px-1 text-[8px] text-gray-600 font-mono items-center gap-0.5 border border-gray-300 rounded">
                      <Scissors className="w-2.5 h-2.5" />
                      <span>recortar</span>
                    </div>

                    {/* Controles de Selección en Pantalla */}
                    <div className="print:hidden no-print flex items-center justify-between pb-2 border-b border-[#2A2521]">
                      <button
                        type="button"
                        onClick={() => toggleSelectProduct(p.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#B8AFA3] hover:text-white"
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 text-[#E0B441]" /> : <Square className="w-4 h-4" />}
                        <span>{isSelected ? 'Incluido' : 'Omitir'}</span>
                      </button>

                      {isSelected && (
                        <div className="flex items-center gap-1 bg-[#14110F] px-1.5 py-0.5 rounded-lg border border-[#3D3630]">
                          <button onClick={() => handleCopiesChange(p.id, -1)} className="text-xs text-[#8B8378] hover:text-white px-1">-</button>
                          <span className="text-[11px] font-mono font-bold text-[#E0B441]">{copies} copias</span>
                          <button onClick={() => handleCopiesChange(p.id, 1)} className="text-xs text-[#8B8378] hover:text-white px-1">+</button>
                        </div>
                      )}
                    </div>

                    {/* Cabecera del Sticker */}
                    <div className="text-center pt-1 pb-1.5 border-b border-[#2A2521] print:border-gray-300">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#E0B441] print:text-gray-700 block">
                        ALACENA • {p.zone || 'DESPENSA'}
                      </span>
                      <h4 className="font-display text-sm font-extrabold text-white print:text-black leading-tight mt-0.5 line-clamp-1">
                        {p.name}
                      </h4>
                      <span className="text-[10px] font-bold text-[#8B8378] print:text-gray-600 block mt-0.5">
                        {p.quantity} {p.unit} • {p.category || 'Insumo'}
                      </span>
                    </div>

                    {/* Código QR Ultranítido */}
                    <div className="my-2.5 flex justify-center">
                      <div className="p-2 bg-white rounded-xl border border-gray-200 inline-block shadow-sm">
                        <QRCodeSVG
                          value={compactQr}
                          size={110}
                          level="M"
                          includeMargin={false}
                        />
                      </div>
                    </div>

                    {/* Pie con clave de escaneo y modo de uso */}
                    <div className="text-center">
                      <span className="font-mono text-[11px] font-black text-white print:text-black tracking-wider block bg-white/5 print:bg-gray-100 py-0.5 px-2 rounded border border-white/5 print:border-gray-200">
                        {barcode}
                      </span>
                      <span className="text-[7.5px] font-bold text-[#8B8378] print:text-gray-600 block mt-1">
                        📱 Escanear: ➕ Entrada • ➖ Consumo • 🛒 Pedir
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              FORMATO 2: COLLARINES PARA CAVA (Con Troquel para Cuello)
             ═════════════════════════════════════════════════════════════ */}
          {printFormat === 'WINE_TAGS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 print:print-grid-wine">
              {filteredProducts.map((p) => {
                const isSelected = selectedProductIds.has(p.id);
                const barcode = p.barcode || `ALC-${p.id.replace('prod-', '').toUpperCase()}`;
                const compactQr = barcode;

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between break-inside-avoid relative text-center ${
                      isSelected 
                        ? 'bg-[#1C1814] border-[#A83A50]/40 print:bg-white print:border-2 print:border-gray-600' 
                        : 'bg-[#14110F]/40 border-[#2A2521] opacity-40 print:hidden'
                    }`}
                  >
                    {/* Controles en Pantalla */}
                    <div className="print:hidden no-print flex items-center justify-between pb-2 border-b border-[#2A2521] mb-2">
                      <button
                        type="button"
                        onClick={() => toggleSelectProduct(p.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#B8AFA3] hover:text-white"
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 text-rose-400" /> : <Square className="w-4 h-4" />}
                        <span>{isSelected ? 'Incluido' : 'Omitir'}</span>
                      </button>
                    </div>

                    {/* Orificio Troquelable para Cuello de Botella (38mm) */}
                    <div className="flex flex-col items-center justify-center pb-3 border-b-2 border-dashed border-gray-400">
                      <div className="w-14 h-14 rounded-full border-2 border-dashed border-rose-500 bg-rose-50 flex items-center justify-center text-[8px] font-bold text-rose-800 text-center px-1">
                        ✂️ Cortar círculo para cuello
                      </div>
                      <span className="text-[8px] font-mono text-gray-500 mt-1 uppercase">
                        Colgar en rack de cava
                      </span>
                    </div>

                    {/* Ficha Sommelier de la Botella */}
                    <div className="py-2">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#A83A50] block">
                        CAVAPRO • GRAN RESERVA
                      </span>
                      <h4 className="font-display text-sm font-bold text-white print:text-black leading-tight mt-0.5 line-clamp-1">
                        {p.name}
                      </h4>
                      <span className="text-[10px] font-bold text-gray-500 block mt-0.5">
                        {p.category || 'Vino Tinto'} • {p.zone || 'Cava'}
                      </span>
                    </div>

                    {/* QR Code */}
                    <div className="my-2 flex justify-center">
                      <div className="p-2 bg-white rounded-xl border border-gray-200 inline-block shadow-sm">
                        <QRCodeSVG
                          value={compactQr}
                          size={105}
                          level="M"
                          includeMargin={false}
                        />
                      </div>
                    </div>

                    {/* Código y notas */}
                    <div>
                      <span className="font-mono text-xs font-black text-white print:text-black tracking-wider block bg-white/5 print:bg-gray-100 py-0.5 px-2 rounded">
                        {barcode}
                      </span>
                      <span className="text-[8px] font-bold text-gray-500 block mt-1">
                        Escanear al descorchar para registrar salida
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              FORMATO 3: CATÁLOGO TABULAR DE ALACENA (Para Encuadernar)
             ═════════════════════════════════════════════════════════════ */}
          {printFormat === 'CATALOG' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:print-grid-catalog">
              {filteredProducts.map((p) => {
                const isSelected = selectedProductIds.has(p.id);
                const barcode = p.barcode || `ALC-${p.id.replace('prod-', '').toUpperCase()}`;
                const compactQr = barcode;

                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border transition-all flex items-center gap-3 break-inside-avoid ${
                      isSelected 
                        ? 'bg-[#1C1814] border-[#3D3630] print:bg-white print:border print:border-gray-300' 
                        : 'bg-[#14110F]/40 border-[#2A2521] opacity-40 print:hidden'
                    }`}
                  >
                    <div className="p-1.5 bg-white rounded-lg border border-gray-200 shrink-0">
                      <QRCodeSVG
                        value={compactQr}
                        size={65}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase text-[#E0B441] print:text-gray-600 font-mono">
                          {barcode}
                        </span>
                        <span className="text-[9px] font-bold text-gray-500">
                          {p.zone || 'Alacena'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white print:text-black truncate leading-tight mt-0.5">
                        {p.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 print:text-gray-600 mt-0.5">
                        Existencia: <strong>{p.quantity} {p.unit}</strong> • Tienda: {p.store || 'Supermercado'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer en Pantalla */}
        <div className="p-4 border-t border-[#2A2521] bg-[#1C1814] flex items-center justify-between text-xs text-[#8B8378] print:hidden no-print flex-wrap gap-2">
          <span>
            💡 <strong>Consejo de impresión:</strong> En el cuadro de diálogo de la impresora, desactiva <em>"Encabezados y pies de página"</em> para obtener hojas 100% limpias.
          </span>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-all"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
