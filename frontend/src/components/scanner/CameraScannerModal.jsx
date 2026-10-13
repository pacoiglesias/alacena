import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  X, Camera, ScanLine, CheckCircle2, Plus, Minus,
  ShoppingCart, Warehouse, AlertCircle, Sparkles, 
  Keyboard, Image as ImageIcon, RefreshCw, Check, Search, Zap,
  Wine, Edit3, Flashlight, Receipt, FileText, Loader2, ArrowRight
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { lookupBarcode } from '../../services/barcodeLookupService';
import { findProductByScanCode, extractCodeFromScan } from '../../utils/scanHelper';
import { isCavaZone, isAlcoholicOrBeverage, sanitizeCavaProduct } from '../../utils/cavaGuard';
import { extractShoppingListFromImage, preprocessImageForOcr } from '../../services/ocrService';
import { parseRawShoppingText } from '../../services/smartListParser';

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
  // Pestañas principales del Escáner: 'BARCODE' | 'RECEIPT' | 'MANUAL'
  const [activeTab, setActiveTab] = useState('BARCODE');

  // Estado del Escáner de Códigos de Barras
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  
  // Modos de Dirección: 'INTERACTIVE' | 'ADD_ENTRY' | 'CONSUME_EXIT' | 'RESTOCK_SUPER'
  const [scanDirectionMode, setScanDirectionMode] = useState('INTERACTIVE');
  const [selectedTargetZone, setSelectedTargetZone] = useState('');
  const [lastBatchMessage, setLastBatchMessage] = useState(null);
  const [batchCount, setBatchCount] = useState(0);

  // Estado del Escáner de Recibos / Tickets (OCR)
  const [receiptImage, setReceiptImage] = useState(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [extractedReceiptItems, setExtractedReceiptItems] = useState([]);
  const [selectedReceiptItemIds, setSelectedReceiptItemIds] = useState(new Set());
  const [receiptNotice, setReceiptNotice] = useState(null);
  const [receiptStoreName, setReceiptStoreName] = useState('');

  // Refs de hardware y control
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const nativeBarcodeDetectorRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  const fileBarcodeRef = useRef(null);
  const fileReceiptRef = useRef(null);
  const scannerContainerId = 'alacena-qr-barcode-viewport';

  // Inicializar zona destino por defecto
  useEffect(() => {
    if (zones.length > 0 && !selectedTargetZone) {
      const defaultPantry = zones.find(z => z.type === 'DRY_PANTRY') || zones[0];
      setSelectedTargetZone(defaultPantry.name);
    }
  }, [zones, selectedTargetZone]);

  // Manejar apertura y cierre del modal
  useEffect(() => {
    if (!isOpen) {
      stopAllCameras();
      setScannedResult(null);
      setCameraError(null);
      setManualCode('');
      setTorchOn(false);
      setReceiptImage(null);
      setReceiptPreviewUrl(null);
      setExtractedReceiptItems([]);
      return;
    }

    if (activeTab === 'BARCODE') {
      const timer = setTimeout(() => {
        startBarcodeScanner();
      }, 250);
      return () => {
        clearTimeout(timer);
        stopAllCameras();
      };
    } else {
      stopAllCameras();
    }
  }, [isOpen, activeTab]);

  // Detener todas las fuentes de cámara de forma limpia
  const stopAllCameras = async () => {
    // 1. Detener bucle nativo
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    // 2. Detener WebRTC MediaStream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (_) {}
      });
      mediaStreamRef.current = null;
    }

    // 3. Detener Html5Qrcode si estaba activo
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop().catch(() => {});
        }
        try { html5QrCodeRef.current.clear(); } catch (_) {}
      } catch (_) {}
      html5QrCodeRef.current = null;
    }

    setScannerActive(false);
  };

  // Iniciar escáner de códigos de barras (con soporte nativo por hardware + fallback Html5Qrcode)
  const startBarcodeScanner = async (forcedDeviceId = null) => {
    try {
      setCameraError(null);
      await stopAllCameras();

      // 1. Detectar si el navegador cuenta con BarcodeDetector nativo por hardware
      const hasNativeBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

      if (hasNativeBarcodeDetector) {
        try {
          const supported = await window.BarcodeDetector.getSupportedFormats();
          const targetFormats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'].filter(
            f => supported.includes(f)
          );

          if (targetFormats.length > 0) {
            nativeBarcodeDetectorRef.current = new window.BarcodeDetector({ formats: targetFormats });
            
            // Iniciar WebRTC con restricciones móviles seguras (sin min: 1280 que causa crash)
            const constraints = {
              video: {
                facingMode: forcedDeviceId ? undefined : { ideal: 'environment' },
                deviceId: forcedDeviceId ? { exact: forcedDeviceId } : undefined,
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            mediaStreamRef.current = stream;

            // Listar cámaras
            try {
              const devices = await navigator.mediaDevices.enumerateDevices();
              const videoDevices = devices.filter(d => d.kind === 'videoinput');
              setCameras(videoDevices);
            } catch (_) {}

            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              await videoRef.current.play();

              // Intentar autofoco continuo
              try {
                const track = stream.getVideoTracks()[0];
                const capabilities = track.getCapabilities ? track.getCapabilities() : {};
                if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                  track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
                }
              } catch (_) {}

              setScannerActive(true);
              startNativeDetectionLoop();
              return;
            }
          }
        } catch (nativeErr) {
          console.warn('BarcodeDetector nativo no disponible, usando fallback:', nativeErr);
        }
      }

      // 2. FALLBACK ROBUSTO: Html5Qrcode
      const containerEl = document.getElementById(scannerContainerId);
      if (!containerEl) {
        setCameraError('Contenedor visual de cámara no listo.');
        return;
      }
      containerEl.innerHTML = '';

      let availableCameras = [];
      try {
        availableCameras = await Html5Qrcode.getCameras();
        setCameras(availableCameras || []);
      } catch (_) {}

      const formats = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
      ];

      html5QrCodeRef.current = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: formats,
        verbose: false,
      });

      let cameraConfig;
      if (forcedDeviceId) {
        cameraConfig = { deviceId: { exact: forcedDeviceId } };
      } else if (availableCameras.length > 0) {
        const backCam = availableCameras.find(c => {
          const l = (c.label || '').toLowerCase();
          return l.includes('back') || l.includes('trasera') || l.includes('rear') || l.includes('environment');
        });
        if (backCam) {
          setSelectedCameraId(backCam.id);
          cameraConfig = { deviceId: { exact: backCam.id } };
        } else {
          cameraConfig = { facingMode: 'environment' };
        }
      } else {
        cameraConfig = { facingMode: 'environment' };
      }

      await html5QrCodeRef.current.start(
        cameraConfig,
        {
          fps: 24,
          qrbox: (w, h) => {
            const width = Math.min(Math.floor(w * 0.92), 480);
            const height = Math.min(Math.floor(h * 0.65), 280);
            return { width: Math.max(width, 240), height: Math.max(height, 150) };
          },
        },
        onScanSuccess,
        () => {}
      );

      setScannerActive(true);
      setCameraError(null);
    } catch (err) {
      console.warn('Error al iniciar cámara de escáner:', err);
      setCameraError(
        'No se pudo abrir la cámara en vivo. Asegúrate de conceder permisos de cámara o usa el botón "📸 Subir / Tomar Foto".'
      );
      setScannerActive(false);
    }
  };

  // Bucle nativo de detección con BarcodeDetector
  const startNativeDetectionLoop = () => {
    const detect = async () => {
      if (!videoRef.current || !nativeBarcodeDetectorRef.current || !mediaStreamRef.current) return;

      if (videoRef.current.readyState >= 2) {
        try {
          const barcodes = await nativeBarcodeDetectorRef.current.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            if (code) {
              await onScanSuccess(code);
            }
          }
        } catch (_) {}
      }

      animationFrameIdRef.current = requestAnimationFrame(detect);
    };

    animationFrameIdRef.current = requestAnimationFrame(detect);
  };

  // Callback de éxito al detectar código de barra o QR
  const onScanSuccess = async (decodedText) => {
    const now = Date.now();
    if (now - lastScanTimeRef.current < 1200) return;
    lastScanTimeRef.current = now;

    audio.tripleFeedback(880, 35);
    await processBarcode(decodedText);
  };

  // Linterna / Flash
  const handleToggleTorch = async () => {
    try {
      if (mediaStreamRef.current) {
        const track = mediaStreamRef.current.getVideoTracks()[0];
        const newTorch = !torchOn;
        await track.applyConstraints({ advanced: [{ torch: newTorch }] });
        setTorchOn(newTorch);
        audio.click();
      } else if (html5QrCodeRef.current && scannerActive) {
        const newTorch = !torchOn;
        await html5QrCodeRef.current.applyVideoConstraints({ advanced: [{ torch: newTorch }] });
        setTorchOn(newTorch);
        audio.click();
      }
    } catch (e) {
      alert('La linterna no está disponible en esta cámara o navegador.');
    }
  };

  // Alternar entre cámaras disponibles
  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return;
    audio.click();
    const currentIndex = cameras.findIndex(c => c.deviceId === selectedCameraId || c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCam = cameras[nextIndex];
    const id = nextCam.deviceId || nextCam.id;
    setSelectedCameraId(id);
    await startBarcodeScanner(id);
  };

  // Procesar código de barras o QR escaneado
  const processBarcode = async (rawCode) => {
    if (!rawCode) return;
    setIsSearching(true);

    const cavaZone = zones.find(z => z.type === 'WINE_CELLAR') || zones[0];
    const pantryZone = zones.find(z => z.type === 'DRY_PANTRY') || zones[0];

    // 1. Coincidencia en despensa local
    const { product: existingInPantry, cleanCode } = findProductByScanCode(products, rawCode);

    if (existingInPantry) {
      audio.success();
      const assignedZone = selectedTargetZone || existingInPantry.zone || pantryZone.name;
      const targetProd = sanitizeCavaProduct({ ...existingInPantry, zone: assignedZone }, zones);

      if (scanDirectionMode !== 'INTERACTIVE') {
        executeDirectAction(targetProd, scanDirectionMode);
        setIsSearching(false);
        return;
      }

      setScannedResult({
        barcode: cleanCode,
        product: targetProd,
        isExisting: true,
      });
      setIsSearching(false);
      return;
    }

    // 2. Consulta en catálogo comercial Open Food Facts / GS1
    try {
      const lookup = await lookupBarcode(cleanCode);
      audio.success();

      const isWine = Boolean(lookup?.isWine) || isAlcoholicOrBeverage(lookup?.name, lookup?.category);
      let suggestedZone = selectedTargetZone || pantryZone?.name || 'Alacena Principal';

      if (isWine) {
        suggestedZone = cavaZone?.name || 'Cava Principal';
      } else if (isCavaZone(selectedTargetZone, zones)) {
        suggestedZone = pantryZone?.name || 'Alacena Principal';
      }

      const newProd = {
        ...lookup,
        barcode: cleanCode,
        zone: suggestedZone,
        category: lookup?.category || (isWine ? 'Vinos & Licores' : 'Abarrotes'),
        unit: lookup?.unit || (isWine ? 'botellas' : 'piezas'),
        isWine,
        quantity: 1,
      };

      if (scanDirectionMode === 'RESTOCK_SUPER') {
        executeDirectAction(newProd, 'RESTOCK_SUPER');
        setIsSearching(false);
        return;
      }

      if (scanDirectionMode === 'ADD_ENTRY') {
        executeDirectAction(newProd, 'ADD_ENTRY');
        setIsSearching(false);
        return;
      }

      setScannedResult({
        barcode: cleanCode,
        product: newProd,
        isExisting: false,
      });
    } catch (err) {
      console.warn('Error en catálogo comercial:', err);
      const isWine = isAlcoholicOrBeverage(cleanCode, '');
      const fallbackZone = isWine ? (cavaZone?.name || 'Cava Principal') : (pantryZone?.name || 'Alacena Principal');
      setScannedResult({
        barcode: cleanCode,
        product: {
          name: `Código ${cleanCode}`,
          barcode: cleanCode,
          category: isWine ? 'Vinos & Licores' : 'Abarrotes',
          unit: isWine ? 'botellas' : 'piezas',
          quantity: 1,
          zone: fallbackZone,
          isWine,
        },
        isExisting: false,
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Ejecución directa según modo multidireccional
  const executeDirectAction = (targetProduct, actionType) => {
    if (actionType === 'ADD_ENTRY') {
      audio.success();
      if (onAddStockDirect) {
        onAddStockDirect(targetProduct, 1, selectedTargetZone || targetProduct.zone);
      }
      setBatchCount(prev => prev + 1);
      setLastBatchMessage(`➕ +1 "${targetProduct.name}" agregado a ${selectedTargetZone || targetProduct.zone}`);
      setTimeout(() => setLastBatchMessage(null), 3000);
      return;
    }

    if (actionType === 'CONSUME_EXIT') {
      audio.click();
      if (onSubtractStockDirect) {
        onSubtractStockDirect(targetProduct, 1);
      }
      setBatchCount(prev => prev + 1);
      setLastBatchMessage(`➖ -1 "${targetProduct.name}" descontado por consumo`);
      setTimeout(() => setLastBatchMessage(null), 3000);
      return;
    }

    if (actionType === 'RESTOCK_SUPER') {
      audio.superCheck();
      if (onAddToShoppingList) {
        onAddToShoppingList({
          name: targetProduct.name,
          quantity: 1,
          unit: targetProduct.unit || 'piezas',
          department: targetProduct.category || 'Abarrotes',
          store: targetProduct.store || 'Supermercado',
          estimatedPriceMxn: targetProduct.price || targetProduct.unitPriceMxn || 0,
          targetZone: selectedTargetZone || targetProduct.zone || 'Alacena Principal',
          barcode: targetProduct.barcode,
        });
      }
      setBatchCount(prev => prev + 1);
      setLastBatchMessage(`🛒 "${targetProduct.name}" enviado a la Lista del Súper`);
      setTimeout(() => setLastBatchMessage(null), 3000);
      return;
    }
  };

  // Manejo de código manual
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    audio.click();
    await processBarcode(manualCode.trim());
    setManualCode('');
  };

  // Escaneo por archivo de imagen de código de barras
  const handleBarcodeFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      audio.click();
      setIsSearching(true);
      const scanner = new Html5Qrcode('barcode-file-scan-buffer');
      const decoded = await scanner.scanFile(file, false);
      try { scanner.clear(); } catch (_) {}

      if (decoded && decoded.trim()) {
        audio.success();
        await processBarcode(decoded.trim());
      } else {
        throw new Error('No se leyó código');
      }
    } catch (err) {
      alert('No se detectó un código de barras claro en la imagen. Intenta con mejor luz o escribe los dígitos abajo.');
    } finally {
      setIsSearching(false);
      if (fileBarcodeRef.current) fileBarcodeRef.current.value = '';
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // LÓGICA DEL ESCÁNER DE RECIBOS / TICKETS (OCR DE CÁMARA)
  // ════════════════════════════════════════════════════════════════════════════

  // Capturar fotograma en vivo de la cámara para analizar como ticket
  const handleCaptureLiveCameraForReceipt = async () => {
    audio.click();
    try {
      let dataUrl = null;

      if (videoRef.current && videoRef.current.readyState >= 2) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 1280;
        canvas.height = videoRef.current.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      }

      if (dataUrl) {
        setReceiptPreviewUrl(dataUrl);
        setReceiptImage(dataUrl);
        await processReceiptImage(dataUrl);
      } else {
        // Fallback a input de cámara nativa
        fileReceiptRef.current?.click();
      }
    } catch (err) {
      console.warn('Error capturando ticket de cámara:', err);
      fileReceiptRef.current?.click();
    }
  };

  // Carga de foto de ticket desde archivo o cámara nativa
  const handleReceiptFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    audio.click();
    setReceiptImage(file);
    const url = URL.createObjectURL(file);
    setReceiptPreviewUrl(url);
    await processReceiptImage(file);
  };

  // Procesar imagen del ticket con OCR y heurística de compras
  const processReceiptImage = async (imageSource) => {
    setIsOcrProcessing(true);
    setReceiptNotice(null);
    setExtractedReceiptItems([]);

    try {
      const result = await extractShoppingListFromImage(
        imageSource,
        (p) => setOcrProgress(p),
        products
      );

      if (!result.items || result.items.length === 0) {
        setReceiptNotice({
          type: 'warning',
          text: 'No se pudieron extraer líneas claras del ticket. Asegúrate de que la foto tenga buena luz y no tenga reflejos.',
        });
        audio.warning();
      } else {
        setExtractedReceiptItems(result.items);
        setSelectedReceiptItemIds(new Set(result.items.map(i => i.id)));
        setReceiptStoreName(result.items[0]?.store || 'Supermercado');
        setReceiptNotice({
          type: 'success',
          text: `🧾 ¡Ticket procesado con éxito! Se detectaron ${result.items.length} artículos con sus importes reales.`,
        });
        audio.success();
      }
    } catch (err) {
      console.error('Error procesando ticket:', err);
      setReceiptNotice({
        type: 'error',
        text: 'Ocurrió un inconveniente al procesar el ticket. Puedes probar con un ticket de muestra o ingresar los artículos manualmente.',
      });
      audio.warning();
    } finally {
      setIsOcrProcessing(false);
      setOcrProgress(null);
    }
  };

  // Cargar ticket demo de prueba inmediata
  const handleLoadSampleTicket = (store) => {
    audio.click();
    let sampleText = '';

    if (store === 'mercadona') {
      sampleText = `MERCADONA, S.A.
C.I.F. A-46103834
C/ VELAZQUEZ 45, MADRID
FECHA: 12/10/2026 14:32

MERLUZA FRESCA CANTABRICO 1   9,80 €
LECHE ENTERA HACENDADO    6   5,40 €
ACEITE OLIVA VIRGEN EX 1L 1   8,95 €
QUESO MANCHEGO CURADO     1   4,65 €
PAN BARRA ARTESANAL       2   1,50 €
HUEVOS CAMPEROS CLASE L   1   2,85 €
VINO TINTO RIOJA CRIANZA  2  13,50 €

TOTAL (€)                    46,65 €`;
    } else {
      sampleText = `COSTCO WHOLESALE MEXICO
AV. EJERCITO NACIONAL 843, CDMX
12/10/2026 18:22

RIBEYE PRIME SONORENSE    1  $485.00
AGUACATE HASS 1.5 KG      1  $129.00
PECHUGA POLLO ORGANICA 2KG 1  $310.00
PAPEL HIGIENICO REGIO 32P  1  $289.00
ACEITE OLIVA EXTRA 2L     1  $345.00
VINO TINTO RESERVA        2  $580.00
LECHE LALA ENTERA 6PK     1  $165.00

TOTAL MXN                    $2,303.00`;
    }

    const items = parseRawShoppingText(sampleText, products);
    setExtractedReceiptItems(items);
    setSelectedReceiptItemIds(new Set(items.map(i => i.id)));
    setReceiptStoreName(store === 'mercadona' ? 'Mercadona' : 'Costco');
    setReceiptNotice({
      type: 'success',
      text: `🧾 Demo de ${store.toUpperCase()} cargado. Se detectaron ${items.length} artículos con importes reales.`,
    });
    audio.success();
  };

  // Importar artículos del ticket a la Lista de Compras
  const handleImportReceiptToShoppingList = () => {
    const selectedItems = extractedReceiptItems.filter(i => selectedReceiptItemIds.has(i.id));
    if (selectedItems.length === 0) {
      alert('Por favor selecciona al menos un artículo.');
      return;
    }

    selectedItems.forEach(item => {
      if (onAddToShoppingList) {
        onAddToShoppingList({
          name: item.name,
          quantity: item.quantity || 1,
          unit: item.unit || 'piezas',
          department: item.department || 'Abarrotes',
          store: item.store || receiptStoreName || 'Supermercado',
          estimatedPriceMxn: item.realPrice || item.estimatedPriceMxn || 0,
          targetZone: item.targetZone || zones[0]?.name || 'Alacena Principal',
        });
      }
    });

    audio.success();
    alert(`📥 ¡${selectedItems.length} artículos del ticket agregados a tu Lista del Súper!`);
    onClose();
  };

  // Guardar artículos del ticket DIRECTO en la Despensa (Reconciliación de compra realizada)
  const handleImportReceiptDirectToPantry = () => {
    const selectedItems = extractedReceiptItems.filter(i => selectedReceiptItemIds.has(i.id));
    if (selectedItems.length === 0) {
      alert('Por favor selecciona al menos un artículo.');
      return;
    }

    selectedItems.forEach(item => {
      const sanitized = sanitizeCavaProduct(item, zones);
      if (onAddStockDirect) {
        onAddStockDirect(sanitized, item.quantity || 1, item.targetZone);
      }
    });

    audio.success();
    alert(`✅ ¡${selectedItems.length} artículos ingresados directamente a la Despensa con los precios de tu ticket!`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[96vh] rounded-3xl bg-[#12100E] border border-[#E0B441]/35 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Superior Limpio */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#2A2521] bg-[#1A1613]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#10B981]/20 to-[#E0B441]/20 border border-[#10B981]/40 text-[#10B981]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                Escáner Inteligente ALACENA
              </h3>
              <p className="text-[11px] text-[#A89F91]">
                Códigos de barra EAN/UPC · Códigos QR · Tickets de compra OCR
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Modo: Códigos de Barra vs Tickets vs Manual */}
        <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 bg-[#161310] border-b border-[#2A2521]">
          <button
            type="button"
            onClick={() => {
              audio.click();
              setActiveTab('BARCODE');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'BARCODE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'bg-[#1C1814] text-[#A89F91] hover:text-white hover:bg-white/5'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            <span>📦 Código de Barras / QR</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audio.click();
              setActiveTab('RECEIPT');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'RECEIPT'
                ? 'bg-[#C8542A] text-white shadow-md shadow-[#C8542A]/40'
                : 'bg-[#1C1814] text-[#A89F91] hover:text-white hover:bg-white/5'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>🧾 Ticket de Compra (OCR)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audio.click();
              setActiveTab('MANUAL');
            }}
            className={`flex-initial flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'MANUAL'
                ? 'bg-[#E0B441] text-[#12100E] shadow-md shadow-[#E0B441]/30 font-black'
                : 'bg-[#1C1814] text-[#A89F91] hover:text-white hover:bg-white/5'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span className="hidden sm:inline">⌨️ Manual</span>
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">

          {/* ═════════════════════════════════════════════════════════════════
              PESTAÑA 1: CÓDIGO DE BARRAS & QR (CÁMARA FLUIDA)
             ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'BARCODE' && (
            <div className="space-y-4">
              
              {/* Selector de Dirección Inmediata */}
              <div className="p-3 rounded-2xl bg-[#1A1613] border border-[#2A2521] space-y-1.5">
                <span className="text-[10px] font-extrabold text-[#E0B441] uppercase tracking-wider block">
                  ¿Qué hacer al detectar el código?
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'INTERACTIVE', label: 'Consultar / Preguntar', icon: Search, color: 'text-amber-300' },
                    { id: 'ADD_ENTRY', label: '➕ +1 Entrada Despensa', icon: Plus, color: 'text-emerald-400' },
                    { id: 'CONSUME_EXIT', label: '➖ -1 Salida Consumo', icon: Minus, color: 'text-rose-400' },
                    { id: 'RESTOCK_SUPER', label: '🛒 Mandar al Súper', icon: ShoppingCart, color: 'text-orange-400' },
                  ].map((mode) => {
                    const isSelected = scanDirectionMode === mode.id;
                    const IconComp = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          audio.click();
                          setScanDirectionMode(mode.id);
                        }}
                        className={`flex items-center gap-1.5 p-2 rounded-xl text-[11px] font-bold transition-all text-left ${
                          isSelected
                            ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 shadow-sm'
                            : 'bg-[#12100E] border border-[#2A2521] text-[#A89F91] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <IconComp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : mode.color}`} />
                        <span className="truncate">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mensaje de Confirmación Rápida */}
              {lastBatchMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between animate-fade-in shadow-md">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{lastBatchMessage}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 font-mono">
                    {batchCount} ítems
                  </span>
                </div>
              )}

              {/* Visor de Cámara HD */}
              <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-[#2A2521] min-h-[300px] sm:min-h-[360px] flex items-center justify-center">
                
                {/* Elemento de Video WebRTC Nativo */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover min-h-[300px] sm:min-h-[360px] ${scannerActive && videoRef.current?.srcObject ? 'block' : 'hidden'}`}
                />

                {/* Contenedor Fallback Html5Qrcode */}
                <div
                  id={scannerContainerId}
                  className={`w-full ${scannerActive && !videoRef.current?.srcObject ? 'block' : 'hidden'}`}
                />

                {/* Retícula de Enfoque con Láser Central */}
                {scannerActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[88%] max-w-[420px] h-[160px] sm:h-[180px] border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_24px_rgba(16,185,129,0.3)] flex items-center justify-center">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br-lg" />
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10B981] animate-pulse" />
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-300 bg-black/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40 absolute bottom-2">
                        Centra el código de barras
                      </span>
                    </div>
                  </div>
                )}

                {/* Controles Flotantes en Cámara */}
                {scannerActive && (
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                    {cameras.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSwitchCamera}
                        className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all"
                        title="Cambiar Cámara"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleToggleTorch}
                      className={`p-2 rounded-xl backdrop-blur-md transition-all ${
                        torchOn ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/40' : 'bg-black/60 text-white hover:bg-black/80 border border-white/20'
                      }`}
                      title="Linterna / Flash"
                    >
                      <Flashlight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Estado de Error o Cámara Pausada */}
                {!scannerActive && (
                  <div className="p-6 text-center space-y-3 z-10">
                    <AlertCircle className="w-9 h-9 mx-auto text-[#E0B441]" />
                    <p className="text-xs text-[#A89F91] max-w-sm mx-auto">
                      {cameraError || 'La cámara no está activa en este momento.'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => startBarcodeScanner()}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all"
                      >
                        🔄 Reintentar Cámara
                      </button>
                      <button
                        type="button"
                        onClick={() => fileBarcodeRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-all"
                      >
                        📁 Cargar Foto de Código
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón Alternativo de Subida por Foto */}
              <input
                type="file"
                ref={fileBarcodeRef}
                accept="image/*"
                onChange={handleBarcodeFileUpload}
                className="hidden"
              />
              <div className="flex items-center justify-between text-xs text-[#A89F91] px-1">
                <span>¿Problemas de enfoque con el sensor?</span>
                <button
                  type="button"
                  onClick={() => fileBarcodeRef.current?.click()}
                  className="text-[#E0B441] hover:underline font-semibold flex items-center gap-1"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Tomar Foto con Cámara Nativa</span>
                </button>
              </div>

              {/* Tarjeta del Producto Detectado (Modo Interactivo) */}
              {scannedResult && (
                <div className="p-4 rounded-2xl bg-[#1C1814] border border-[#E0B441]/40 space-y-3 animate-fade-in shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        scannedResult.isExisting ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {scannedResult.isExisting ? '✓ En tu Despensa' : '✨ Nuevo Producto'}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1">
                        {scannedResult.product.name}
                      </h4>
                      <p className="text-xs text-[#A89F91]">
                        Código: <span className="font-mono text-white">{scannedResult.barcode}</span> • {scannedResult.product.category}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setScannedResult(null)}
                      className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Acciones para el Producto */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        executeDirectAction(scannedResult.product, 'ADD_ENTRY');
                        setScannedResult(null);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+1 Entrada</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        executeDirectAction(scannedResult.product, 'CONSUME_EXIT');
                        setScannedResult(null);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>-1 Salida</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        executeDirectAction(scannedResult.product, 'RESTOCK_SUPER');
                        setScannedResult(null);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md transition-all"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Al Súper</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              PESTAÑA 2: LECTOR DE TICKETS Y RECIBOS DE COMPRA (OCR)
             ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'RECEIPT' && (
            <div className="space-y-4">
              
              <input
                type="file"
                ref={fileReceiptRef}
                accept="image/*"
                capture="environment"
                onChange={handleReceiptFileSelected}
                className="hidden"
              />

              {/* Botones de Captura del Ticket */}
              <div className="p-4 rounded-2xl bg-[#1A1613] border border-[#2A2521] space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCaptureLiveCameraForReceipt}
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#C8542A] to-[#E5724A] text-white font-bold text-xs sm:text-sm hover:brightness-110 shadow-lg shadow-[#C8542A]/30 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>📸 Tomar Foto al Ticket Ahora</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileReceiptRef.current?.click()}
                    className="w-full sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm border border-white/10 transition-all"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Cargar de Galería</span>
                  </button>
                </div>

                {/* Pruebas 1-Clic de tickets reales */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-[11px]">
                  <span className="text-[#A89F91]">Probar tickets muestra:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleLoadSampleTicket('mercadona')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-semibold border border-emerald-500/30 transition-all"
                    >
                      🇪🇸 Mercadona (€)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSampleTicket('costco')}
                      className="px-2.5 py-1 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 font-semibold border border-orange-500/30 transition-all"
                    >
                      🇲🇽 Costco ($ MXN)
                    </button>
                  </div>
                </div>
              </div>

              {/* Progreso de OCR */}
              {isOcrProcessing && (
                <div className="p-4 rounded-2xl bg-[#1C1814] border border-[#E0B441]/40 space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#E0B441]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{ocrProgress?.status || 'Leyendo ticket con visión artificial OCR...'}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#C8542A] to-[#E0B441] transition-all duration-300"
                      style={{ width: `${ocrProgress?.progress || 35}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Notificación de resultado */}
              {receiptNotice && (
                <div className={`p-3.5 rounded-2xl flex items-center justify-between text-xs border animate-fade-in ${
                  receiptNotice.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' :
                  receiptNotice.type === 'warning' ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' :
                  'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}>
                  <span className="flex items-center gap-2">
                    {receiptNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{receiptNotice.text}</span>
                  </span>
                  <button onClick={() => setReceiptNotice(null)} className="text-white/60 hover:text-white ml-2">✕</button>
                </div>
              )}

              {/* Lista de Partidas Detectadas en el Ticket */}
              {extractedReceiptItems.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#161310] border border-[#2A2521] space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div>
                      <span className="text-xs font-extrabold text-white">
                        🧾 Artículos Detectados ({selectedReceiptItemIds.size} de {extractedReceiptItems.length})
                      </span>
                      <span className="text-[11px] text-[#A89F91] block">
                        Tienda: <strong className="text-[#E0B441]">{receiptStoreName}</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedReceiptItemIds.size === extractedReceiptItems.length) {
                          setSelectedReceiptItemIds(new Set());
                        } else {
                          setSelectedReceiptItemIds(new Set(extractedReceiptItems.map(i => i.id)));
                        }
                      }}
                      className="text-xs text-[#E0B441] hover:underline font-semibold"
                    >
                      {selectedReceiptItemIds.size === extractedReceiptItems.length ? 'Desmarcar todos' : 'Marcar todos'}
                    </button>
                  </div>

                  {/* Tabla / Tarjetas de Artículos */}
                  <div className="max-h-56 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                    {extractedReceiptItems.map((item) => {
                      const isSelected = selectedReceiptItemIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                            isSelected
                              ? 'bg-white/5 border-emerald-500/30 text-white'
                              : 'bg-black/20 border-white/5 text-[#888] opacity-60'
                          }`}
                        >
                          <label className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const next = new Set(selectedReceiptItemIds);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                setSelectedReceiptItemIds(next);
                              }}
                              className="rounded text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-white block truncate">{item.name}</span>
                              <span className="text-[10px] text-[#A89F91]">
                                {item.quantity} {item.unit} • {item.department}
                              </span>
                            </div>
                          </label>

                          <div className="text-right shrink-0 ml-2">
                            <span className="font-mono font-bold text-emerald-400 block">
                              ${(item.realPrice || item.estimatedPriceMxn || 0).toFixed(2)}
                            </span>
                            <span className="text-[9px] text-[#A89F91]">Ticket</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Botones de Destino del Ticket */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={handleImportReceiptToShoppingList}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md transition-all"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>📥 Meter a Lista del Súper</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleImportReceiptDirectToPantry}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all"
                    >
                      <Warehouse className="w-4 h-4" />
                      <span>✅ Ya los Compré: Guardar en Despensa</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              PESTAÑA 3: INGRESO MANUAL DE CÓDIGOS DE BARRA O ID
             ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'MANUAL' && (
            <form onSubmit={handleManualSubmit} className="p-4 rounded-2xl bg-[#1A1613] border border-[#2A2521] space-y-4">
              <div>
                <label className="text-xs font-extrabold text-[#E0B441] block mb-1">
                  Escribe los dígitos del código de barras o clave corta:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Ej. 7501055300076 o ALC-4B7"
                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-[#12100E] border border-[#2A2521] text-white font-mono text-sm focus:outline-none focus:border-[#E0B441]"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#E0B441] text-[#12100E] font-bold hover:brightness-110"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-[#A89F91] space-y-1">
                <p>💡 <strong>Tip del Comprador:</strong> Puedes escribir el código de barras impreso en cualquier envase de supermercado para consultar su catálogo o sumarlo a tu inventario.</p>
              </div>
            </form>
          )}

        </div>

        {/* Buffer oculto para scanFile */}
        <div id="barcode-file-scan-buffer" className="hidden" />
      </div>
    </div>
  );
}
