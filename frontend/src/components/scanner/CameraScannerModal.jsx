import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  X, Camera, ScanLine, CheckCircle2, Plus, 
  ShoppingCart, Warehouse, AlertCircle, Sparkles, 
  Keyboard, Image, RefreshCw, Check, Globe, ExternalLink, Search 
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
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');

  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const scannerContainerId = 'qr-reader-container';

  useEffect(() => {
    let timeoutId;

    if (!isOpen) {
      stopScanner();
      setScannedResult(null);
      setCameraError(null);
      setManualCode('');
      return;
    }

    // Esperar a que el elemento div esté montado en el DOM antes de iniciar la cámara
    timeoutId = setTimeout(() => {
      initCamerasAndStart();
    }, 250);

    return () => {
      clearTimeout(timeoutId);
      stopScanner();
    };
  }, [isOpen]);

  const initCamerasAndStart = async () => {
    try {
      setCameraError(null);

      const availableCameras = await Html5Qrcode.getCameras().catch(() => []);
      setCameras(availableCameras);

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
          ],
          verbose: false,
        });
      }

      // Elegir cámara trasera si existe, de lo contrario la primera disponible o constraint
      let cameraConfig = { facingMode: 'environment' };
      if (availableCameras && availableCameras.length > 0) {
        const backCam = availableCameras.find(c => 
          c.label.toLowerCase().includes('back') || 
          c.label.toLowerCase().includes('trasera') || 
          c.label.toLowerCase().includes('rear')
        );
        const chosenCam = backCam || availableCameras[0];
        setSelectedCameraId(chosenCam.id);
        cameraConfig = chosenCam.id;
      }

      await html5QrCodeRef.current.start(
        cameraConfig,
        {
          fps: 15,
          qrbox: { width: 310, height: 160 },
          aspectRatio: 1.333,
        },
        onScanSuccess,
        () => {} // Ignorar errores de frames sin código
      );
      setScannerActive(true);
    } catch (err) {
      console.warn('Error al iniciar cámara WebRTC:', err);
      // Intentar fallback simple con constraints genéricas
      try {
        if (html5QrCodeRef.current) {
          await html5QrCodeRef.current.start(
            { facingMode: 'user' },
            { fps: 10, qrbox: { width: 260, height: 160 } },
            onScanSuccess,
            () => {}
          );
          setScannerActive(true);
          return;
        }
      } catch (e) {
        console.warn('Fallback de cámara también falló:', e);
      }

      setCameraError('No se pudo abrir la cámara en vivo. Puedes tomar una foto con el botón "Subir Foto" o ingresar el código abajo.');
      setScannerActive(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
    } catch (err) {
      console.warn('Error al detener cámara:', err);
    }
    setScannerActive(false);
  };

  const onScanSuccess = async (decodedText) => {
    audio.tripleFeedback(880, 35);
    await processBarcode(decodedText);
  };

  // Escaneo a través de archivo / captura de imagen (100% compatible con iPhone/Android/PC)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      audio.click();
      setIsSearching(true);
      const scanner = html5QrCodeRef.current || new Html5Qrcode(scannerContainerId);
      const decoded = await scanner.scanFile(file, true);
      audio.success();
      await processBarcode(decoded);
    } catch (err) {
      alert('No se detectó un código de barras legible en la foto. Intenta con mejor iluminación o escribe el código.');
    } finally {
      setIsSearching(false);
    }
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
                Escáner de Código de Barras & QR en Vivo
              </h3>
              <p className="text-xs text-gray-400">
                Apunta con tu celular o cámara web. También puedes subir una foto o escribir el código.
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
          <div className="relative w-full rounded-2xl overflow-hidden bg-black/90 border border-white/10 min-h-[260px] flex items-center justify-center">
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

            {/* Camera error / Fallback trigger */}
            {!scannerActive && (
              <div className="p-6 text-center space-y-3">
                <AlertCircle className="w-8 h-8 mx-auto text-amber-400" />
                <p className="text-xs text-amber-200 max-w-xs mx-auto">
                  {cameraError || 'Iniciando conexión con la cámara del dispositivo...'}
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={initCamerasAndStart}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-xl transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reintentar Abrir Cámara</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all"
                  >
                    <Image className="w-3.5 h-3.5" />
                    <span>Tomar / Subir Foto</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Input for Direct Camera Snapshot */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Selector de Cámara si hay varias */}
          {cameras.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">Cambiar Cámara:</span>
              <select
                value={selectedCameraId}
                onChange={async (e) => {
                  setSelectedCameraId(e.target.value);
                  await stopScanner();
                  if (html5QrCodeRef.current) {
                    await html5QrCodeRef.current.start(
                      e.target.value,
                      { fps: 15, qrbox: { width: 280, height: 180 } },
                      onScanSuccess,
                      () => {}
                    );
                    setScannerActive(true);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Cámara ${c.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Test Barcodes Quick Buttons */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <span>Probar Códigos de Ejemplo (1-Clic):</span>
              <span className="text-emerald-400">Sin Cámara</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '🥤 Coca-Cola (7501055301097)', code: '7501055301097' },
                { label: 'Harina (7501000111223)', code: '7501000111223' },
                { label: 'Ribeye (7501000777889)', code: '7501000777889' },
                { label: 'Vino Cava (7501000555667)', code: '7501000555667' },
                { label: 'Leche (7501055300076)', code: '7501055300076' },
                { label: 'Huevos (7501008000011)', code: '7501008000011' },
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
                placeholder="O escribe un código de barras (ej. 7501055301097 de Coca Cola)..."
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
                <div className="flex items-start gap-3">
                  {scannedResult.product.photo && (
                    <img
                      src={scannedResult.product.photo}
                      alt={scannedResult.product.name}
                      className="w-14 h-14 rounded-xl object-contain bg-white/5 border border-white/10 shrink-0 p-1"
                    />
                  )}
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
                          {scannedResult.product.source === 'INTERNET_OPENFOODFACTS' ? '🌐 Reconocido en Internet' : 'Artículo Reconocido'}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-white mt-1">
                      {scannedResult.product.name}
                    </h4>
                    {scannedResult.product.brand && (
                      <p className="text-xs text-amber-300 font-semibold">
                        Marca: {scannedResult.product.brand}
                      </p>
                    )}
                    {scannedResult.isExisting ? (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Existencia actual: <strong className="text-white font-mono">{scannedResult.product.quantity} {scannedResult.product.unit}</strong> en <strong className="text-emerald-300">{scannedResult.product.zone}</strong>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Categoría sugerida: {scannedResult.product.category || 'Abarrotes'} • Precio estimado: ${scannedResult.product.price || 0} MXN
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de Consulta en Internet */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <a
                  href={scannedResult.product.googleSearchUrl || `https://www.google.com/search?q=${encodeURIComponent(scannedResult.barcode)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-blue-300 border border-blue-500/20 transition-all font-medium"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>🌐 Ver en Google (Fotos y Precios)</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>

                <a
                  href={scannedResult.product.chedrauiSearchUrl || `https://www.chedraui.com.mx/search?text=${encodeURIComponent(scannedResult.barcode)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-orange-300 border border-orange-500/20 transition-all font-medium"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>🛒 Consultar en Chedraui</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>

              {/* Action Buttons for Scanned Product (1-Tap for domestic staff) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    audio.success();
                    onAddToShoppingList(scannedResult.product, 1);
                    setScannedResult(null);
                  }}
                  className="py-3 px-3 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-950/40"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>🛒 Falta en Casa: Apuntar al Súper (1 Toque)</span>
                </button>

                {scannedResult.isExisting ? (
                  <button
                    onClick={() => {
                      audio.success();
                      onAddStockDirect(scannedResult.product.id, 1);
                      setScannedResult(null);
                    }}
                    className="py-3 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Warehouse className="w-4 h-4" />
                    <span>➕ Llegó a Casa: +1 a Alacena</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      audio.click();
                      onOpenManualCaptureWithBarcode(scannedResult.product);
                      onClose();
                    }}
                    className="py-3 px-3 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>➕ Registrar en Alacena Permanente</span>
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
