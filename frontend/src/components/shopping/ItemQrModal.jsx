import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, Printer, Check, MapPin, Calendar, Tag, Store, QrCode, 
  Radio, Sparkles, AlertCircle 
} from 'lucide-react';
import { audio } from '../../services/audioService';

export default function ItemQrModal({ isOpen, onClose, item, activeHouse, onUpdateProduct }) {
  const [nfcWriting, setNfcWriting] = useState(false);
  const [nfcSuccess, setNfcSuccess] = useState(false);
  const [nfcMessage, setNfcMessage] = useState('');

  if (!isOpen || !item) return null;

  // Si no tiene código de barras previo, el sistema autogenera uno persistente
  const activeBarcode = item.barcode || `ALC-${(item.id || '').replace('prod-', '').toUpperCase() || Date.now().toString(36).toUpperCase()}`;

  const qrPayload = JSON.stringify({
    app: 'ALACENA_ENTERPRISE',
    type: 'PANTRY_ITEM',
    id: item.id || activeBarcode,
    barcode: activeBarcode,
    name: item.name,
    qty: item.quantity,
    unit: item.unit,
    zone: item.zone || item.targetZone || 'Alacena Principal',
    store: item.store || 'Supermercado',
    date: new Date().toISOString().split('T')[0],
  });

  const handlePrint = () => {
    audio.click();
    window.print();
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
            data: qrPayload,
          },
        ],
      });

      audio.success();
      setNfcWriting(false);
      setNfcSuccess(true);
      setNfcMessage('✓ ¡Etiqueta NFC grabada exitosamente! Ya puedes pegarla en el frasco o botella.');
      setTimeout(() => setNfcSuccess(false), 4000);
    } catch (err) {
      console.warn('Error grabando NFC:', err);
      setNfcWriting(false);
      setNfcMessage(`⚠️ No se pudo grabar: ${err.message || 'Intenta de nuevo'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#14110F] border border-[#E0B441]/30 shadow-2xl p-6 space-y-4 print:bg-white print:text-black print:border-none print:shadow-none">
        
        {/* Header (Hidden in print) */}
        <div className="flex items-center justify-between border-b border-[#2A2521] pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#E0B441]" />
            <div>
              <h3 className="text-sm font-bold text-white font-display">
                Etiqueta QR & NFC del Hogar
              </h3>
              <span className="text-[10px] text-[#B8AFA3]">
                {item.barcode ? 'Código existente' : '✨ Código autogenerado por ALACENA'}
              </span>
            </div>
          </div>
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

        {/* Physical Printable Label Box */}
        <div className="p-5 rounded-2xl bg-white text-gray-900 border-2 border-dashed border-gray-300 space-y-3 shadow-inner">
          <div className="text-center border-b border-gray-200 pb-2">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#6B1F2E] block">
              ALACENA & CAVA • CONTROL DE STOCK EN CASA
            </span>
            <h4 className="text-base font-extrabold text-gray-900 leading-tight mt-0.5">
              {item.name}
            </h4>
            <div className="text-xs font-bold text-gray-600 mt-0.5">
              {item.quantity} {item.unit} • {item.zone || item.targetZone || 'Alacena'}
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-1">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-200 inline-block">
              <QRCodeSVG
                value={qrPayload}
                size={150}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Multidirectional Instructions on the sticker */}
          <div className="text-[9px] text-center font-bold text-gray-600 bg-gray-100 py-1 px-2 rounded-lg">
            📱 Escanear con la app para: ➕ Entrada • ➖ Consumo • 🛒 Mandar al Súper
          </div>

          {/* Label Details */}
          <div className="text-[10px] space-y-1 text-gray-700 font-medium border-t border-gray-200 pt-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Código Único:</span>
              <strong className="text-gray-900 font-mono font-bold">{activeBarcode}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ubicación:</span>
              <strong className="text-gray-900 font-bold">{item.zone || item.targetZone || 'Alacena Principal'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tienda Habitual:</span>
              <span>{item.store || 'Supermercado'}</span>
            </div>
            {activeHouse?.name && (
              <div className="flex justify-between">
                <span className="text-gray-500">Residencia:</span>
                <span className="truncate max-w-[130px]">{activeHouse.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Feedback de NFC */}
        {nfcMessage && (
          <div className={`p-2.5 rounded-xl text-xs font-bold text-center border animate-fade-in ${
            nfcSuccess 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
          }`}>
            {nfcMessage}
          </div>
        )}

        {/* Action buttons (Hidden in print) */}
        <div className="flex flex-col gap-2 pt-1 border-t border-[#2A2521] print:hidden">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleWriteNfc}
              disabled={nfcWriting}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
              title="Grabar en sticker NFC para frascos o botellas"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{nfcWriting ? 'Acercando...' : '📶 Grabar NFC'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-gradient-to-r from-[#C8542A] to-[#E0B441] hover:brightness-110 rounded-xl transition-all shadow-md active:scale-95"
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
            className="w-full py-1.5 text-xs font-bold text-[#B8AFA3] hover:text-white transition-all text-center"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
