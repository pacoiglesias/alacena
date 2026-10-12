import React, { useState, useMemo, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, Printer, BookOpen, Search, Sparkles, 
  ShoppingCart, Check, Layers, Wine, Warehouse, 
  Scissors, Tag, Filter, FileText, CheckCircle2,
  Plus, Minus, CheckSquare, Square, LayoutTemplate,
  Calendar, ArrowDownRight, Package, Radio
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { generateQrPdf, getItemScanUrl } from '../../services/qrPdfService';
import QRCode from 'qrcode';

export default function PantryQrBookletModal({
  isOpen,
  onClose,
  products = [],
  zones = [],
  activeHouse,
  onQuickAddToShoppingList,
}) {
  // ═════════════════════════════════════════════════════════════════════════
  // TODOS LOS HOOKS DE REACT VAN AL INICIO (Regla de Oro de React Hooks)
  // ═════════════════════════════════════════════════════════════════════════
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('ALL');
  const [printFormat, setPrintFormat] = useState('STICKERS'); // 'STICKERS' | 'TABLERO_PEDIDOS' | 'WINE_TAGS' | 'TUPPERS' | 'CATALOG' | 'NFC_WRITER'
  const [selectedProductIds, setSelectedProductIds] = useState(() => new Set(products.map(p => p.id)));
  const [copiesPerProduct, setCopiesPerProduct] = useState({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Estado para Grabador Web NFC
  const [nfcSelectedProduct, setNfcSelectedProduct] = useState(() => products[0] || null);
  const [nfcWriteStatus, setNfcWriteStatus] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Sincronizar selección de productos cuando se abre el modal o cambia la lista
  useEffect(() => {
    if (isOpen && products.length > 0) {
      setSelectedProductIds(prev => {
        if (!prev || prev.size === 0) {
          return new Set(products.map(p => p.id));
        }
        return prev;
      });
      if (!nfcSelectedProduct) {
        setNfcSelectedProduct(products[0]);
      }
    }
  }, [isOpen, products, nfcSelectedProduct]);

  // Manejador de Grabación Web NFC (API NDEFReader)
  const handleWriteNfcTag = async () => {
    if (!nfcSelectedProduct) return;
    const scanUrl = getItemScanUrl(nfcSelectedProduct);

    if (!('NDEFReader' in window)) {
      setNfcWriteStatus('unsupported');
      return;
    }

    try {
      setNfcWriteStatus('writing');
      audio.click();
      const ndef = new window.NDEFReader();
      await ndef.write({
        records: [{ recordType: 'url', data: scanUrl }]
      });
      audio.success();
      setNfcWriteStatus('success');
      setTimeout(() => setNfcWriteStatus(null), 4000);
    } catch (err) {
      console.warn('Error grabando tag NFC:', err);
      setNfcWriteStatus('error');
      setTimeout(() => setNfcWriteStatus(null), 4000);
    }
  };

  // Filtrado de insumos en memoria
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchesZone = selectedZoneFilter === 'ALL' || p.zone === selectedZoneFilter;
      const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (p.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (p.barcode || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesZone && matchesSearch;
    });
  }, [products, selectedZoneFilter, searchTerm]);

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

  // Retorno temprano SOLO después de declarar todos los hooks
  if (!isOpen) return null;

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

  const handlePrint = async () => {
    audio.click();
    setIsGeneratingPdf(true);
    try {
      // 1. Pre-renderizar imágenes PNG en memoria para cada código QR usando la librería oficial
      const qrDataMap = {};
      for (const item of printableList) {
        const barcode = item.barcode || `ALC-${(item.id || '').replace('prod-', '').toUpperCase()}`;
        const qrPayload = getItemScanUrl(item);
        if (!qrDataMap[barcode]) {
          try {
            qrDataMap[barcode] = await QRCode.toDataURL(qrPayload, {
              width: 256,
              margin: 1,
              color: { dark: '#000000', light: '#FFFFFF' },
              errorCorrectionLevel: 'M',
            });
          } catch (e) {
            console.warn('Error generando QR para impresión:', e);
          }
        }
      }

      // 2. Construir documento HTML autónomo 100% puro en papel blanco (sin interferencias de la app)
      const dateStr = new Date().toLocaleDateString('es-MX');
      const houseName = activeHouse?.name || 'Residencia Principal';
      const zoneName = selectedZoneFilter === 'ALL' ? 'Todas las Zonas' : selectedZoneFilter;

      let formatTitle = 'PLANILLA DE ETIQUETAS ADHESIVAS PARA BOTES, FRASCOS Y SOBRES';
      if (printFormat === 'TABLERO_PEDIDOS') formatTitle = 'TABLERO MAESTRO DE COCINA (ESCANEOS RÁPIDOS DE PEDIDOS Y SALIDAS)';
      if (printFormat === 'WINE_TAGS') formatTitle = 'COLLARINES CON TROQUEL PARA CUELLO DE BOTELLAS DE CAVA';
      if (printFormat === 'TUPPERS') formatTitle = 'PLANILLA DE TUPPERS INTELIGENTES REUTILIZABLES (REFRI & CONGELADOR)';
      if (printFormat === 'CATALOG') formatTitle = 'CATÁLOGO FÍSICO DE ALMACÉN Y ALACENA DE COCINA';

      let cardsHtml = '';
      if (printFormat === 'STICKERS') {
        cardsHtml = `<div class="grid-stickers">` + printableList.map((p) => {
          const barcode = p.barcode || `ALC-${(p.id || '').replace('prod-', '').toUpperCase()}`;
          const qrImg = qrDataMap[barcode] || '';
          return `
            <div class="card sticker-card">
              <div class="cut-guide">✂ recortar</div>
              <div class="card-header">
                <div class="tag">ALACENA • ${(p.zone || 'DESPENSA').toUpperCase()}</div>
                <div class="prod-title">${p.name}</div>
                <div class="prod-meta">${p.quantity} ${p.unit} • ${p.category || 'Insumo'}</div>
              </div>
              <div class="qr-container">
                <img src="${qrImg}" class="qr-img" width="105" height="105" alt="QR" />
              </div>
              <div class="barcode-badge">${barcode}</div>
              <div class="date-lines">
                <div class="date-row"><span>Envasado:</span> <span class="dots">___/___/202_</span></div>
                <div class="date-row"><span>Caducidad:</span> <span class="dots">___/___/202_</span></div>
              </div>
            </div>
          `;
        }).join('') + `</div>`;
      } else if (printFormat === 'TABLERO_PEDIDOS') {
        cardsHtml = `<div class="grid-board">` + printableList.map((p) => {
          const barcode = p.barcode || `ALC-${(p.id || '').replace('prod-', '').toUpperCase()}`;
          const qrImg = qrDataMap[barcode] || '';
          return `
            <div class="card board-card">
              <div class="board-left">
                <img src="${qrImg}" class="qr-img" width="80" height="80" alt="QR" />
              </div>
              <div class="board-right">
                <div class="barcode-badge-sm">${barcode} • ${p.zone || 'Alacena'}</div>
                <div class="board-name">${p.name}</div>
                <div class="board-meta">Min: <strong>${p.minStock || 1}</strong> • Max: <strong>${p.maxStock || 4} ${p.unit}</strong></div>
                <div class="board-actions">
                  <span class="action-buy">🛒 Pedir Súper</span>
                  <span class="action-sub">➖ Salida Cocina</span>
                </div>
              </div>
            </div>
          `;
        }).join('') + `</div>`;
      } else if (printFormat === 'WINE_TAGS') {
        cardsHtml = `<div class="grid-wine">` + printableList.map((p) => {
          const barcode = p.barcode || `ALC-${(p.id || '').replace('prod-', '').toUpperCase()}`;
          const qrImg = qrDataMap[barcode] || '';
          return `
            <div class="card wine-card">
              <div class="wine-neck-circle">
                <div class="cut-circle">✂ CORTAR CÍRCULO<br><small>Colgar en cuello</small></div>
              </div>
              <div class="wine-body">
                <div class="wine-tag">CAVAPRO • SELECCIÓN PARTICULAR</div>
                <div class="wine-name">${p.name}</div>
                <div class="wine-meta">${p.category || 'Vino Tinto'} • ${p.zone || 'Cava'}</div>
                <div class="qr-container">
                  <img src="${qrImg}" class="qr-img" width="100" height="100" alt="QR" />
                </div>
                <div class="barcode-badge">${barcode}</div>
                <div class="wine-sub">Escanear al descorchar para registrar salida</div>
              </div>
            </div>
          `;
        }).join('') + `</div>`;
      } else if (printFormat === 'TUPPERS') {
        cardsHtml = `<div class="grid-tuppers">` + printableList.map((p, idx) => {
          const barcode = p.barcode || `TUP-${(p.id || '').replace('prod-', '').toUpperCase()}`;
          const qrImg = qrDataMap[barcode] || '';
          return `
            <div class="card tupper-card">
              <div class="tupper-header">
                <span class="tupper-title">🍱 TUPPER INTELIGENTE #${idx + 1}</span>
                <span class="tupper-cut">✂ PLASTIFICAR</span>
              </div>
              <div class="tupper-content">
                <div class="tupper-qr-box">
                  <img src="${qrImg}" class="qr-img" width="85" height="85" alt="QR" />
                  <div class="barcode-badge-sm">${barcode}</div>
                </div>
                <div class="tupper-details">
                  <div class="tupper-item-name"><strong>Insumo:</strong> ${p.name}</div>
                  <div class="tupper-line"><strong>Comida:</strong> _____________________</div>
                  <div class="tupper-line"><strong>Cocinado:</strong> ___/___/202_</div>
                  <div class="tupper-line"><strong>Consumir antes:</strong> ___/___/202_</div>
                  <div class="tupper-footer">📲 Escanea al guardar o comer para registrar</div>
                </div>
              </div>
            </div>
          `;
        }).join('') + `</div>`;
      } else {
        cardsHtml = `<div class="grid-catalog">` + printableList.map((p) => {
          const barcode = p.barcode || `ALC-${(p.id || '').replace('prod-', '').toUpperCase()}`;
          const qrImg = qrDataMap[barcode] || '';
          return `
            <div class="card catalog-card">
              <div class="cat-left">
                <img src="${qrImg}" class="qr-img" width="70" height="70" alt="QR" />
              </div>
              <div class="cat-right">
                <div class="barcode-badge-sm">${barcode} • ${p.zone || 'Alacena'}</div>
                <div class="board-name">${p.name}</div>
                <div class="board-meta">Stock: <strong>${p.quantity} ${p.unit}</strong> • Tienda: ${p.store || 'Super'}</div>
              </div>
            </div>
          `;
        }).join('') + `</div>`;
      }

      const fullPrintHtml = `<!DOCTYPE html>
<html lang="es-MX">
<head>
  <meta charset="UTF-8">
  <title>ALACENA • Impresión QR</title>
  <style>
    @page { size: letter portrait; margin: 8mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #ffffff !important; color: #000000 !important; }
    .print-header { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
    .print-brand { font-size: 8px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; color: #333; }
    .print-title { font-size: 15px; font-weight: 900; text-transform: uppercase; margin: 2px 0; color: #000; }
    .print-meta { font-size: 9px; color: #555; }
    .board-instruct { margin-top: 6px; padding: 6px; background: #f3f3f3; border: 1px solid #ccc; border-radius: 4px; font-size: 8.5px; }
    .card { background: #ffffff !important; color: #000000 !important; page-break-inside: avoid !important; break-inside: avoid !important; position: relative; }
    .grid-stickers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
    .sticker-card { border: 1.5px dashed #555; border-radius: 8px; padding: 8px; text-align: center; }
    .cut-guide { position: absolute; top: -7px; right: 8px; background: #fff; border: 1px solid #777; border-radius: 3px; font-size: 7px; font-family: monospace; padding: 1px 4px; }
    .tag { font-size: 7.5px; font-weight: 900; letter-spacing: 1px; color: #885500; text-transform: uppercase; }
    .prod-title { font-size: 11px; font-weight: 800; line-height: 1.2; margin-top: 2px; }
    .prod-meta { font-size: 8.5px; color: #555; font-weight: 600; margin-top: 1px; }
    .qr-container { margin: 6px 0; display: flex; justify-content: center; }
    .qr-img { display: block; margin: 0 auto; }
    .barcode-badge { display: inline-block; font-family: monospace; font-size: 10px; font-weight: 900; background: #f0f0f0; border: 1px solid #ccc; padding: 2px 6px; border-radius: 4px; }
    .barcode-badge-sm { font-family: monospace; font-size: 8.5px; font-weight: 900; color: #884400; }
    .date-lines { margin-top: 6px; border: 1px dashed #aaa; border-radius: 4px; padding: 3px 5px; font-size: 7.5px; font-family: monospace; }
    .date-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
    .dots { color: #888; }
    .grid-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
    .board-card { border: 1px solid #bbb; border-radius: 6px; padding: 6px; display: flex; gap: 6px; align-items: center; }
    .board-right { flex: 1; min-width: 0; }
    .board-name { font-size: 10px; font-weight: 800; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .board-meta { font-size: 7.5px; color: #666; margin-top: 2px; }
    .board-actions { margin-top: 4px; padding-top: 3px; border-top: 1px solid #eee; display: flex; justify-content: space-between; font-size: 7px; font-weight: bold; }
    .action-buy { color: #007733; }
    .action-sub { color: #aa4400; }
    .grid-wine { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
    .wine-card { border: 1.5px solid #666; border-radius: 10px; padding: 10px 8px; text-align: center; }
    .wine-neck-circle { padding-bottom: 8px; border-bottom: 1.5px dashed #888; margin-bottom: 6px; }
    .cut-circle { width: 50px; height: 50px; border: 1.5px dashed #cc2244; background: #fff4f6; border-radius: 50%; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 6.5px; font-weight: bold; color: #990022; text-align: center; line-height: 1.1; }
    .wine-tag { font-size: 7px; font-weight: 900; letter-spacing: 1px; color: #881133; text-transform: uppercase; }
    .wine-name { font-size: 11px; font-weight: 800; line-height: 1.2; margin: 2px 0; }
    .wine-meta { font-size: 8.5px; color: #666; }
    .wine-sub { font-size: 7px; color: #666; margin-top: 4px; }
    .grid-tuppers { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4mm; }
    .tupper-card { border: 1.5px solid #2B6CB0; border-radius: 8px; padding: 6px 8px; }
    .tupper-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #CBD5E0; padding-bottom: 4px; margin-bottom: 4px; }
    .tupper-title { font-size: 8px; font-weight: 900; color: #2B6CB0; text-transform: uppercase; }
    .tupper-cut { font-size: 6.5px; font-family: monospace; color: #718096; }
    .tupper-content { display: flex; gap: 8px; align-items: center; }
    .tupper-qr-box { text-align: center; }
    .tupper-details { flex: 1; font-size: 8px; color: #2D3748; line-height: 1.3; }
    .tupper-item-name { font-size: 9px; font-weight: 800; color: #1A202C; margin-bottom: 3px; }
    .tupper-line { border-bottom: 1px dotted #CBD5E0; padding: 2px 0; }
    .tupper-footer { font-size: 6.5px; color: #38A169; margin-top: 3px; font-weight: 600; }
    .grid-catalog { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3mm; }
    .catalog-card { border: 1px solid #bbb; border-radius: 6px; padding: 6px; display: flex; gap: 8px; align-items: center; }
    .cat-right { flex: 1; min-width: 0; }
  </style>
</head>
<body>
  <div class="print-header">
    <div class="print-brand">ALACENA ENTERPRISE • SISTEMA RESIDENCIAL DE ALMACÉN & CAVA</div>
    <div class="print-title">${formatTitle}</div>
    <div class="print-meta">Residencia: <strong>${houseName}</strong> • Ubicación: <strong>${zoneName}</strong> • Impreso: ${dateStr} • Total: ${printableList.length} ítems</div>
    ${printFormat === 'TABLERO_PEDIDOS' ? '<div class="board-instruct">📌 <strong>Instrucciones:</strong> Plastifica esta hoja y pégala en la puerta de la alacena para escanear salidas y pedidos rápidamente con el celular.</div>' : ''}
    ${printFormat === 'TUPPERS' ? '<div class="board-instruct">📌 <strong>Instrucciones:</strong> Recorta y pega estas etiquetas en las tapas de tus tuppers con cinta adhesiva transparente. Escribe con plumón borrable.</div>' : ''}
  </div>
  ${cardsHtml}
</body>
</html>`;

      // 3. Montar iframe invisible con dimensiones reales para que Chromium calcule el layout
      let iframe = document.getElementById('alacena-qr-print-frame');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'alacena-qr-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.top = '-10000px';
        iframe.style.left = '-10000px';
        iframe.style.width = '900px';
        iframe.style.height = '1200px';
        iframe.style.border = '0';
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'none';
        iframe.style.zIndex = '-9999';
        document.body.appendChild(iframe);
      }

      const frameDoc = iframe.contentDocument || iframe.contentWindow.document;
      frameDoc.open();
      frameDoc.write(fullPrintHtml);
      frameDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {
          console.warn('Error invocando print en iframe:', e);
          window.print();
        } finally {
          setIsGeneratingPdf(false);
        }
      }, 500);

    } catch (err) {
      console.error('Error preparando impresión:', err);
      setIsGeneratingPdf(false);
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    audio.click();
    setIsGeneratingPdf(true);
    try {
      await generateQrPdf({
        items: printableList,
        format: printFormat,
        activeHouse,
        selectedZone: selectedZoneFilter === 'ALL' ? 'Todas las Zonas' : selectedZoneFilter,
      });
      audio.success();
    } catch (e) {
      console.warn('Error generando PDF:', e);
      alert('Error generando PDF: ' + e.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div 
      id="qr-modal-print-root"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in print:bg-white print:p-0 print:static print:z-0 print:block print:overflow-visible"
    >
      
      {/* ═══════════════════════════════════════════════════════════════
          ESTILOS DE AISLAMIENTO ABSOLUTO PARA IMPRESIÓN LIMPIA EN PAPEL
         ═══════════════════════════════════════════════════════════════ */}
      <style>{`
        @media print {
          /* Ocultar el resto de la interfaz de la aplicación en el documento */
          body {
            visibility: hidden !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hacer visible el contenedor del modal y sus hijos */
          #qr-modal-print-root,
          #qr-modal-print-root * {
            visibility: visible !important;
          }

          #qr-modal-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 100% !important;
            z-index: 999999 !important;
          }

          #qr-modal-dialog {
            position: static !important;
            max-height: none !important;
            height: auto !important;
            width: 100% !important;
            max-width: none !important;
            overflow: visible !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }

          #printable-qr-catalog {
            position: static !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 4mm !important;
            margin: 0 !important;
            box-shadow: none !important;
          }

          .no-print,
          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }

          @page {
            size: letter portrait;
            margin: 8mm;
          }

          .break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .print-grid-stickers {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 4mm !important;
          }

          .print-grid-board {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 3mm !important;
          }

          .print-grid-wine {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 5mm !important;
          }

          .print-grid-catalog {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 3mm !important;
          }

          .print-grid-tuppers {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 4mm !important;
          }
        }
      `}</style>

      <div 
        id="qr-modal-dialog"
        className="relative w-full max-w-5xl max-h-[94vh] overflow-hidden flex flex-col rounded-3xl bg-[#14110F] border border-[#E0B441]/30 shadow-2xl print:border-none print:shadow-none print:bg-white print:max-h-none print:h-auto print:rounded-none print:overflow-visible print:w-full print:max-w-none"
      >
        
        {/* Header - Hidden on Print */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#2A2521] bg-[#1C1814] print:hidden no-print">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#E0B441]/20 to-[#C8542A]/20 border border-[#E0B441]/40 text-[#E0B441]">
              <Printer className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white font-display">
                  Centro de Impresión QR: Botes, Tableros & Cava
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E0B441]/15 text-[#E0B441] border border-[#E0B441]/30">
                  {printableList.length} ítems a imprimir
                </span>
              </div>
              <p className="text-xs text-[#B8AFA3]">
                Genera stickers para frascos, tableros de pedidos para puertas o collarines con troquel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={printableList.length === 0 || isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/15 text-[#E0B441] border border-[#E0B441]/35 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
              title="Descargar archivo PDF vectorial de alta resolución"
            >
              <FileText className="w-4 h-4 text-[#E0B441]" />
              <span>{isGeneratingPdf ? 'Generando...' : '📄 Descargar PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={printableList.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#12100E] bg-gradient-to-r from-[#E0B441] to-[#E5724A] hover:brightness-110 shadow-lg shadow-[#E0B441]/20 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ Imprimir ({printableList.length})</span>
            </button>
            <button
              onClick={() => {
                audio.click();
                onClose();
              }}
              className="p-2 rounded-xl text-[#B8AFA3] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Controles y 4 Formatos Físicos - Hidden on Print */}
        <div className="p-3 sm:p-4 border-b border-[#2A2521] bg-[#171412] space-y-3 print:hidden no-print">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* 4 Formatos de Impresión Reales */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#1C1814] border border-[#2A2521] overflow-x-auto no-scrollbar">
              
              {/* Formato 1: Stickers para Botes & Sobres */}
              <button
                onClick={() => { audio.click(); setPrintFormat('STICKERS'); }}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  printFormat === 'STICKERS'
                    ? 'bg-[#E0B441] text-[#12100E] font-bold shadow-sm'
                    : 'text-[#B8AFA3] hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Botes, Frascos & Sobres</span>
              </button>

              {/* Formato 2: Tablero Maestro para Puerta de Alacena */}
              <button
                onClick={() => { audio.click(); setPrintFormat('TABLERO_PEDIDOS'); }}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  printFormat === 'TABLERO_PEDIDOS'
                    ? 'bg-[#E5724A] text-white font-bold shadow-sm'
                    : 'text-[#B8AFA3] hover:text-white'
                }`}
                title="Tablero para pegar en la puerta de la alacena y escanear pedidos/salidas rápidamente"
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>Tablero Pedidos / Puerta</span>
              </button>

              {/* Formato 3: Collarines de Cava */}
              <button
                onClick={() => { audio.click(); setPrintFormat('WINE_TAGS'); }}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  printFormat === 'WINE_TAGS'
                    ? 'bg-[#A83A50] text-white font-bold shadow-sm'
                    : 'text-[#B8AFA3] hover:text-white'
                }`}
              >
                <Wine className="w-3.5 h-3.5" />
                <span>Collarines para Botellas</span>
              </button>

              {/* Formato 4: Catálogo Libro */}
              <button
                onClick={() => { audio.click(); setPrintFormat('CATALOG'); }}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  printFormat === 'CATALOG'
                    ? 'bg-[#3D8B6E] text-white font-bold shadow-sm'
                    : 'text-[#B8AFA3] hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Catálogo Físico</span>
              </button>

              {/* Formato 5: Tuppers Inteligentes */}
              <button
                onClick={() => { audio.click(); setPrintFormat('TUPPERS'); }}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  printFormat === 'TUPPERS'
                    ? 'bg-[#2B6CB0] text-white font-bold shadow-sm'
                    : 'text-[#B8AFA3] hover:text-white'
                }`}
                title="Etiquetas para tuppers con fecha y QR reutilizable para el refri"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>🍱 Tuppers Refri</span>
              </button>

              {/* Modo Especial: Grabador Web NFC */}
              <button
                onClick={() => { audio.click(); setPrintFormat('NFC_WRITER'); }}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  printFormat === 'NFC_WRITER'
                    ? 'bg-sky-500 text-white font-bold shadow-sm'
                    : 'text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/20'
                }`}
                title="Herramienta para programar chips NFC físicos NTAG213/NTAG215"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>📡 Grabar Tags NFC</span>
              </button>
            </div>

            {/* Búsqueda y Selección Rápida */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-52">
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
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#E0B441] border border-[#3D3630] transition-all shrink-0 cursor-pointer"
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
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
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
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
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
        <div 
          id="printable-qr-catalog" 
          className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-4 bg-[#0F0D0B] print:bg-white text-white print:text-black custom-scrollbar print:overflow-visible print:h-auto"
        >
          
          {/* Encabezado Oficial Impreso en Papel */}
          <div className="hidden print:block pb-3 mb-4 border-b-2 border-black text-black">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-700 block">
                  ALACENA ENTERPRISE • SISTEMA RESIDENCIAL DE ALMACÉN & CAVA
                </span>
                <h1 className="text-lg font-black uppercase tracking-tight text-black mt-0.5">
                  {printFormat === 'STICKERS' 
                    ? 'PLANILLA DE ETIQUETAS ADHESIVAS PARA BOTES, FRASCOS Y SOBRES'
                    : printFormat === 'TABLERO_PEDIDOS'
                    ? 'TABLERO MAESTRO DE COCINA (ESCANEOS RÁPIDOS DE PEDIDOS Y SALIDAS)'
                    : printFormat === 'WINE_TAGS'
                    ? 'COLLARINES CON TROQUEL PARA CUELLO DE BOTELLAS DE CAVA'
                    : 'CATÁLOGO FÍSICO DE ALMACÉN Y ALACENA DE COCINA'}
                </h1>
                <p className="text-[10px] font-semibold text-gray-700">
                  Residencia: <strong>{activeHouse?.name || 'Residencia Principal'}</strong> • Ubicación: <strong>{selectedZoneFilter === 'ALL' ? 'Todas las Zonas' : selectedZoneFilter}</strong>
                </p>
              </div>
              <div className="text-right text-[10px] font-mono text-gray-700">
                Impreso: {new Date().toLocaleDateString('es-MX')} • Total: {printableList.length} ítems
              </div>
            </div>
            {printFormat === 'TABLERO_PEDIDOS' && (
              <div className="mt-2 p-1.5 bg-gray-100 rounded text-[9px] font-medium border border-gray-300">
                📌 <strong>Instrucciones:</strong> Plastifica esta hoja y pégala en la puerta de la alacena. Con el modo Escáner en el celular, pasa por el código para: <strong>🛒 Pedir al Súper</strong> cuando veas que falta, o <strong>➖ Descontar Salida</strong> al sacar insumos para cocinar.
              </div>
            )}
          </div>

          {/* ═════════════════════════════════════════════════════════════
              FORMATO 1: STICKERS PARA BOTES, FRASCOS Y SOBRES
             ═════════════════════════════════════════════════════════════ */}
          {printFormat === 'STICKERS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:print-grid-stickers">
              {filteredProducts.map((p) => {
                const isSelected = selectedProductIds.has(p.id);
                const copies = copiesPerProduct[p.id] || 1;
                const barcode = p.barcode || `ALC-${p.id.replace('prod-', '').toUpperCase()}`;
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
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#B8AFA3] hover:text-white cursor-pointer"
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 text-[#E0B441]" /> : <Square className="w-4 h-4" />}
                        <span>{isSelected ? 'Incluido' : 'Omitir'}</span>
                      </button>

                      {isSelected && (
                        <div className="flex items-center gap-1 bg-[#14110F] px-1.5 py-0.5 rounded-lg border border-[#3D3630]">
                          <button onClick={() => handleCopiesChange(p.id, -1)} className="text-xs text-[#8B8378] hover:text-white px-1 cursor-pointer">-</button>
                          <span className="text-[11px] font-mono font-bold text-[#E0B441]">{copies} copias</span>
                          <button onClick={() => handleCopiesChange(p.id, 1)} className="text-xs text-[#8B8378] hover:text-white px-1 cursor-pointer">+</button>
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
                    <div className="my-2 flex justify-center">
                      <div className="p-2 bg-white rounded-xl border border-gray-200 inline-block shadow-sm">
                        <QRCodeSVG
                          value={compactQr}
                          size={105}
                          level="M"
                          includeMargin={false}
                          fgColor="#000000"
                          bgColor="#FFFFFF"
                        />
                      </div>
                    </div>

                    {/* Clave de escaneo */}
                    <div className="text-center">
                      <span className="font-mono text-[11px] font-black text-white print:text-black tracking-wider block bg-white/5 print:bg-gray-100 py-0.5 px-2 rounded border border-white/5 print:border-gray-200">
                        {barcode}
                      </span>
                    </div>

                    {/* Campos para escribir a mano Fecha de Envasado / Caducidad */}
                    <div className="mt-1.5 border border-dashed border-gray-400 rounded-lg p-1 bg-white/5 print:bg-gray-50 text-[8.5px] font-mono space-y-0.5 text-gray-700">
                      <div className="flex justify-between border-b border-gray-200 pb-0.5">
                        <span className="font-bold">Envasado:</span>
                        <span className="text-gray-400">___/___/202_</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Caducidad:</span>
                        <span className="text-gray-400">___/___/202_</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              FORMATO 2: TABLERO MAESTRO DE COCINA (Para la Puerta)
             ═════════════════════════════════════════════════════════════ */}
          {printFormat === 'TABLERO_PEDIDOS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 print:print-grid-board">
              {filteredProducts.map((p) => {
                const isSelected = selectedProductIds.has(p.id);
                const barcode = p.barcode || `ALC-${p.id.replace('prod-', '').toUpperCase()}`;
                const compactQr = barcode;

                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border transition-all flex items-center gap-3 break-inside-avoid ${
                      isSelected 
                        ? 'bg-[#1C1814] border-[#3D3630] print:bg-white print:border print:border-gray-400 print:shadow-none' 
                        : 'bg-[#14110F]/40 border-[#2A2521] opacity-40 print:hidden'
                    }`}
                  >
                    {/* Checkbox en pantalla */}
                    <button
                      type="button"
                      onClick={() => toggleSelectProduct(p.id)}
                      className="print:hidden no-print text-[#B8AFA3] hover:text-white shrink-0 cursor-pointer"
                    >
                      {isSelected ? <CheckSquare className="w-4 h-4 text-[#E5724A]" /> : <Square className="w-4 h-4" />}
                    </button>

                    {/* QR Code Compacto para Lectura Rápida en Tablero */}
                    <div className="p-1.5 bg-white rounded-lg border border-gray-200 shrink-0 shadow-sm">
                      <QRCodeSVG
                        value={compactQr}
                        size={75}
                        level="M"
                        includeMargin={false}
                        fgColor="#000000"
                        bgColor="#FFFFFF"
                      />
                    </div>

                    {/* Ficha de Pedido & Salida */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase text-[#E5724A] print:text-gray-700 font-mono">
                          {barcode}
                        </span>
                        <span className="text-[8px] font-bold text-gray-500">
                          {p.zone || 'Alacena'}
                        </span>
                      </div>
                      
                      <h4 className="text-xs font-bold text-white print:text-black truncate leading-tight mt-0.5">
                        {p.name}
                      </h4>

                      <div className="flex items-center justify-between text-[9px] text-[#B8AFA3] print:text-gray-600 mt-1">
                        <span>Min: <strong>{p.minStock || 1}</strong></span>
                        <span>Max: <strong>{p.maxStock || 4} {p.unit}</strong></span>
                      </div>

                      {/* Botones / Instrucciones de Escaneo */}
                      <div className="mt-1 pt-1 border-t border-[#2A2521] print:border-gray-200 flex items-center justify-between text-[8px] font-bold">
                        <span className="text-emerald-400 print:text-emerald-800">🛒 Pedir Súper</span>
                        <span className="text-amber-400 print:text-amber-800">➖ Salida Cocina</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              FORMATO 3: COLLARINES PARA CAVA (Con Troquel para Cuello)
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
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#B8AFA3] hover:text-white cursor-pointer"
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
                          fgColor="#000000"
                          bgColor="#FFFFFF"
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
              FORMATO 4: CATÁLOGO TABULAR DE ALACENA (Para Encuadernar)
             ═════════════════════════════════════════════════════════════ */}
          {printFormat === 'CATALOG' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:print-grid-catalog">
              {filteredProducts.map((p) => {
                const isSelected = selectedProductIds.has(p.id);
                const barcode = p.barcode || `ALC-${p.id.replace('prod-', '').toUpperCase()}`;
                const compactQr = getItemScanUrl(p);

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
                        fgColor="#000000"
                        bgColor="#FFFFFF"
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

          {/* ═════════════════════════════════════════════════════════════
              FORMATO 5: TUPPERS INTELIGENTES REUTILIZABLES (REFRI)
             ═════════════════════════════════════════════════════════════ */}
          {printFormat === 'TUPPERS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:print-grid-tuppers">
              {filteredProducts.map((p, idx) => {
                const isSelected = selectedProductIds.has(p.id);
                const barcode = p.barcode || `TUP-${p.id.replace('prod-', '').toUpperCase()}`;
                const compactQr = getItemScanUrl(p);

                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between break-inside-avoid relative ${
                      isSelected 
                        ? 'bg-[#141A24] border-sky-500/40 print:bg-white print:border-2 print:border-sky-800' 
                        : 'bg-[#14110F]/40 border-[#2A2521] opacity-40 print:hidden'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-sky-500/20">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-sky-400 print:text-sky-800">
                          🍱 TUPPER INTELIGENTE #{idx + 1}
                        </span>
                      </div>
                      <span className="text-[8px] font-mono text-gray-400">
                        ✂ Plastificar
                      </span>
                    </div>

                    <div className="flex items-center gap-3 py-3">
                      <div className="p-2 bg-white rounded-xl border border-gray-200 inline-block shrink-0">
                        <QRCodeSVG
                          value={compactQr}
                          size={85}
                          level="M"
                          includeMargin={false}
                          fgColor="#000000"
                          bgColor="#FFFFFF"
                        />
                        <span className="font-mono text-[9px] font-bold text-gray-700 block text-center mt-1">
                          {barcode}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                        <div className="font-bold text-white print:text-black text-sm truncate">
                          {p.name}
                        </div>
                        <div className="p-2 rounded-lg bg-black/25 print:bg-gray-50 border border-white/5 print:border-gray-300 text-[10px] font-mono space-y-1 text-gray-300 print:text-gray-700">
                          <div className="border-b border-dashed border-gray-600 pb-1">
                            <strong>Comida:</strong> ________________
                          </div>
                          <div className="flex justify-between">
                            <span>Guardado: ___/___</span>
                            <span>Vence: ___/___</span>
                          </div>
                        </div>
                        <span className="text-[9px] text-emerald-400 print:text-emerald-700 font-semibold block">
                          📲 Escanea con tu cel para consumir o reabastecer
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              MODO ESPECIAL: PROGRAMADOR DE TAGS NFC FÍSICOS
             ═════════════════════════════════════════════════════════════ */}
          {printFormat === 'NFC_WRITER' && (
            <div className="max-w-2xl mx-auto p-4 sm:p-6 rounded-3xl bg-[#141824] border border-[#232A3E] space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Programador de Stickers NFC para el Hogar
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                    Usa cualquier sticker NFC estándar (chips <strong>NTAG213 / NTAG215</strong>). Pégalos debajo de las repisas, en la puerta de la alacena, en botes o en botellas de vino.
                  </p>
                </div>
              </div>

              {/* Selector de Producto a Grabar */}
              <div className="p-4 rounded-2xl bg-[#0F121C] border border-[#1E2333] space-y-3">
                <label className="text-xs font-bold text-gray-300 block">
                  1. Selecciona el insumo que deseas grabar en el sticker NFC:
                </label>
                <select
                  value={nfcSelectedProduct?.id || ''}
                  onChange={(e) => {
                    const sel = products.find(p => p.id === e.target.value);
                    if (sel) setNfcSelectedProduct(sel);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#171D2D] border border-[#2A334C] text-sm text-white font-medium outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.zone || 'Alacena'}) • Stock: {p.quantity} {p.unit}
                    </option>
                  ))}
                </select>

                {nfcSelectedProduct && (
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-2">
                      <span className="text-[10px] text-gray-400 uppercase font-mono block">Enlace Web del Chip:</span>
                      <span className="text-xs font-mono text-emerald-400 truncate block select-all">
                        {getItemScanUrl(nfcSelectedProduct)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(getItemScanUrl(nfcSelectedProduct));
                        setCopiedUrl(true);
                        setTimeout(() => setCopiedUrl(false), 2500);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white shrink-0 cursor-pointer"
                    >
                      {copiedUrl ? '¡Copiado!' : 'Copiar URL'}
                    </button>
                  </div>
                )}
              </div>

              {/* Botón de Grabación Web NFC (Android / Chrome) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">
                  2. Grabar con tu teléfono:
                </label>
                <button
                  onClick={handleWriteNfcTag}
                  disabled={nfcWriteStatus === 'writing'}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer ${
                    nfcWriteStatus === 'writing'
                      ? 'bg-sky-500 text-white animate-pulse'
                      : nfcWriteStatus === 'success'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white'
                  }`}
                >
                  <Radio className="w-5 h-5" />
                  <span>
                    {nfcWriteStatus === 'writing' && 'Acerca el sticker NFC al reverso del celular...'}
                    {nfcWriteStatus === 'success' && '¡Sticker grabado exitosamente! Pruébalo ahora.'}
                    {nfcWriteStatus === 'error' && 'Error al grabar. Vuelve a intentarlo.'}
                    {nfcWriteStatus === 'unsupported' && 'Navegador sin Web NFC (ver instrucciones abajo)'}
                    {!nfcWriteStatus && '📡 Tocar con Sticker NFC para Grabar Ahora'}
                  </span>
                </button>
              </div>

              {/* Guía para iPhone / iOS */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-2 text-xs text-gray-300">
                <span className="font-bold text-white block">
                  📱 ¿Cómo usar NFC en iPhone (iOS)?
                </span>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Apple no permite a los navegadores web escribir chips NFC directamente, pero puedes grabarlos en 10 segundos con cualquier app gratuita como <strong>"NFC Tools"</strong> (App Store):
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-gray-300">
                  <li>Copia el enlace de arriba con el botón <strong>Copiar URL</strong>.</li>
                  <li>Abre <em>NFC Tools</em> → <strong>Escribir</strong> → <strong>Añadir un registro</strong> → <strong>URL / Enlace web</strong>.</li>
                  <li>Pega el enlace y toca <strong>Escribir</strong> acercando tu sticker NFC.</li>
                </ol>
                <p className="text-[11px] text-emerald-400 font-semibold pt-1">
                  ✨ Una vez grabado, al acercar la parte superior de cualquier iPhone al sticker, se abrirá ALACENA y aparecerá la tarjeta de Consumir / Pedir al Súper al instante.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer en Pantalla */}
        <div className="p-4 border-t border-[#2A2521] bg-[#1C1814] flex items-center justify-between text-xs text-[#8B8378] print:hidden no-print flex-wrap gap-2">
          <span>
            💡 <strong>Consejo para el Hogar:</strong> Plastifica la hoja del <em>Tablero de Pedidos</em> y cuélgala en la puerta de la alacena para inventariar sin abrir cada frasco.
          </span>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
