import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  X, Camera, ScanLine, CheckCircle2, Plus, 
  ShoppingCart, Warehouse, AlertCircle, Sparkles, Keyboard 
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { lookupBarcode } from '../../services/barcodeLookupService';

export default function CameraScannerModal({ 
  isOpen, 
  onClose, 
  products, 
  zones, 
  onAddStockDirect, 
  onAddToShoppingList, 
  onOpenManualCaptureWithBarcode 
}) {
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'qr-reader-container';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setScannedResult(null);
      setCameraError(null);
      setManualCode('');
      return;
    }

    // Iniciar escáner al abrir modal
    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setCameraError(null);
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' }, // Cámara trasera en móviles
        {
          fps: 15,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.333,
        },
        onScanSuccess,
        () => {} // Ignorar errores de frame vacío
      );
      setScannerActive(true);
    } catch (err) {
      console.warn('Error al iniciar cámara:', err);
      setCameraError('No se pudo acceder a la cámara. Puedes ingresar el código de barras manualmente abajo.');
      setScannerActive(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.warn('Error al detener cámara:', err);
    }
    setScannerActive(false);
  };

  const onScanSuccess = async (decodedText) => {
    audio.success();
    await processBarcode(decodedText);
  };

  const processBarcode = async (code) => {
    setIsSearching(true);

    // 1. Verificar si es un código QR generado por ALACENA (JSON)
    if (code.trim().startsWith('{') && code.includes('ALACENA_ENTERPRISE')) {
      try {
        const qrJson = JSON.parse(code.trim());
        if (qrJson.type === 'PANTRY_ITEM') {
          setScannedResult({
            barcode: qrJson.id,
            product: {
              id: qrJson.id,
              name: qrJson.name,
              quantity: qrJson.qty || 1,
              unit: qrJson.unit || 'kg',
              zone: qrJson.zone || 'Alacena Principal',
              store: qrJson.store || 'Supermercado',
            },
            isExisting: true,
            isQrLabel: true,
          });
          setIsSearching(false);
          return;
        }
      } catch (e) {
        console.warn('Error parseando QR:', e);
      }
    }

    // 2. Buscar si ya existe en la despensa
    const existingInPantry = products.find(
      (p) => p.barcode === code || p.id === code || p.name.toLowerCase().includes(code.toLowerCase())
    );

    if (existingInPantry) {
      setScannedResult({
        barcode: code,
        product: existingInPantry,
        isExisting: true,
      });
      setIsSearching(false);
      return;
    }

    // 3. Buscar en catálogo EAN / Open Food Facts
    const lookup = await lookupBarcode(code);
    setScannedResult({
      barcode: code,
      product: lookup,
      isExisting: false,
    });
    setIsSearching(false);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    audio.click();
    await processBarcode(manualCode.trim());
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#131C31] sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Escáner de Código de Barras & QR
              </h3>
              <p className="text-xs text-gray-400">
                Apunta con la cámara en el súper o en casa para capturar y controlar productos.
              </p>
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

        {/* Scanner Body */}
        <div className="p-6 space-y-5">
          
          {/* Camera Viewport with Visual Overlay */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-black/80 border border-white/10 min-h-[240px] flex items-center justify-center">
            <div id={scannerContainerId} className="w-full" />

            {/* Target Reticle Overlay */}
            {scannerActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-36 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-0.5 -ml-0.5 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-0.5 -mr-0.5 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-0.5 -ml-0.5 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-0.5 -mr-0.5 rounded-br-lg" />
                  
                  {/* Laser Scan line animation */}
                  <div className="w-full h-0.5 bg-emerald-400/90 shadow-[0_0_8px_#10B981] animate-pulse absolute top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {cameraError && (
              <div className="p-4 text-center text-xs text-amber-300 max-w-sm">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                {cameraError}
              </div>
            )}
          </div>

          {/* Test Barcodes Quick Buttons */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <span>Probar Códigos Demo de Ejemplo:</span>
              <span className="text-emerald-400">1-Clic</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Harina (7501000111223)', code: '7501000111223' },
                { label: 'Ribeye (7501000777889)', code: '7501000777889' },
                { label: 'Vino Cava (7501000555667)', code: '7501000555667' },
                { label: 'Leche (7501055300076)', code: '7501055300076' },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    audio.click();
                    processBarcode(item.code);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white rounded-lg border border-white/10 transition-all"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Manual input fallback */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Keyboard className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="O escribe un código de barras (ej. 7501000111223)..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all"
            >
              Buscar
            </button>
          </form>

          {/* Scanned Result Banner */}
          {scannedResult && (
            <div className="p-4 rounded-2xl bg-[#162238] border border-emerald-500/30 space-y-3 animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {scannedResult.barcode}
                    </span>
                    {scannedResult.isExisting ? (
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">
                        Encontrado en Alacena
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 uppercase">
                        Nuevo Artículo Detectado
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">
                    {scannedResult.product.name}
                  </h4>
                  {scannedResult.isExisting ? (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Existencia actual: <strong className="text-white font-mono">{scannedResult.product.quantity} {scannedResult.product.unit}</strong> en <strong className="text-emerald-300">{scannedResult.product.zone}</strong>
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Catálogo sugerido: {scannedResult.product.category} • Precio estimado: ${scannedResult.product.price || 0} MXN
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons for Scanned Product */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10">
                {scannedResult.isExisting ? (
                  <>
                    <button
                      onClick={() => {
                        audio.success();
                        onAddStockDirect(scannedResult.product.id, 1);
                        setScannedResult(null);
                      }}
                      className="py-2.5 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Warehouse className="w-4 h-4" />
                      <span>+1 a la Alacena / Casa</span>
                    </button>
                    <button
                      onClick={() => {
                        audio.click();
                        onAddToShoppingList(scannedResult.product, 1);
                        setScannedResult(null);
                      }}
                      className="py-2.5 px-3 text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>+1 a Lista de Compras</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      audio.click();
                      onOpenManualCaptureWithBarcode(scannedResult.product);
                      onClose();
                    }}
                    className="col-span-full py-2.5 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Registrar en Inventario con Este Código</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
