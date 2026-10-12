import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Share2, ShoppingCart, Store, CheckCircle2 } from 'lucide-react';
import { audio } from '../../services/audioService';

export default function ShoppingListQrTicketModal({ 
  isOpen, 
  onClose, 
  shoppingList, 
  activeHouse,
  totalEstimatedMxn 
}) {
  if (!isOpen) return null;

  const pendingItems = shoppingList.filter((i) => !i.checked);

  const qrData = JSON.stringify({
    app: 'ALACENA_ENTERPRISE',
    type: 'SHOPPING_ORDER_TICKET',
    house: activeHouse?.name || 'Residencia Principal',
    itemsCount: pendingItems.length,
    totalMxn: totalEstimatedMxn,
    timestamp: new Date().toISOString(),
    items: pendingItems.map((i) => ({
      name: i.name,
      qty: i.quantity,
      unit: i.unit,
      store: i.store,
    })),
  });

  const handlePrint = () => {
    audio.click();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl p-6 space-y-5 print:bg-white print:text-black print:border-none">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Ticket QR de Orden para el Súper
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

        {/* Printable Ticket */}
        <div className="p-6 rounded-2xl bg-white text-gray-900 border-2 border-dashed border-gray-300 space-y-4">
          <div className="text-center border-b border-gray-200 pb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 block">
              ORDEN DE COMPRA • {activeHouse?.name || 'RESIDENCIA'}
            </span>
            <h4 className="text-lg font-extrabold text-gray-900 mt-0.5">
              Lista del Supermercado
            </h4>
            <div className="text-xs text-gray-500 mt-0.5">
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm inline-block">
              <QRCodeSVG
                value={qrData}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>
            <span className="text-[10px] text-gray-500 font-semibold mt-2 text-center">
              Escanea este QR con cualquier celular para cargar la orden interactiva
            </span>
          </div>

          {/* Summary */}
          <div className="border-t border-gray-200 pt-3 space-y-1.5 text-xs text-gray-700">
            <div className="flex justify-between font-bold">
              <span>Artículos por Comprar:</span>
              <span className="font-mono text-gray-900">{pendingItems.length} artículos</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-700">
              <span>Presupuesto Estimado:</span>
              <span className="font-mono">${totalEstimatedMxn.toFixed(2)} MXN</span>
            </div>
          </div>

          {/* Items breakdown snippet */}
          <div className="border-t border-gray-200 pt-3 max-h-40 overflow-y-auto space-y-1 text-[11px] text-gray-600">
            {pendingItems.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="truncate max-w-[200px]">
                  • {item.name} ({item.quantity} {item.unit})
                </span>
                <span className="text-gray-400 text-[10px]">{item.store}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
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
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition-all shadow-md shadow-amber-950/40"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket</span>
          </button>
        </div>

      </div>
    </div>
  );
}
