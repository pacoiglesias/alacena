import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  X, Camera, ScanLine, CheckCircle2, Plus, Minus,
  ShoppingCart, Warehouse, AlertCircle, Sparkles, 
  Keyboard, Image, RefreshCw, Check, Globe, ExternalLink, Search, Zap,
  Wine, Refrigerator, Edit3, Flashlight, Radio, Nfc
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { lookupBarcode } from '../../services/barcodeLookupService';

export default function CameraScannerModal({ 
  isOpen, 
  onClose, 
  products = [], 
  zones = [], 
  onAddStockDirect, 
  onSubtractStockDirect,
  onAddToShoppingList, 
  onOpenManualCaptureWithBarcode,
  onEditZone,
  onAddZone,
}) {
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  
  // Modos de Dirección QR / NFC: 'INTERACTIVE' | 'ADD_ENTRY' | 'CONSUME_EXIT' | 'RESTOCK_SUPER'
  const [scanDirectionMode, setScanDirectionMode] = useState('INTERACTIVE');
  const [batchHistory, setBatchHistory] = useState([]);
  const [lastBatchMessage, setLastBatchMessage] = useState(null);
  const [selectedTargetZone, setSelectedTargetZone] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  
  // Soporte NFC (Web NFC NDEF)
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcScanning, setNfcScanning] = useState(false);
  const [nfcStatusMessage, setNfcStatusMessage] = useState('');

  const lastScanTimeRef = useRef(0);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const nfcAbortControllerRef = useRef(null);
  const scannerContainerId = 'qr-reader-container';

  // Detectar soporte NFC en navegador
  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setNfcSupported(true);
    }
  }, []);

  // Default target zone to Alacena or first zone
  useEffect(() => {
    if (zones.length > 0 && !selectedTargetZone) {
      const defaultPantry = zones.find(z => z.type === 'DRY_PANTRY') || zones[0];
      setSelectedTargetZone(defaultPantry.name);
    }
  }, [zones]);

  useEffect(() => {
    let timeoutId;

    if (!isOpen) {
      stopScanner();
      stopNfcScan();
      setScannedResult(null);
      setCameraError(null);
      setManualCode('');
      setTorchOn(false);
      return;
    }

    // Esperar al montaje completo del DOM modal antes de arrancar la cámara
    timeoutId = setTimeout(() => {
      startCameraWithPermission();
    }, 280);

    return () => {
      clearTimeout(timeoutId);
      stopScanner();
      stopNfcScan();
    };
  }, [isOpen]);

  // Limpiar y detener de forma segura el escáner
  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop().catch(() => {});
        }
        try {
          html5QrCodeRef.current.clear();
        } catch (e) {}
        html5QrCodeRef.current = null;
      }
    } catch (err) {
      console.warn('Error al detener cámara:', err);
    }
    setScannerActive(false);
  };

  // Web NFC Reader: Iniciar lectura NFC por contacto
  const startNfcScan = async () => {
    if (!('NDEFReader' in window)) {
      alert('Tu navegador o dispositivo no soporta Web NFC. Web NFC funciona en Google Chrome en teléfonos Android con NFC activado.');
      return;
    }

    try {
      audio.click();
      nfcAbortControllerRef.current = new AbortController();
      const ndef = new window.NDEFReader();
      await ndef.scan({ signal: nfcAbortControllerRef.current.signal });
      setNfcScanning(true);
      setNfcStatusMessage('📶 Lector NFC listo: Acerca la etiqueta o sticker al reverso de tu celular...');

      ndef.onreading = (event) => {
        audio.tripleFeedback(950, 40);
        const decoder = new TextDecoder();
        let readText = '';

        for (const record of event.message.records) {
          if (record.recordType === 'text') {
            readText = decoder.decode(record.data);
            break;
          }
        }

        if (readText) {
          processBarcode(readText);
        } else if (event.serialNumber) {
          processBarcode(event.serialNumber);
        }
      };

      ndef.onreadingerror = () => {
        setNfcStatusMessage('⚠️ Error leyendo etiqueta NFC. Intenta acercarla nuevamente.');
      };
    } catch (error) {
      console.warn('Error iniciando NFC:', error);
      setNfcScanning(false);
      setNfcStatusMessage(`Error NFC: ${error.message || 'No se pudo iniciar el lector'}`);
    }
  };

  const stopNfcScan = () => {
    if (nfcAbortControllerRef.current) {
      nfcAbortControllerRef.current.abort();
      nfcAbortControllerRef.current = null;
    }
    setNfcScanning(false);
    setNfcStatusMessage('');
  };

  // Solicitar permiso de cámara y arrancar
  const startCameraWithPermission = async (forcedCameraId = null) => {
    try {
      setCameraError(null);

      // Limpiar contenedor en el DOM
      await stopScanner();
      const containerEl = document.getElementById(scannerContainerId);
      if (!containerEl) {
        setCameraError('El contenedor visual de cámara no está listo. Haz clic en "Reintentar".');
        return;
      }
      containerEl.innerHTML = '';

      // 1. Solicitar permiso preventivo a WebRTC para enumerar cámaras con nombres legibles
      if (navigator?.mediaDevices?.getUserMedia) {
        try {
          const testStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: { ideal: 'environment' } } 
          });
          testStream.getTracks().forEach(track => track.stop());
        } catch (permErr) {
          console.warn('Permiso WebRTC advertencia:', permErr);
          if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
            setCameraError('El navegador bloqueó el permiso de la cámara. Concede permiso en el candado de la URL o usa el botón "📸 Tomar Foto con Cámara Nativa".');
            setScannerActive(false);
            return;
          }
        }
      }

      // 2. Obtener lista de cámaras disponibles
      let availableCameras = [];
      try {
        availableCameras = await Html5Qrcode.getCameras();
        setCameras(availableCameras || []);
      } catch (e) {
        console.warn('No se pudieron listar cámaras explícitas:', e);
      }

      // 3. Crear nueva instancia limpia
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

      // 4. Seleccionar la mejor cámara (trasera preferente para código de barras)
      let cameraConfig = { facingMode: 'environment' };
      if (forcedCameraId) {
        cameraConfig = forcedCameraId;
        setSelectedCameraId(forcedCameraId);
      } else if (availableCameras && availableCameras.length > 0) {
        const backCam = availableCameras.find(c => {
          const label = (c.label || '').toLowerCase();
          return label.includes('back') || label.includes('trasera') || label.includes('rear') || label.includes('environment');
        });
        const chosenCam = backCam || availableCameras[0];
        setSelectedCameraId(chosenCam.id);
        cameraConfig = chosenCam.id;
      }

      // 5. Iniciar transmisión
      await html5QrCodeRef.current.start(
        cameraConfig,
        {
          fps: 15,
          qrbox: { width: 300, height: 160 },
          aspectRatio: 1.333,
        },
        onScanSuccess,
        () => {} // Ignorar cuadros sin detección
      );

      setScannerActive(true);
      setCameraError(null);
    } catch (err) {
      console.warn('Error al iniciar cámara principal:', err);
      
      // Fallback: intentar con facingMode genérico 'user'
      try {
        await stopScanner();
        const el = document.getElementById(scannerContainerId);
        if (el) el.innerHTML = '';

        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId, { verbose: false });
        await html5QrCodeRef.current.start(
          { facingMode: 'user' },
          { fps: 10, qrbox: { width: 260, height: 150 } },
          onScanSuccess,
          () => {}
        );
        setScannerActive(true);
        setCameraError(null);
        return;
      } catch (fallbackErr) {
        console.warn('Fallback también falló:', fallbackErr);
      }

      setCameraError('No se pudo abrir la cámara en vivo. Puedes usar el botón "📸 Tomar Foto con Cámara Nativa" (funciona en cualquier celular) o escribir el código de barras abajo.');
      setScannerActive(false);
    }
  };

  const onScanSuccess = async (decodedText) => {
    audio.tripleFeedback(880, 35);
    await processBarcode(decodedText);
  };

  // Alternar linterna / flash
  const handleToggleTorch = async () => {
    try {
      if (html5QrCodeRef.current && scannerActive) {
        const newTorchState = !torchOn;
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: newTorchState }]
        });
        setTorchOn(newTorchState);
        audio.click();
      }
    } catch (e) {
      alert('La linterna no está disponible en este dispositivo.');
    }
  };

  // Escaneo instantáneo por archivo o foto de cámara nativa
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
      alert('No se detectó un código de barras legible en la foto. Intenta con mejor iluminación o escribe el código manualmente.');
      setIsSearching(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Ejecución multidireccional automática según el modo seleccionado
  const executeDirectAction = (targetProduct, actionType) => {
    const timeStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (actionType === 'ADD_ENTRY') {
      audio.success();
      if (onAddStockDirect) {
        onAddStockDirect(targetProduct.id, 1, selectedTargetZone || targetProduct.zone);
      }
      setBatchHistory((prev) => [{ name: targetProduct.name, action: '+1 Ingreso', time: timeStr }, ...prev.slice(0, 8)]);
      setLastBatchMessage(`➕ +1 "${targetProduct.name}" ingresado a ${selectedTargetZone || targetProduct.zone || 'Alacena'}`);
      setTimeout(() => setLastBatchMessage(null), 3000);
      return true;
    }

    if (actionType === 'CONSUME_EXIT') {
      audio.delete();
      if (onSubtractStockDirect) {
        onSubtractStockDirect(targetProduct.id, 1);
      }
      setBatchHistory((prev) => [{ name: targetProduct.name, action: '-1 Consumo', time: timeStr }, ...prev.slice(0, 8)]);
      setLastBatchMessage(`➖ -1 "${targetProduct.name}" consumido / retirado`);
      setTimeout(() => setLastBatchMessage(null), 3000);
      return true;
    }

    if (actionType === 'RESTOCK_SUPER') {
      audio.cook();
      if (onAddToShoppingList) {
        onAddToShoppingList(targetProduct, 1);
      }
      setBatchHistory((prev) => [{ name: targetProduct.name, action: '🛒 Al Súper', time: timeStr }, ...prev.slice(0, 8)]);
      setLastBatchMessage(`🛒 "${targetProduct.name}" enviado a la Lista del Súper`);
      setTimeout(() => setLastBatchMessage(null), 3000);
      return true;
    }

    return false;
  };

  const processBarcode = async (code) => {
    setIsSearching(true);

    const now = Date.now();
    if (now - lastScanTimeRef.current < 1600) {
      setIsSearching(false);
      return;
    }
    lastScanTimeRef.current = now;

    // 1. Detectar si es Vino/Licor para auto-asignar Cava
    const isLikelyWine = (nameOrCat) => {
      const txt = (nameOrCat || '').toLowerCase();
      return txt.includes('vino') || txt.includes('crianza') || txt.includes('reserva') || 
             txt.includes('champagne') || txt.includes('cava') || txt.includes('licor') || 
             txt.includes('tequila') || txt.includes('whisky') || txt.includes('mezcal') || 
             txt.includes('bodega') || txt.includes('añada') || txt.includes('tinto');
    };

    const cavaZone = zones.find(z => z.type === 'WINE_CELLAR') || zones[0];
    const pantryZone = zones.find(z => z.type === 'DRY_PANTRY') || zones[0];

    // 2. ¿Es un código QR / NFC propio de ALACENA?
    if (code.trim().startsWith('{') && code.includes('ALACENA_ENTERPRISE')) {
      try {
        const qrJson = JSON.parse(code.trim());
        if (qrJson.type === 'PANTRY_ITEM') {
          const matchedProd = products.find(p => p.id === qrJson.id) || {
            id: qrJson.id,
            name: qrJson.name,
            quantity: qrJson.qty || 1,
            unit: qrJson.unit || 'kg',
            zone: qrJson.zone || pantryZone.name,
            store: qrJson.store || 'Supermercado',
          };

          if (scanDirectionMode !== 'INTERACTIVE') {
            executeDirectAction(matchedProd, scanDirectionMode);
            setIsSearching(false);
            return;
          }

          setScannedResult({
            barcode: qrJson.id,
            product: matchedProd,
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

    // 3. Buscar si ya existe en la despensa
    const existingInPantry = products.find(
      (p) => p.barcode === code || p.id === code || p.name.toLowerCase().includes(code.toLowerCase())
    );

    if (existingInPantry) {
      const assignedZone = selectedTargetZone || existingInPantry.zone || pantryZone.name;
      const targetProd = { ...existingInPantry, zone: assignedZone };

      if (scanDirectionMode !== 'INTERACTIVE') {
        executeDirectAction(targetProd, scanDirectionMode);
        setIsSearching(false);
        return;
      }

      setScannedResult({
        barcode: code,
        product: targetProd,
        isExisting: true,
      });
      setIsSearching(false);
      return;
    }

    // 4. Buscar en catálogo EAN / Open Food Facts
    const lookup = await lookupBarcode(code);
    const looksWine = isLikelyWine(lookup.name) || isLikelyWine(lookup.category);
    const suggestedZone = looksWine ? (cavaZone?.name || 'Cava Principal') : (selectedTargetZone || pantryZone?.name || 'Alacena Principal');

    if (looksWine && cavaZone) {
      setSelectedTargetZone(cavaZone.name);
    }

    const newProd = { ...lookup, zone: suggestedZone, isWine: looksWine };

    if (scanDirectionMode === 'RESTOCK_SUPER') {
      executeDirectAction(newProd, 'RESTOCK_SUPER');
      setIsSearching(false);
      return;
    }

    setScannedResult({
      barcode: code,
      product: newProd,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[94vh] overflow-y-auto rounded-3xl bg-[#14110F] border border-[#E0B441]/30 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#2A2521] bg-[#1C1814] sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#E0B441]/20 to-[#C8542A]/20 border border-[#E0B441]/40 text-[#E0B441]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">
                  Escáner Multidireccional QR · NFC · Código
                </h3>
                {nfcSupported && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] font-bold">
                    NFC Activo
                  </span>
                )}
              </div>
              <p className="text-xs text-[#B8AFA3]">
                Agrega, descuenta o manda al súper en todas direcciones.
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
        <div className="p-5 sm:p-6 space-y-4">

          {/* ═════════════════════════════════════════════════════════════════
              SELECTOR MULTIDIRECCIONAL: ¿QUÉ QUIERES QUE HAGA AL ESCANEAR?
             ═════════════════════════════════════════════════════════════════ */}
          <div className="p-3.5 rounded-2xl bg-[#1C1814] border border-[#2A2521] space-y-2">
            <span className="text-[11px] font-extrabold text-[#E0B441] uppercase tracking-wider block">
              Dirección de Acción Inmediata (Multidireccional):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'INTERACTIVE', label: 'Manual / Interactivo', icon: Edit3, color: 'text-amber-300' },
                { id: 'ADD_ENTRY', label: '➕ Entrada (+1 Compra)', icon: Plus, color: 'text-emerald-400' },
                { id: 'CONSUME_EXIT', label: '➖ Salida (-1 Consumo)', icon: Minus, color: 'text-rose-400' },
                { id: 'RESTOCK_SUPER', label: '🛒 Se Acabó -> Súper', icon: ShoppingCart, color: 'text-orange-400' },
              ].map((item) => {
                const IconComponent = item.icon;
                const isSelected = scanDirectionMode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      audio.click();
                      setScanDirectionMode(item.id);
                    }}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-bold transition-all text-left ${
                      isSelected
                        ? 'bg-[#E0B441]/20 border-[#E0B441] text-[#E0B441] shadow-sm'
                        : 'bg-[#12100E] border-[#2A2521] text-[#B8AFA3] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#E0B441]' : item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de Destino Cava vs Alacena */}
          <div className="p-3.5 rounded-2xl bg-[#1C1814] border border-[#2A2521] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-[#B8AFA3] uppercase tracking-wider flex items-center gap-1.5">
                <Warehouse className="w-3.5 h-3.5 text-[#E0B441]" />
                Ubicación Destino:
              </span>
              
              <button
                type="button"
                onClick={() => {
                  audio.click();
                  const targetZoneObj = zones.find(z => z.name === selectedTargetZone) || zones[0];
                  if (onEditZone && targetZoneObj) {
                    onEditZone(targetZoneObj);
                  } else if (onAddZone) {
                    onAddZone();
                  }
                }}
                className="text-[11px] font-bold text-[#E0B441] hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>✏️ Renombrar Cava o Agregar Espacios</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {zones.map((z) => {
                const isSelected = selectedTargetZone === z.name;
                const isWine = z.type === 'WINE_CELLAR';
                return (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => {
                      audio.click();
                      setSelectedTargetZone(z.name);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? isWine
                          ? 'bg-[#6B1F2E] border-[#E0B441] text-white shadow-md shadow-[#6B1F2E]/40 font-bold'
                          : 'bg-[#C8542A] border-[#E0B441] text-white shadow-md font-bold'
                        : 'bg-[#12100E] border-[#2A2521] text-[#B8AFA3] hover:text-white hover:border-[#E0B441]/40'
                    }`}
                  >
                    {isWine ? <Wine className="w-3.5 h-3.5 text-[#E0B441]" /> : <Warehouse className="w-3.5 h-3.5" />}
                    <span>{z.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Barra de NFC / Contacto Inmediato */}
          {nfcSupported && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-[#1C1814] border border-blue-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${nfcScanning ? 'bg-blue-500 text-white animate-pulse' : 'bg-blue-500/20 text-blue-300'}`}>
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {nfcScanning ? '📶 Escuchando NFC por Contacto...' : 'Toque Inmediato con NFC'}
                  </span>
                  <span className="text-[10px] text-blue-200 block">
                    {nfcStatusMessage || 'Acerca el celular a los frascos o botellas con sticker NFC'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={nfcScanning ? stopNfcScan : startNfcScan}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
                  nfcScanning
                    ? 'bg-rose-500 hover:bg-rose-400 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                }`}
              >
                {nfcScanning ? 'Detener NFC' : 'Activar NFC'}
              </button>
            </div>
          )}

          {/* Feedback Flotante de Acciones en Ráfaga */}
          {lastBatchMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between animate-fade-in shadow-md">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                {lastBatchMessage}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 font-mono">
                {batchHistory.length} acciones
              </span>
            </div>
          )}
          
          {/* Camera Viewport with Visual Overlay */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-[#2A2521] min-h-[250px] flex items-center justify-center">
            <div id={scannerContainerId} className="w-full" />

            {/* Target Reticle Overlay */}
            {scannerActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-36 border-2 border-[#E0B441]/80 rounded-2xl relative shadow-[0_0_20px_rgba(224,180,65,0.3)]">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#E0B441] -mt-0.5 -ml-0.5 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#E0B441] -mt-0.5 -mr-0.5 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#E0B441] -mb-0.5 -ml-0.5 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#E0B441] -mb-0.5 -mr-0.5 rounded-br-lg" />
                  <div className="w-full h-0.5 bg-[#E0B441]/90 shadow-[0_0_8px_#E0B441] animate-pulse absolute top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {/* Floating Camera Controls */}
            {scannerActive && (
              <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className={`p-2 rounded-xl backdrop-blur-md transition-all ${
                    torchOn 
                      ? 'bg-[#E0B441] text-black shadow-lg shadow-[#E0B441]/40' 
                      : 'bg-black/60 text-white hover:bg-black/80 border border-white/20'
                  }`}
                  title="Encender Linterna"
                >
                  <Flashlight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={stopScanner}
                  className="px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-[11px] font-bold border border-white/20 backdrop-blur-md"
                >
                  Pausar
                </button>
              </div>
            )}

            {/* Camera error / Fallback trigger */}
            {!scannerActive && (
              <div className="p-6 text-center space-y-3 z-10">
                <AlertCircle className="w-8 h-8 mx-auto text-[#E0B441]" />
                <p className="text-xs text-[#F2EDE4] max-w-sm mx-auto leading-relaxed">
                  {cameraError || 'Iniciando cámara en vivo para lectura de códigos...'}
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <button
                    onClick={() => startCameraWithPermission()}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#C8542A] hover:bg-[#E5724A] rounded-xl transition-all shadow-md active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>▶️ Iniciar Cámara en Vivo</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#E0B441] to-[#C8542A] hover:brightness-110 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>📸 Tomar Foto con Cámara Nativa</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Selector de Cámara y Botón Foto Nativa */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#E0B441] border border-[#E0B441]/30 font-semibold transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>📸 Tomar Foto (Cámara Nativa del Celular)</span>
            </button>

            {cameras.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#8B8378]">Cámara:</span>
                <select
                  value={selectedCameraId}
                  onChange={(e) => startCameraWithPermission(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#12100E] border border-[#2A2521] text-white text-xs focus:outline-none focus:border-[#E0B441]"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label || `Cámara ${c.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Códigos de Ejemplo de la Casa */}
          <div className="p-3 rounded-2xl bg-[#1C1814] border border-[#2A2521] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#8B8378] uppercase tracking-wider">
              <span>Probar Códigos del Hogar (1-Clic):</span>
              <span className="text-[#E0B441]">Sin Cámara</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '🍷 Vino Cava Reserva', code: '7501000555667' },
                { label: '🥩 Ribeye Prime Sonorense', code: '7501000777889' },
                { label: '🌾 Harina Selecta', code: '7501000111223' },
                { label: '🫒 Aceite de Oliva Oleo', code: '7501055301097' },
                { label: '🥛 Leche Entera', code: '7501055300076' },
                { label: '🧀 Parmigiano Reggiano', code: '7501008000011' },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    audio.click();
                    processBarcode(item.code);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold text-[#B8AFA3] bg-[#12100E] hover:bg-[#2A2521] hover:text-white rounded-lg border border-[#2A2521] transition-all"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Formulario de Entrada Manual */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Keyboard className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="O escribe un código de barras (ej. 7501000555667)..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-[#12100E] border border-[#2A2521] text-white placeholder-gray-500 focus:outline-none focus:border-[#E0B441] font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 text-xs font-bold text-white bg-[#C8542A] hover:bg-[#E5724A] rounded-xl transition-all"
            >
              Buscar
            </button>
          </form>

          {/* Resultado del Escaneo con Acciones Multidireccionales */}
          {scannedResult && (
            <div className="p-4 rounded-2xl bg-[#1C1814] border border-[#E0B441]/40 space-y-3 animate-fade-in shadow-xl">
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E0B441]/20 text-[#E0B441] border border-[#E0B441]/30">
                        {scannedResult.barcode}
                      </span>
                      {scannedResult.isExisting ? (
                        <span className="text-[10px] font-bold text-emerald-400 uppercase">
                          ✓ Encontrado en Casa
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-400 uppercase">
                          {scannedResult.product.isWine ? '🍷 Botella Reconocida' : 'Artículo Reconocido'}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-white mt-1">
                      {scannedResult.product.name}
                    </h4>
                    {scannedResult.product.brand && (
                      <p className="text-xs text-[#E0B441] font-semibold">
                        Bodega / Marca: {scannedResult.product.brand}
                      </p>
                    )}
                    <p className="text-xs text-[#B8AFA3] mt-0.5">
                      Destino: <strong className="text-[#E0B441]">{selectedTargetZone || scannedResult.product.zone || 'Alacena'}</strong>
                      {scannedResult.isExisting && (
                        <span> • Existencia: <strong className="text-white font-mono">{scannedResult.product.quantity} {scannedResult.product.unit}</strong></span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones Multidireccionales (Entrada +1, Salida -1, Mandar al Súper) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#2A2521]">
                
                {/* 1. Sumar +1 Entrada */}
                <button
                  onClick={() => {
                    executeDirectAction(scannedResult.product, 'ADD_ENTRY');
                    setScannedResult(null);
                  }}
                  className={`py-2.5 px-3 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    scannedResult.product.isWine || (selectedTargetZone && selectedTargetZone.toLowerCase().includes('cava'))
                      ? 'bg-[#6B1F2E] hover:bg-[#852739] border border-[#E0B441]/40'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>➕ Llegó (+1)</span>
                </button>

                {/* 2. Restar -1 Consumo */}
                {scannedResult.isExisting && (
                  <button
                    onClick={() => {
                      executeDirectAction(scannedResult.product, 'CONSUME_EXIT');
                      setScannedResult(null);
                    }}
                    className="py-2.5 px-3 text-xs font-bold text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/40 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <Minus className="w-4 h-4" />
                    <span>➖ Consumí (-1)</span>
                  </button>
                )}

                {/* 3. Mandar al Súper */}
                <button
                  onClick={() => {
                    executeDirectAction(scannedResult.product, 'RESTOCK_SUPER');
                    setScannedResult(null);
                  }}
                  className="py-2.5 px-3 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>🛒 Falta (Súper)</span>
                </button>
              </div>

              {/* Si es artículo nuevo y se quiere registrar ficha permanente */}
              {!scannedResult.isExisting && (
                <div className="pt-1">
                  <button
                    onClick={() => {
                      audio.click();
                      onOpenManualCaptureWithBarcode({
                        ...scannedResult.product,
                        zone: selectedTargetZone || scannedResult.product.zone || 'Alacena Principal'
                      });
                      onClose();
                    }}
                    className="w-full py-2 px-3 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>➕ Registrar Ficha Completa en {selectedTargetZone || 'Alacena'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
