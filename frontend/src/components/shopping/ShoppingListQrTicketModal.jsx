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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in print:bg-white print:p-0 print:static print:z-0">
      
      {/* Aislamiento estricto de impresión en papel */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-shopping-ticket, #printable-shopping-ticket * {
            visibility: visible !important;
          }
          #printable-shopping-ticket {
            position: absolute !important;
            left: 50% !important;
            top: 15mm !important;
            transform: translateX(-50%) !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 5mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: 2px dashed #444444 !important;
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

      <div className="relative w-full max-w-md max-h-[94vh] overflow-y-auto rounded-3xl bg-[#14110F] border border-[#E0B441]/35 shadow-2xl p-4 sm:p-6 space-y-4 print:border-none print:shadow-none print:p-0 print:bg-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2521] pb-3 print:hidden no-print">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#E0B441]" />
            <h3 className="text-base font-bold text-white font-display">
              Ticket QR de Orden para el Súper
            </h3>
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

        {/* Printable Ticket */}
        <div id="printable-shopping-ticket" className="p-5 rounded-2xl bg-white text-gray-900 border-2 border-dashed border-gray-400 space-y-4">
          <div className="text-center border-b border-gray-200 pb-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#6B1F2E] block">
              ORDEN DE COMPRA • {activeHouse?.name || 'RESIDENCIA'}
            </span>
            <h4 className="text-base font-extrabold text-gray-900 mt-0.5">
              Lista del Supermercado
            </h4>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center py-1">
            <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm inline-block">
              <QRCodeSVG
                value={qrData}
                size={170}
                level="M"
                includeMargin={false}
              />
            </div>
            <span className="text-[9px] text-gray-500 font-semibold mt-1.5 text-center">
              Escanea este QR con cualquier celular para cargar la orden interactiva
            </span>
          </div>

          {/* Summary */}
          <div className="border-t border-gray-200 pt-2 space-y-1 text-xs text-gray-700">
            <div className="flex justify-between font-bold">
              <span>Artículos por Comprar:</span>
              <span className="font-mono text-gray-900">{pendingItems.length} artículos</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-800">
              <span>Presupuesto Estimado:</span>
              <span className="font-mono">${totalEstimatedMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
            </div>
          </div>

          {/* Items Preview */}
          <div className="border-t border-gray-200 pt-2 max-h-44 overflow-y-auto space-y-1 text-[11px] text-gray-600 font-mono">
            {pendingItems.slice(0, 10).map((item, idx) => (
              <div key={idx} className="flex justify-between py-0.5 border-b border-gray-100 last:border-0">
                <span className="truncate max-w-[190px]">{item.name}</span>
                <span className="font-bold text-gray-900">{item.quantity} {item.unit}</span>
              </div>
            ))}
            {pendingItems.length > 10 && (
              <div className="text-center text-[10px] text-gray-500 pt-1">
                + {pendingItems.length - 10} artículos más en la orden
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-[#2A2521] print:hidden no-print">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-[#12100E] bg-gradient-to-r from-[#E0B441] to-[#E5724A] hover:brightness-110 rounded-xl transition-all shadow-md active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket Limpio</span>
          </button>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="py-2.5 px-4 text-xs font-bold text-[#B8AFA3] hover:text-white bg-white/5 rounded-xl transition-all"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
