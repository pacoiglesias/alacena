import React, { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  SlidersHorizontal, 
  Store, 
  Layers, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ShoppingCart,
  Calendar,
  Building,
  DollarSign
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { SUPERMARKET_DEPARTMENTS, getDepartmentForItem } from './ShoppingListView';

export default function PrintableShoppingListModal({
  isOpen,
  onClose,
  shoppingList = [],
  activeHouse,
  totalEstimatedMxn = 0,
}) {
  const [groupBy, setGroupBy] = useState('dept'); // 'dept' | 'store'
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending' | 'all'
  const [showPrices, setShowPrices] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Filtrado de items
  const filteredItems = useMemo(() => {
    return shoppingList.filter((item) => {
      if (filterStatus === 'pending') {
        return !item.checked;
      }
      return true;
    });
  }, [shoppingList, filterStatus]);

  // Total estimado recalculado según los items mostrados
  const computedTotalMxn = useMemo(() => {
    return filteredItems.reduce((acc, it) => acc + ((it.estimatedPriceMxn || 0) * (it.quantity || 1)), 0);
  }, [filteredItems]);

  // Agrupación por Pasillos
  const itemsByDept = useMemo(() => {
    const map = {};
    SUPERMARKET_DEPARTMENTS.filter(d => d.id !== 'ALL').forEach(dept => {
      map[dept.id] = {
        name: dept.name,
        items: []
      };
    });

    filteredItems.forEach((item) => {
      const deptId = getDepartmentForItem(item);
      if (!map[deptId]) {
        map[deptId] = { name: '📦 Varios / Otros', items: [] };
      }
      map[deptId].items.push(item);
    });

    return Object.entries(map).filter(([_, group]) => group.items.length > 0);
  }, [filteredItems]);

  // Agrupación por Tienda / Proveedor
  const itemsByStore = useMemo(() => {
    const map = {};
    filteredItems.forEach((item) => {
      const storeName = item.store || 'Supermercado Principal';
      if (!map[storeName]) {
        map[storeName] = [];
      }
      map[storeName].push(item);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filteredItems]);

  // Generador de QR Data para abrir la lista en el móvil
  const qrSyncUrl = `https://alacena-enterprise-prod.web.app/?tab=shopping&house=${encodeURIComponent(activeHouse?.id || 'casa-palmas')}`;

  // Impresión nativa
  const handlePrint = () => {
    audio.click();
    window.print();
  };

  // Copiar al portapapeles en formato texto / WhatsApp
  const handleCopyText = async () => {
    audio.click();
    const dateStr = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    let text = `🛒 *LISTA DE COMPRAS — ${activeHouse?.name?.toUpperCase() || 'RESIDENCIA'}*\n`;
    text += `📅 Fecha: ${dateStr}\n`;
    text += `💰 Presupuesto Estimado: $${computedTotalMxn.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN\n`;
    text += `📦 Total Artículos: ${filteredItems.length}\n\n`;

    if (groupBy === 'dept') {
      itemsByDept.forEach(([_, group]) => {
        text += `\n*${group.name}* (${group.items.length})\n`;
        group.items.forEach(it => {
          const checkedMark = it.checked ? '✅' : '⬜';
          const priceStr = showPrices && it.estimatedPriceMxn ? ` — ~$${((it.estimatedPriceMxn || 0) * (it.quantity || 1)).toFixed(2)} MXN` : '';
          text += `${checkedMark} ${it.name} • ${it.quantity} ${it.unit} (${it.store || 'Super'})${priceStr}\n`;
        });
      });
    } else {
      itemsByStore.forEach(([storeName, items]) => {
        text += `\n*🏪 ${storeName.toUpperCase()}* (${items.length})\n`;
        items.forEach(it => {
          const checkedMark = it.checked ? '✅' : '⬜';
          const priceStr = showPrices && it.estimatedPriceMxn ? ` — ~$${((it.estimatedPriceMxn || 0) * (it.quantity || 1)).toFixed(2)} MXN` : '';
          text += `${checkedMark} ${it.name} • ${it.quantity} ${it.unit}${priceStr}\n`;
        });
      });
    }

    text += `\n🔗 *Sincronización digital:* ${qrSyncUrl}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      audio.success();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Lista copiada.');
    }
  };

  // Descargar archivo HTML autónomo para visualización o archivo
  const handleDownloadHtml = () => {
    audio.click();
    const dateStr = new Date().toLocaleDateString('es-MX');
    const content = `<!DOCTYPE html>
<html lang="es-MX">
<head>
  <meta charset="UTF-8">
  <title>Lista de Compras - ${activeHouse?.name || 'Residencia'} - ${dateStr}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 2cm; color: #111; line-height: 1.4; }
    h1 { font-size: 22px; text-transform: uppercase; margin-bottom: 4px; }
    .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; }
    .meta { font-size: 13px; color: #444; }
    .group-header { background: #f0f0f0; border-left: 4px solid #6B1F2E; padding: 6px 10px; font-weight: bold; font-size: 14px; margin-top: 18px; margin-bottom: 8px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
    th { text-align: left; padding: 6px; border-bottom: 1px solid #999; }
    td { padding: 6px; border-bottom: 1px solid #e0e0e0; }
    .box { width: 20px; text-align: center; font-size: 14px; font-family: monospace; }
    .price { text-align: right; font-family: monospace; }
    .signatures { margin-top: 40px; padding-top: 15px; border-top: 1px solid #000; display: flex; justify-content: space-between; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>ALACENA • LISTA DE COMPRAS</h1>
      <div class="meta">${activeHouse?.name || 'Residencia'} • Generada: ${dateStr}</div>
    </div>
    <div style="text-align: right;" class="meta">
      <div><strong>${filteredItems.length} Artículos</strong></div>
      <div>Presupuesto: $${computedTotalMxn.toFixed(2)} MXN</div>
    </div>
  </div>
  ${(groupBy === 'dept' ? itemsByDept : itemsByStore.map(([s, it]) => [s, { name: '🏪 ' + s, items: it }])).map(([_, group]) => `
    <div class="group-header">${group.name} (${group.items.length})</div>
    <table>
      <thead>
        <tr>
          <th class="box">[ ]</th>
          <th>Producto</th>
          <th style="width: 100px; text-align: right;">Cantidad</th>
          <th style="width: 120px;">Tienda</th>
          <th class="price" style="width: 90px;">Total MXN</th>
        </tr>
      </thead>
      <tbody>
        ${group.items.map(it => `
          <tr>
            <td class="box">☐</td>
            <td><strong>${it.name}</strong>${it.notes ? `<br><small style="color:#666">${it.notes}</small>` : ''}</td>
            <td style="text-align: right;">${it.quantity} ${it.unit}</td>
            <td>${it.store || 'Super'}</td>
            <td class="price">$${((it.estimatedPriceMxn || 0) * (it.quantity || 1)).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `).join('')}
  <div class="signatures">
    <div>Firma Encargado de Compras: _____________________________</div>
    <div>Recibido en Despensa: _____________________________</div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lista-super-${activeHouse?.name?.toLowerCase().replace(/\s+/g, '-') || 'alacena'}-${dateStr}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in print:bg-white print:p-0 print:static print:inset-auto">
      
      {/* Contenedor Principal del Modal */}
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-3xl bg-[#12100E] border border-white/10 shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:max-h-none print:rounded-none">
        
        {/* ======================================================== */}
        {/* BARRA SUPERIOR DE CONTROLES (OCULTA AL IMPRIMIR) */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#1A1614] gap-4 print:hidden">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6B1F2E]/30 border border-[#6B1F2E]/50 flex items-center justify-center text-[#E5724A]">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-display text-[#F2EDE4] flex items-center gap-2">
                Hoja de Compras Oficial & PDF
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#C8542A]/20 text-[#E5724A] font-sans font-medium">
                  {filteredItems.length} insumos
                </span>
              </h3>
              <p className="text-xs text-[#B8AFA3]">
                Vista previa de impresión en blanco y negro • Apta para papel o PDF
              </p>
            </div>
          </div>

          {/* Acciones principales */}
          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
            
            {/* Copiar WhatsApp / Texto */}
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#F2EDE4] bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              title="Copiar lista en texto para WhatsApp"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#B8AFA3]" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>

            {/* Descargar HTML imprimible */}
            <button
              onClick={handleDownloadHtml}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#F2EDE4] bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              title="Descargar archivo HTML independiente"
            >
              <Download className="w-4 h-4 text-[#B8AFA3]" />
              <span>Descargar</span>
            </button>

            {/* Botón Imprimir / PDF Principal */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#C8542A] hover:bg-[#E5724A] transition-all shadow-lg shadow-[#C8542A]/30 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ Imprimir / Guardar PDF</span>
            </button>

            {/* Cerrar modal */}
            <button
              onClick={() => {
                audio.click();
                onClose();
              }}
              className="p-2 text-[#B8AFA3] hover:text-white rounded-xl hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BARRA DE PREFERENCIAS Y FILTROS (OCULTA AL IMPRIMIR) */}
        {/* ======================================================== */}
        <div className="px-4 py-3 border-b border-white/10 bg-[#141210] flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#B8AFA3] flex items-center gap-1 font-medium">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Organizar por:
            </span>
            
            {/* Agrupación */}
            <div className="flex rounded-lg bg-black/40 p-0.5 border border-white/10">
              <button
                onClick={() => { audio.click(); setGroupBy('dept'); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${groupBy === 'dept' ? 'bg-[#6B1F2E] text-white shadow-sm' : 'text-[#B8AFA3] hover:text-white'}`}
              >
                🥩 Pasillos del Súper
              </button>
              <button
                onClick={() => { audio.click(); setGroupBy('store'); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${groupBy === 'store' ? 'bg-[#6B1F2E] text-white shadow-sm' : 'text-[#B8AFA3] hover:text-white'}`}
              >
                🏪 Proveedor / Tienda
              </button>
            </div>

            {/* Filtrar estatus */}
            <div className="flex rounded-lg bg-black/40 p-0.5 border border-white/10 ml-2">
              <button
                onClick={() => { audio.click(); setFilterStatus('pending'); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${filterStatus === 'pending' ? 'bg-[#C8542A] text-white shadow-sm' : 'text-[#B8AFA3] hover:text-white'}`}
              >
                Solo Pendientes ({shoppingList.filter(i => !i.checked).length})
              </button>
              <button
                onClick={() => { audio.click(); setFilterStatus('all'); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${filterStatus === 'all' ? 'bg-[#C8542A] text-white shadow-sm' : 'text-[#B8AFA3] hover:text-white'}`}
              >
                Todos ({shoppingList.length})
              </button>
            </div>
          </div>

          {/* Opciones de la hoja */}
          <div className="flex items-center gap-4 text-[#B8AFA3]">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white select-none">
              <input
                type="checkbox"
                checked={showPrices}
                onChange={(e) => setShowPrices(e.target.checked)}
                className="rounded border-white/20 text-[#C8542A] focus:ring-0"
              />
              <span>Mostrar Precios</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white select-none">
              <input
                type="checkbox"
                checked={showQrCode}
                onChange={(e) => setShowQrCode(e.target.checked)}
                className="rounded border-white/20 text-[#C8542A] focus:ring-0"
              />
              <span>Código QR</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white select-none">
              <input
                type="checkbox"
                checked={showSignatures}
                onChange={(e) => setShowSignatures(e.target.checked)}
                className="rounded border-white/20 text-[#C8542A] focus:ring-0"
              />
              <span>Firmas</span>
            </label>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ÁREA DE VISUALIZACIÓN / HOJA IMPRIMIBLE (BLANCO EDITORIAL) */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-black/40 print:bg-white print:p-0 print:overflow-visible">
          
          <div className="printable-paper-sheet max-w-3xl mx-auto bg-white text-black p-6 sm:p-10 rounded-2xl shadow-xl border border-gray-200 print:shadow-none print:border-none print:p-2 print:max-w-none">
            
            {/* Cabecera Editorial de la Hoja */}
            <div className="border-b-2 border-black pb-4 mb-5 flex justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-md bg-black text-white font-serif font-black text-xs flex items-center justify-center">
                    A
                  </div>
                  <span className="text-[11px] font-black tracking-widest text-gray-700 uppercase">
                    ALACENA ENTERPRISE • GESTIÓN PATRIMONIAL
                  </span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black font-display">
                  LISTA OFICIAL DE COMPRAS
                </h1>
                
                <p className="text-xs font-bold text-gray-800 mt-0.5">
                  {activeHouse?.name?.toUpperCase() || 'RESIDENCIA PRINCIPAL'} • {groupBy === 'dept' ? 'Organizada por Pasillos Físicos' : 'Organizada por Proveedor / Tienda'}
                </p>
              </div>

              {/* Columna Derecha: Metadatos y QR */}
              <div className="flex items-center gap-4 text-right">
                <div className="text-xs space-y-0.5">
                  <div className="text-gray-600 font-medium">
                    {new Date().toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="font-extrabold text-black font-mono">
                    {filteredItems.length} Insumos
                  </div>
                  {showPrices && (
                    <div className="font-mono font-bold text-black text-sm bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
                      ${computedTotalMxn.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                    </div>
                  )}
                </div>

                {showQrCode && (
                  <div className="p-1.5 bg-white border border-black rounded-lg hidden sm:block print:block">
                    <QRCodeSVG
                      value={qrSyncUrl}
                      size={64}
                      level="M"
                      includeMargin={false}
                    />
                    <div className="text-[8px] font-bold text-center text-gray-600 uppercase mt-0.5">
                      Escanear
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Aviso breve si no hay items */}
            {filteredItems.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
                <p className="font-bold text-base">La lista de compras está totalmente vacía o completada.</p>
                <p className="text-xs">No hay productos pendientes por comprar en este momento.</p>
              </div>
            )}

            {/* ======================================================== */}
            {/* CONTENIDO PRINCIPAL: AGRUPADO POR PASILLO O PROVEEDOR */}
            {/* ======================================================== */}
            <div className="space-y-5">
              
              {/* Opción 1: Por Pasillos del Supermercado */}
              {groupBy === 'dept' && itemsByDept.map(([deptId, group]) => (
                <div key={deptId} className="break-inside-avoid">
                  
                  {/* Encabezado del Pasillo */}
                  <div className="bg-gray-100 border border-gray-300 px-3 py-1.5 flex justify-between items-center rounded-sm mb-1.5">
                    <span className="font-black text-xs uppercase tracking-wide text-black">
                      {group.name}
                    </span>
                    <span className="text-[10px] font-bold text-gray-600 font-mono">
                      {group.items.length} {group.items.length === 1 ? 'artículo' : 'artículos'}
                    </span>
                  </div>

                  {/* Tabla de Artículos del Pasillo */}
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      {group.items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50/50">
                          
                          {/* Casilla de Verificación para Pluma [ ] */}
                          <td className="w-8 py-2 align-middle text-center">
                            <div className="w-4 h-4 border-2 border-black rounded-sm mx-auto flex items-center justify-center font-bold text-[10px]">
                              {item.checked ? '✓' : ''}
                            </div>
                          </td>

                          {/* Nombre del Producto y Notas */}
                          <td className="py-2 pr-3 align-middle">
                            <span className={`font-bold text-sm ${item.checked ? 'line-through text-gray-500' : 'text-black'}`}>
                              {item.name}
                            </span>
                            {item.notes && (
                              <div className="text-[11px] text-gray-600 italic">
                                Nota: {item.notes}
                              </div>
                            )}
                          </td>

                          {/* Cantidad y Unidad */}
                          <td className="w-24 py-2 text-right align-middle font-mono font-extrabold text-sm text-black">
                            {item.quantity} <span className="text-xs font-normal text-gray-700">{item.unit}</span>
                          </td>

                          {/* Tienda o Proveedor Preferido */}
                          <td className="w-32 py-2 text-right align-middle text-xs text-gray-600 pl-2">
                            <span className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-semibold text-gray-800">
                              {item.store || 'Super'}
                            </span>
                          </td>

                          {/* Precio Estimado en MXN */}
                          {showPrices && (
                            <td className="w-24 py-2 text-right align-middle font-mono text-xs text-gray-800 pl-2">
                              ${((item.estimatedPriceMxn || 0) * (item.quantity || 1)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {/* Opción 2: Por Tienda / Proveedor */}
              {groupBy === 'store' && itemsByStore.map(([storeName, items]) => (
                <div key={storeName} className="break-inside-avoid">
                  
                  {/* Encabezado de Tienda */}
                  <div className="bg-gray-100 border border-gray-300 px-3 py-1.5 flex justify-between items-center rounded-sm mb-1.5">
                    <span className="font-black text-xs uppercase tracking-wide text-black flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-gray-700" />
                      {storeName}
                    </span>
                    <span className="text-[10px] font-bold text-gray-600 font-mono">
                      {items.length} artículos
                    </span>
                  </div>

                  {/* Tabla de Artículos de la Tienda */}
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50/50">
                          
                          {/* Casilla de Verificación [ ] */}
                          <td className="w-8 py-2 align-middle text-center">
                            <div className="w-4 h-4 border-2 border-black rounded-sm mx-auto flex items-center justify-center font-bold text-[10px]">
                              {item.checked ? '✓' : ''}
                            </div>
                          </td>

                          {/* Nombre del Producto */}
                          <td className="py-2 pr-3 align-middle">
                            <span className={`font-bold text-sm ${item.checked ? 'line-through text-gray-500' : 'text-black'}`}>
                              {item.name}
                            </span>
                            {item.notes && (
                              <div className="text-[11px] text-gray-600 italic">
                                Nota: {item.notes}
                              </div>
                            )}
                          </td>

                          {/* Cantidad y Unidad */}
                          <td className="w-24 py-2 text-right align-middle font-mono font-extrabold text-sm text-black">
                            {item.quantity} <span className="text-xs font-normal text-gray-700">{item.unit}</span>
                          </td>

                          {/* Precio Estimado */}
                          {showPrices && (
                            <td className="w-24 py-2 text-right align-middle font-mono text-xs text-gray-800 pl-2">
                              ${((item.estimatedPriceMxn || 0) * (item.quantity || 1)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            </div>

            {/* ======================================================== */}
            {/* SECCIÓN FINAL: TOTALES, NOTAS Y FIRMAS INSTITUCIONALES */}
            {/* ======================================================== */}
            {showSignatures && (
              <div className="mt-8 pt-5 border-t-2 border-black break-inside-avoid space-y-6">
                
                {/* Notas de Operación */}
                <div className="bg-gray-50 border border-gray-300 p-3 rounded text-[11px] text-gray-700 space-y-1">
                  <div className="font-bold uppercase tracking-wider text-black">
                    Instrucciones para el Encargado de Compras:
                  </div>
                  <div>
                    • Cotejar frescura y fechas de caducidad con al menos 15 días de holgura.
                  </div>
                  <div>
                    • Conservar todos los tickets y facturar a nombre de la razón social del Hogar.
                  </div>
                  <div>
                    • Al regresar, entregar en cocina o alacena para su ingreso y registro digital.
                  </div>
                </div>

                {/* Firmas de Entrega y Recepción */}
                <div className="grid grid-cols-2 gap-8 pt-6 text-xs text-center">
                  <div>
                    <div className="border-b border-black pb-1 mb-1 font-mono font-semibold">
                      ___________________________________________
                    </div>
                    <div className="font-bold text-black uppercase tracking-wider text-[11px]">
                      Firma Encargado de Compras
                    </div>
                    <div className="text-[10px] text-gray-600">
                      Entregado para surtir en tienda
                    </div>
                  </div>

                  <div>
                    <div className="border-b border-black pb-1 mb-1 font-mono font-semibold">
                      ___________________________________________
                    </div>
                    <div className="font-bold text-black uppercase tracking-wider text-[11px]">
                      Recibido y Verificado en Alacena
                    </div>
                    <div className="text-[10px] text-gray-600">
                      Recepción de insumos y cotejo de stock
                    </div>
                  </div>
                </div>

                {/* Pie de Página */}
                <div className="text-center text-[9px] text-gray-500 uppercase tracking-widest pt-2">
                  Documento emitido por ALACENA Enterprise • {activeHouse?.name || 'Residencia'} • {new Date().getFullYear()}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
