import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, Printer, Check, MapPin, Calendar, Tag, Store, QrCode, 
  Radio, Sparkles, Scissors, Download, Layers, Wine
} from 'lucide-react';
import { audio } from '../../services/audioService';

export default function ItemQrModal({ isOpen, onClose, item, activeHouse, onUpdateProduct }) {
  const [nfcWriting, setNfcWriting] = useState(false);
  const [nfcSuccess, setNfcSuccess] = useState(false);
  const [nfcMessage, setNfcMessage] = useState('');
  const [labelSize, setLabelSize] = useState('STANDARD'); // 'STANDARD' (50x50) | 'MINI' (30x30) | 'WINE_COLLAR'
  const qrSvgRef = useRef(null);

  if (!isOpen || !item) return null;

  // Código de barras o clave única persistente del producto
  const activeBarcode = item.barcode || `ALC-${(item.id || '').replace('prod-', '').toUpperCase() || Date.now().toString(36).toUpperCase()}`;

  // QR Payload Ultracompacto: Solo la clave ALC-XXXX para máxima velocidad de lectura y versión QR compacta
  // Esto permite que el QR tenga módulos grandes (21x21), legibles a distancia o con poca luz
  const compactQrValue = activeBarcode;

  // Imprimir con aislamiento CSS estricto
  const handlePrint = () => {
    audio.click();
    window.print();
  };

  // Descargar imagen PNG para mandar directo a rotuladoras térmicas Bluetooth (Niimbot, Brother, Phomemo)
  const handleDownloadPng = () => {
    audio.click();
    try {
      const svgElement = qrSvgRef.current?.querySelector('svg');
      if (!svgElement) return;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      canvas.width = 400;
      canvas.height = 400;

      img.onload = () => {
        // Fondo blanco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Dibujar QR centrado
        ctx.drawImage(img, 40, 40, 320, 320);
        
        // Agregar texto inferior para rotuladora
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.name.substring(0, 24), 200, 385);

        const a = document.createElement('a');
        a.download = `etiqueta-${activeBarcode}-${item.name.replace(/\s+/g, '_')}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
        audio.success();
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (e) {
      console.warn('Error al exportar PNG:', e);
      alert('Se descargará en formato SVG vectorial.');
      const svgData = new XMLSerializer().serializeToString(qrSvgRef.current.querySelector('svg'));
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = `etiqueta-${activeBarcode}.svg`;
      a.href = url;
      a.click();
    }
  };

  // Grabar directamente en Sticker NFC físico
  const handleWriteNfc = async () => {
    if (!('NDEFReader' in window)) {
      alert('La grabación NFC requiere Google Chrome en un celular Android con NFC activado.');
      return;
    }

    try {
      audio.click();
      setNfcWriting(true);
      setNfcMessage('📶 Acerca el sticker o llavero NFC a la parte trasera de tu teléfono...');
      
      const ndef = new window.NDEFReader();
      await ndef.write({
        records: [
          {
            recordType: 'text',
            data: activeBarcode,
          },
        ],
      });

      audio.success();
      setNfcWriting(false);
      setNfcSuccess(true);
      setNfcMessage('✓ ¡Etiqueta NFC grabada exitosamente con ' + activeBarcode + '! Pégala en el envase.');
      setTimeout(() => setNfcSuccess(false), 4000);
    } catch (err) {
      console.warn('Error grabando NFC:', err);
      setNfcWriting(false);
      setNfcMessage(`⚠️ No se pudo grabar: ${err.message || 'Intenta de nuevo'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in print:bg-white print:p-0 print:static print:z-0">
      
      {/* Estilos de Impresión Aislados 100% en Blanco Puro para Etiquetas Individuales */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-single-sticker, #printable-single-sticker * {
            visibility: visible !important;
          }
          #printable-single-sticker {
            position: absolute !important;
            left: 50% !important;
            top: 20mm !important;
            transform: translateX(-50%) !important;
            width: ${labelSize === 'MINI' ? '50mm' : labelSize === 'WINE_COLLAR' ? '65mm' : '75mm'} !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: 2px dashed #333333 !important;
            border-radius: 8px !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: auto;
            margin: 10mm;
          }
        }
      `}</style>

      <div className="relative w-full max-w-md max-h-[94vh] overflow-hidden flex flex-col rounded-3xl bg-[#14110F] border border-[#E0B441]/35 shadow-2xl p-4 sm:p-6 space-y-4 print:border-none print:shadow-none print:p-0 print:bg-white">
        
        {/* Header (Hidden in print) */}
        <div className="flex items-center justify-between border-b border-[#2A2521] pb-3 print:hidden no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#E0B441]/15 text-[#E0B441] border border-[#E0B441]/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-display">
                Etiqueta QR & Sticker del Hogar
              </h3>
              <span className="text-[10px] text-[#B8AFA3]">
                Código optimizado: <strong className="text-[#E0B441] font-mono">{activeBarcode}</strong>
              </span>
            </div>
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

        {/* Selector de Formato de Etiqueta (Pantalla) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#1C1814] border border-[#2A2521] print:hidden no-print">
          <button
            onClick={() => { audio.click(); setLabelSize('STANDARD'); }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
              labelSize === 'STANDARD'
                ? 'bg-[#E0B441] text-[#12100E] font-bold shadow-sm'
                : 'text-[#B8AFA3] hover:text-white'
            }`}
          >
            🏷️ Frasco / Tupper
          </button>
          <button
            onClick={() => { audio.click(); setLabelSize('MINI'); }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
              labelSize === 'MINI'
                ? 'bg-[#E0B441] text-[#12100E] font-bold shadow-sm'
                : 'text-[#B8AFA3] hover:text-white'
            }`}
          >
            🧂 Mini Especiero
          </button>
          <button
            onClick={() => { audio.click(); setLabelSize('WINE_COLLAR'); }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
              labelSize === 'WINE_COLLAR'
                ? 'bg-[#A83A50] text-white font-bold shadow-sm'
                : 'text-[#B8AFA3] hover:text-white'
            }`}
          >
            🍷 Collar de Botella
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            ÁREA DE IMPRESIÓN AISLADA (#printable-single-sticker)
           ═══════════════════════════════════════════════════════════════ */}
        <div 
          id="printable-single-sticker" 
          className={`p-4 sm:p-5 rounded-2xl bg-white text-gray-900 border-2 border-dashed border-gray-400 space-y-3 shadow-inner relative ${
            labelSize === 'WINE_COLLAR' ? 'max-w-xs mx-auto pt-6' : ''
          }`}
        >
          {/* Guía de corte ✂️ */}
          <div className="absolute -top-2.5 right-3 bg-white px-1.5 text-[9px] text-gray-500 font-mono flex items-center gap-1 border border-gray-300 rounded">
            <Scissors className="w-3 h-3 text-gray-600" />
            <span>Guía de corte</span>
          </div>

          {/* Troquel superior para cuello de botella si es WINE_COLLAR */}
          {labelSize === 'WINE_COLLAR' && (
            <div className="flex flex-col items-center justify-center pb-2 border-b-2 border-dashed border-gray-300">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-rose-500 bg-rose-50 flex items-center justify-center text-[9px] font-bold text-rose-700 text-center px-1">
                ✂️ Cortar círculo para cuello
              </div>
              <span className="text-[8px] text-gray-400 mt-1 uppercase font-semibold">
                Deslizar en cuello de botella
              </span>
            </div>
          )}

          {/* Header de la etiqueta */}
          <div className="text-center border-b border-gray-200 pb-2">
            <span className="text-[8px] font-black uppercase tracking-widest text-[#6B1F2E] block">
              ALACENA • {item.zone || item.targetZone || 'DESPENSA'}
            </span>
            <h4 className="text-base font-extrabold text-gray-900 leading-tight mt-0.5">
              {item.name}
            </h4>
            <div className="text-[11px] font-bold text-gray-600 mt-0.5">
              {item.quantity} {item.unit} • {item.category || 'Insumo'}
            </div>
          </div>

          {/* Código QR Nítido y de Alta Velocidad (Módulos grandes) */}
          <div className="flex justify-center py-1" ref={qrSvgRef}>
            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-200 inline-block">
              <QRCodeSVG
                value={compactQrValue}
                size={labelSize === 'MINI' ? 100 : labelSize === 'WINE_COLLAR' ? 120 : 135}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Clave alfanumérica y modo de uso */}
          <div className="text-center">
            <span className="font-mono text-xs font-black text-gray-900 tracking-wider block bg-gray-100 py-0.5 px-2 rounded border border-gray-200">
              {activeBarcode}
            </span>
            <span className="text-[8px] font-bold text-gray-500 block mt-1">
              Escanea para: ➕ Entrada • ➖ Consumo • 🛒 Mandar al Súper
            </span>
          </div>

          {/* Detalles de residencia y tienda */}
          <div className="text-[9px] space-y-0.5 text-gray-700 font-medium border-t border-gray-200 pt-1.5 flex justify-between">
            <span>Ubicación: <strong>{item.zone || item.targetZone || 'Alacena'}</strong></span>
            <span>Tienda: <strong>{item.store || 'Supermercado'}</strong></span>
          </div>
        </div>

        {/* Feedback de NFC */}
        {nfcMessage && (
          <div className={`p-2.5 rounded-xl text-xs font-bold text-center border animate-fade-in print:hidden no-print ${
            nfcSuccess 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
          }`}>
            {nfcMessage}
          </div>
        )}

        {/* Action buttons (Hidden in print) */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#2A2521] print:hidden no-print">
          <div className="grid grid-cols-3 gap-2">
            {/* 1. Grabar NFC */}
            <button
              onClick={handleWriteNfc}
              disabled={nfcWriting}
              className="flex items-center justify-center gap-1 py-2 px-2 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
              title="Grabar en sticker NFC para frascos o botellas"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{nfcWriting ? 'Grabando...' : '📶 NFC'}</span>
            </button>

            {/* 2. Descargar PNG para Rotuladora Térmica Bluetooth */}
            <button
              onClick={handleDownloadPng}
              className="flex items-center justify-center gap-1 py-2 px-2 text-[11px] font-bold text-[#E0B441] bg-[#E0B441]/15 hover:bg-[#E0B441]/25 border border-[#E0B441]/35 rounded-xl transition-all shadow-md active:scale-95"
              title="Descargar imagen lista para rotuladoras Niimbot, Brother o Dymo"
            >
              <Download className="w-3.5 h-3.5" />
              <span>📲 Rotuladora</span>
            </button>

            {/* 3. Imprimir Etiqueta Limpia */}
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1 py-2 px-2 text-[11px] font-bold text-white bg-gradient-to-r from-[#C8542A] to-[#E0B441] hover:brightness-110 rounded-xl transition-all shadow-md active:scale-95"
              title="Mandar a imprimir hoja con guía de corte limpia"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>🖨️ Imprimir</span>
            </button>
          </div>

          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="w-full py-1.5 text-xs font-semibold text-[#B8AFA3] hover:text-white transition-all text-center"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
