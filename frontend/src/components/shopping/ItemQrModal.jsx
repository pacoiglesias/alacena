import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Check, MapPin, Calendar, Tag, Store, QrCode } from 'lucide-react';
import { audio } from '../../services/audioService';

export default function ItemQrModal({ isOpen, onClose, item, activeHouse }) {
  if (!isOpen || !item) return null;

  const qrPayload = JSON.stringify({
    app: 'ALACENA_ENTERPRISE',
    type: 'PANTRY_ITEM',
    id: item.id,
    name: item.name,
    qty: item.quantity,
    unit: item.unit,
    zone: item.targetZone || 'Alacena Principal',
    store: item.store || 'Supermercado',
    date: new Date().toISOString().split('T')[0],
  });

  const handlePrint = () => {
    audio.click();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl p-6 space-y-5 print:bg-white print:text-black print:border-none print:shadow-none">
        
        {/* Header (Hidden in print) */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Etiqueta QR de Almacén
            </h3>
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
        <div className="p-5 rounded-2xl bg-white text-gray-900 border-2 border-dashed border-gray-300 space-y-4 shadow-inner">
          <div className="text-center border-b border-gray-200 pb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 block">
              ALACENA ENTERPRISE • CONTROL DE STOCK
            </span>
            <h4 className="text-base font-extrabold text-gray-900 leading-tight mt-0.5">
              {item.name}
            </h4>
            <div className="text-xs font-bold text-gray-600 mt-0.5">
              {item.quantity} {item.unit}
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-1">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-200 inline-block">
              <QRCodeSVG
                value={qrPayload}
                size={160}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Label Details */}
          <div className="text-[11px] space-y-1 text-gray-700 font-medium border-t border-gray-200 pt-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Ubicación Asignada:</span>
              <strong className="text-gray-900 font-bold">{item.targetZone || 'Alacena Principal'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Proveedor / Tienda:</span>
              <span>{item.store || 'Supermercado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fecha de Empaque:</span>
              <span>{new Date().toLocaleDateString('es-MX')}</span>
            </div>
            {activeHouse?.name && (
              <div className="flex justify-between">
                <span className="text-gray-500">Residencia:</span>
                <span className="truncate max-w-[130px]">{activeHouse.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons (Hidden in print) */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10 print:hidden">
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-950/40"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Etiqueta</span>
          </button>
        </div>

      </div>
    </div>
  );
}
