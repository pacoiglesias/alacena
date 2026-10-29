import React, { useState, useEffect, useRef, useMemo } from 'react';
import { decodeVideoFrame, decodeImageFile, hasNativeDetector } from '../../utils/barcodeDecode';
import { diagLog, diagSessionStart } from '../../utils/scannerDiag';
import { 
  X, Camera, ScanLine, CheckCircle2, Plus, Minus,
  ShoppingCart, Warehouse, AlertCircle, Sparkles, 
  Keyboard, Image as ImageIcon, RefreshCw, Check, Search, Zap,
  Wine, Edit3, Flashlight, Receipt, FileText, Loader2, ArrowRight,
  TrendingDown, TrendingUp, Award, DollarSign
} from 'lucide-react';
import TicketReview from '../shopping/TicketReview';
import { audio } from '../../services/audioService';
import { lookupBarcode } from '../../services/barcodeLookupService';
import { findProductByScanCode, extractCodeFromScan, cameraErrorMessage, isScannerVideoFlowing, isScannerStreamingVideo, isBlackBudgetExceeded, SCANNER_BLACK_BUDGET_MS } from '../../utils/scanHelper';
import { isCavaZone, isAlcoholicOrBeverage, sanitizeCavaProduct } from '../../utils/cavaGuard';
import { extractShoppingListFromImage, preprocessImageForOcr, extractTextFromFile } from '../../services/ocrService';
import { parseRawShoppingText } from '../../services/smartListParser';
import { analyzeTicketPriceIntelligence, recordPricePoints } from '../../services/priceIntelligenceService';
import { notify } from '../../services/notice';

export default function CameraScannerModal({ 
  isOpen, 
  onClose, 
  products = [], 
  zones = [], 
  onAddStockDirect, 
  onBatchAddToInventory,
  onConfirmReceipt,
  shoppingList = [],
  currency = 'MXN',
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
  // 3.9.4: la cámara nunca se queda en negro en silencio. Mientras el
  // escáner está activo pero sin flujo real, se muestra "Conectando
  // imagen…" sobre el marco; si el negro dura más que el presupuesto,
  // aparece el error con Reintentar y Foto.
  const [videoFlowing, setVideoFlowing] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [actionQuantity, setActionQuantity] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  
  // Modos de Dirección: 'INTERACTIVE' | 'ADD_ENTRY' | 'CONSUME_EXIT' | 'RESTOCK_SUPER'
  // El último modo elegido se recuerda en localStorage: el escáner ya no
  // exige volver a elegirlo en cada artículo. INTERACTIVE solo la primera vez.
  const SCAN_DIRECTION_MODES = ['INTERACTIVE', 'ADD_ENTRY', 'CONSUME_EXIT', 'RESTOCK_SUPER'];
  const [scanDirectionMode, setScanDirectionMode] = useState(() => {
    try {
      const saved = localStorage.getItem('alacena:scan_direction');
      return SCAN_DIRECTION_MODES.includes(saved) ? saved : 'INTERACTIVE';
    } catch {
      return 'INTERACTIVE';
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('alacena:scan_direction', scanDirectionMode);
    } catch {
      // Sin almacenamiento local: el modo solo vive en esta sesión.
    }
  }, [scanDirectionMode]);
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
  const [receiptRawText, setReceiptRawText] = useState('');

  // Refs de hardware y control
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const cameraSessionRef = useRef(0);
  const startingRef = useRef(false);
  const scanCallbackRef = useRef(null);
  const processingRef = useRef(false);
  const armedRef = useRef(true);
  const requestRef = useRef(0);
  // 3.9.5: la app es dueña de su video. Nada de librerías que creen su
  // propio <video>: el elemento es videoRef, visible en el visor, y el
  // stream se abre con getUserMedia directo. El bucle de decodificación
  // (BarcodeDetector nativo o ZXing) corre sobre ese mismo video.
  const decodeLoopRef = useRef(null);
  const decodeCanvasRef = useRef(null);
  const decodeBusyRef = useRef(false);
  const decodeEngineRef = useRef(null);
  const firstFrameAtRef = useRef(null);
  const cameraStartAtRef = useRef(null);
  const sessionDiagLoggedRef = useRef(false);

  // Espejos de estado para el vigilante y el retorno de segundo plano.
  const isOpenRef = useRef(isOpen);
  const activeTabRef = useRef(activeTab);
  const scannerActiveRef = useRef(false);
  const cameraStartingRef = useRef(false);
  const cameraErrorRef = useRef(null);
  const wasActiveBeforeHiddenRef = useRef(false);
  // Reintentos automáticos acotados: si un arranque muere SIN error
  // (carrera de sesión, aviso del sistema), el vigilante lo reintenta
  // solo unas veces; con error real no se insiste (lo decide el usuario
  // con "Reintentar").
  const autoAttemptsRef = useRef(0);
  const MAX_AUTO_ATTEMPTS = 3;
  // Vigilante anti-video-negro (3.9.1): recuperaciones ya intentadas
  // porque el escáner quedó "activo" sin fotogramas. Se resetea al abrir
  // el modal y al reintentar a mano.
  const blackRecoveriesRef = useRef(0);
  const MAX_BLACK_RECOVERIES = 3;
  // 3.9.4: desde cuándo el escáner activo lleva sin un solo fotograma.
  // Se fija al arrancar con éxito y se limpia al primer flujo real; si
  // supera el presupuesto, error aunque quede presupuesto de reinicio.
  const blackSinceRef = useRef(null);
  const videoFlowingRef = useRef(false);
  // 3.9.4: si el arranque tardó más de 15 s (aviso de permiso sin
  // contestar, cámara colgada), el arranque que resuelva después ya no
  // debe borrar el error ni activar un escáner a destiempo.
  const startTimedOutRef = useRef(false);
  useEffect(() => {
    isOpenRef.current = isOpen;
    activeTabRef.current = activeTab;
    scannerActiveRef.current = scannerActive;
    cameraStartingRef.current = cameraStarting;
    cameraErrorRef.current = cameraError;
  });

  const fileBarcodeRef = useRef(null);
  const fileReceiptCameraRef = useRef(null);
  const fileReceiptUploadRef = useRef(null);

  // Inicializar zona destino por defecto
  useEffect(() => {
    if (zones.length > 0 && !selectedTargetZone) {
      const defaultPantry = zones.find(z => z.type === 'DRY_PANTRY') || zones[0];
      setSelectedTargetZone(defaultPantry.name);
    }
  }, [zones, selectedTargetZone]);

  // Manejar apertura y cierre del modal
  useEffect(() => {
    requestRef.current++;
    if (!isOpen) {
      stopAllCameras();
      sessionDiagLoggedRef.current = false;
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
      // Iniciar de inmediato (sin retardo): en iOS el retardo rompe la cadena del gesto
      // y causa que la cámara se apague. El contenedor ya existe porque el modal está montado.
      autoAttemptsRef.current = 0;
      blackRecoveriesRef.current = 0;
      startBarcodeScanner();
      return () => {
        requestRef.current++;
        stopAllCameras();
      };
    } else {
      stopAllCameras();
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    // Antes, cualquier "hidden" (aviso del sistema, permiso de cámara,
    // cambio de app) MATABA la sesión para siempre y dejaba la pantalla
    // en negro sin error: esa es la "cámara que se apaga sola". Ahora
    // al ocultarse solo se recuerda si estaba activa y al volver se
    // reintenta si hace falta; nunca se destruye la sesión por ocultarse.
    const onVisibility = () => {
      if (document.hidden) {
        wasActiveBeforeHiddenRef.current = scannerActiveRef.current;
        return;
      }
      if (wasActiveBeforeHiddenRef.current && isOpenRef.current && activeTabRef.current === 'BARCODE'
        && !scannerActiveRef.current && !cameraStartingRef.current && !cameraErrorRef.current) {
        wasActiveBeforeHiddenRef.current = false;
        startBarcodeScanner();
      }
    };
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('visibilitychange', onVisibility); document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  // Vigilante: si la cámara quedó inactiva SIN error (arranque abortado
  // por una carrera de sesión, aviso del sistema, pista detenida por el
  // SO), reintenta solo hasta 3 veces en vez de dejar la pantalla negra.
  // Con error real (permiso denegado, sin cámara) no se insiste: el
  // usuario decide con "Reintentar".
  useEffect(() => {
    if (!isOpen || activeTab !== 'BARCODE' || scannerActive || cameraStarting || cameraError) return undefined;
    if (autoAttemptsRef.current >= MAX_AUTO_ATTEMPTS) return undefined;
    const t = setTimeout(() => {
      if (isOpenRef.current && activeTabRef.current === 'BARCODE'
        && !scannerActiveRef.current && !cameraStartingRef.current && !cameraErrorRef.current
        && autoAttemptsRef.current < MAX_AUTO_ATTEMPTS && !startingRef.current) {
        autoAttemptsRef.current += 1;
        startBarcodeScanner();
      }
    }, 800);
    return () => clearTimeout(t);
  }, [isOpen, activeTab, scannerActive, cameraStarting, cameraError]);

  // Vigilante anti-video-negro PERSISTENTE (3.9.4, adaptado 3.9.5 al
  // video propio): sano = flujo real del video CON STREAM. Mientras
  // la pestaña BARCODE esté abierta y el escáner activo, el intervalo
  // sigue vigilando siempre. Sin flujo ~5 s, reinicia el escáner con
  // una pausa de 300 ms para que iOS libere la pista antes de
  // reabrirla, hasta 3 veces por sesión de modal. Y presupuesto total
  // de negro: si el escáner activo lleva más de 12 s sin un solo
  // fotograma, error inmediato con Reintentar y Foto aunque quede
  // presupuesto de reinicio. Un flujo sostenido (~3,5 s) rearma el
  // presupuesto: un paro tardío es un incidente nuevo, no el mismo
  // bucle. Cada transición queda en el log de diagnóstico.
  useEffect(() => {
    if (!isOpen || activeTab !== 'BARCODE' || !scannerActive) return undefined;
    let prevCurrentTime = null;
    let stallMs = 0;
    let flowingStreak = 0;
    const id = setInterval(() => {
      if (!isOpenRef.current || activeTabRef.current !== 'BARCODE' || !scannerActiveRef.current) { clearInterval(id); return; }
      const v = videoRef.current;
      const hasStream = isScannerStreamingVideo(v);
      const flowing = hasStream && prevCurrentTime !== null && isScannerVideoFlowing(prevCurrentTime, v);
      if (v && hasStream) prevCurrentTime = v.currentTime;
      if (flowing) {
        stallMs = 0;
        blackSinceRef.current = null;
        if (!videoFlowingRef.current) {
          videoFlowingRef.current = true; setVideoFlowing(true);
          if (!firstFrameAtRef.current && cameraStartAtRef.current) {
            firstFrameAtRef.current = Date.now();
            diagLog('first_frame', { ms: firstFrameAtRef.current - cameraStartAtRef.current, width: v.videoWidth, height: v.videoHeight });
          }
        }
        flowingStreak += 1;
        if (flowingStreak >= 5) {
          blackRecoveriesRef.current = 0;
          flowingStreak = 0;
        }
        return;
      }
      if (videoFlowingRef.current) { videoFlowingRef.current = false; setVideoFlowing(false); }
      flowingStreak = 0;
      // Presupuesto total de negro: error ya, sin esperar a agotar
      // los reinicios. blackSince se fija al arrancar con éxito.
      if (blackSinceRef.current !== null && isBlackBudgetExceeded(blackSinceRef.current, Date.now())) {
        if (!cameraErrorRef.current) {
          diagLog('black_budget', { ms: Date.now() - blackSinceRef.current, hasStream });
          setCameraError('La cámara arrancó pero no muestra imagen. Toca Reintentar o usa Tomar Foto con Cámara Nativa.');
          setScannerActive(false);
        }
        clearInterval(id);
        return;
      }
      // Sin muestra anterior con la que comparar: esperar al siguiente tick.
      if (hasStream && prevCurrentTime === null) return;
      stallMs += 700;
      if (stallMs >= 5000) {
        stallMs = 0;
        if (blackRecoveriesRef.current < MAX_BLACK_RECOVERIES && !startingRef.current) {
          blackRecoveriesRef.current += 1;
          prevCurrentTime = null;
          diagLog('restart', { reason: 'stall', attempt: blackRecoveriesRef.current, hasStream });
          // Pausa para que iOS libere la pista antes de reabrirla: un
          // reinicio inmediato sobre la pista anterior a veces deja el
          // video nuevo en negro aunque la cámara esté bien.
          setTimeout(() => { if (isOpenRef.current && scannerActiveRef.current) startBarcodeScanner(); }, 300);
        } else if (!cameraErrorRef.current) {
          diagLog('black_budget', { ms: Date.now() - (blackSinceRef.current || Date.now()), hasStream, recoveries: blackRecoveriesRef.current });
          setCameraError('La cámara arrancó pero no muestra imagen. Toca Reintentar o usa Tomar Foto con Cámara Nativa.');
          setScannerActive(false);
        }
      }
    }, 700);
    return () => clearInterval(id);
  }, [isOpen, activeTab, scannerActive]);

  // 3.9.4: arranque colgado. Si la cámara lleva más de 15 s
  // "abriendo" (aviso de permiso sin contestar, cámara ocupada por el
  // sistema), no se deja la pantalla en negro sin explicación: error
  // con el consejo de revisar el permiso y Reintentar.
  useEffect(() => {
    if (!isOpen || activeTab !== 'BARCODE' || !cameraStarting) return undefined;
    startTimedOutRef.current = false;
    const t = setTimeout(() => {
      if (isOpenRef.current && activeTabRef.current === 'BARCODE'
        && cameraStartingRef.current && !scannerActiveRef.current && !cameraErrorRef.current) {
        startTimedOutRef.current = true;
        setCameraError('La cámara tardó demasiado en abrir. Si no viste el aviso de permiso, revisa el permiso de cámara del navegador y toca Reintentar.');
        setScannerActive(false);
      }
    }, 15000);
    return () => clearTimeout(t);
  }, [isOpen, activeTab, cameraStarting]);

  const stopAllCameras = async () => {
    cameraSessionRef.current++;
    blackSinceRef.current = null;
    videoFlowingRef.current = false;
    firstFrameAtRef.current = null;
    if (decodeLoopRef.current) { clearInterval(decodeLoopRef.current); decodeLoopRef.current = null; }
    decodeBusyRef.current = false;
    const stream = mediaStreamRef.current;
    mediaStreamRef.current = null;
    if (stream) {
      try { stream.getTracks().forEach((t) => t.stop()); } catch { /* Tracks already stopped. */ }
    }
    const v = videoRef.current;
    if (v) { try { v.pause(); } catch { /* Not playing. */ } v.removeAttribute('src'); v.srcObject = null; }
    setScannerActive(false); setTorchOn(false); setTorchSupported(false);
  };

  // 3.9.5: apertura de cámara NATIVA. La app abre la cámara ella misma
  // con getUserMedia y su propio <video> visible: ninguna librería crea
  // ni sustituye el elemento de video (eso era lo que se quedaba en
  // negro en el iPhone real). La decodificación corre en bucle sobre
  // ese mismo video (BarcodeDetector nativo o ZXing; ver barcodeDecode).
  // Cada paso queda en el log de diagnóstico (ver scannerDiag).
  const startBarcodeScanner = async (forcedDeviceId = null) => {
    if (startingRef.current) return;
    startingRef.current = true; setCameraStarting(true); setCameraError(null);
    if (!sessionDiagLoggedRef.current) { diagSessionStart(); sessionDiagLoggedRef.current = true; }
    cameraStartAtRef.current = Date.now();
    firstFrameAtRef.current = null;
    decodeEngineRef.current = hasNativeDetector() ? 'native' : 'zxing';
    await stopAllCameras();
    const session = cameraSessionRef.current;
    let stream = null;
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('CameraUnavailable');
      // Estado del permiso (si el navegador lo expone): solo informativo.
      try {
        const perm = await navigator.permissions?.query({ name: 'camera' });
        if (perm) diagLog('permission', { state: perm.state });
      } catch { /* Permissions API no disponible: se sigue igual. */ }
      diagLog('camera_start', { forcedDevice: Boolean(forcedDeviceId), engine: decodeEngineRef.current });
      const wanted = forcedDeviceId
        ? { deviceId: { exact: forcedDeviceId } }
        : { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } };
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: wanted, audio: false });
      } catch (error) {
        if (forcedDeviceId || /NotAllowed|Permission|denied/i.test(error?.name || String(error))) throw error;
        // Equipos sin cámara trasera (o que rechazan environment) usan la frontal.
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      }
      if (session !== cameraSessionRef.current) {
        try { stream.getTracks().forEach((t) => t.stop()); } catch { /* Stale session. */ }
        return;
      }
      const video = videoRef.current;
      if (!video) {
        try { stream.getTracks().forEach((t) => t.stop()); } catch { /* No video element. */ }
        return;
      }
      mediaStreamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      diagLog('gum_ok', {
        tracks: stream.getTracks().map((t) => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState, muted: t.muted })),
        settings: track ? { width: track.getSettings().width, height: track.getSettings().height, deviceId: Boolean(track.getSettings().deviceId) } : null,
      });
      video.muted = true;
      video.setAttribute('muted', 'true');
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.playsInline = true;
      video.srcObject = stream;
      try {
        await video.play();
        diagLog('play_ok', { paused: video.paused, readyState: video.readyState });
      } catch (playErr) {
        diagLog('play_error', { name: playErr?.name, message: String(playErr?.message || playErr).slice(0, 200) });
        // Un reintento tras un tick: en iOS el primer play() a veces se
        // rechaza por el aviso del sistema y el segundo sí entra.
        await new Promise((r) => setTimeout(r, 0));
        try { await video.play(); diagLog('play_retry_ok', { paused: video.paused }); }
        catch (retryErr) { diagLog('play_retry_error', { name: retryErr?.name, message: String(retryErr?.message || retryErr).slice(0, 200) }); }
      }
      // 3.9.4: si el arranque ya caducó (aviso de permiso tardío), no
      // activar un escáner a destiempo ni borrar el error que ya se
      // mostró: se detiene y se deja el error con Reintentar.
      if (startTimedOutRef.current) {
        await stopAllCameras();
        setScannerActive(false);
        return;
      }
      setScannerActive(true);
      // 3.9.4: empieza el presupuesto de negro: si en 12 s no hay un
      // solo fotograma real, error aunque queden reinicios.
      blackSinceRef.current = Date.now();
      videoFlowingRef.current = false;
      setVideoFlowing(false);
      autoAttemptsRef.current = 0;
      if (track) {
        const settings = track.getSettings();
        setSelectedCameraId(settings.deviceId || forcedDeviceId || '');
        let capabilities = {};
        try { capabilities = track.getCapabilities?.() || {}; } catch { /* Capabilities no disponibles. */ }
        setTorchSupported(capabilities.torch === true);
        if (capabilities.focusMode?.includes('continuous')) {
          try { await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }); } catch { /* Optional capability. */ }
        }
      }
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setCameras(devices.filter((d) => d.kind === 'videoinput').map((d) => ({ id: d.deviceId, deviceId: d.deviceId, label: d.label })));
      } catch { /* Scanning still works without enumeration. */ }
      // Bucle de decodificación sobre el video propio (300 ms por
      // fotograma; se salta el tick si el anterior sigue decodificando).
      if (!decodeCanvasRef.current) decodeCanvasRef.current = document.createElement('canvas');
      const canvas = decodeCanvasRef.current;
      diagLog('decode_start', { engine: decodeEngineRef.current });
      decodeLoopRef.current = setInterval(async () => {
        if (!isOpenRef.current || activeTabRef.current !== 'BARCODE' || !scannerActiveRef.current || decodeBusyRef.current) return;
        const v = videoRef.current;
        if (!v) return;
        decodeBusyRef.current = true;
        try {
          const found = await decodeVideoFrame(v, canvas);
          if (found && armedRef.current) {
            diagLog('decode_ok', { engine: found.engine });
            scanCallbackRef.current?.(found.text);
          }
        } catch (err) {
          diagLog('decode_error', { name: err?.name, message: String(err?.message || err).slice(0, 200), engineFallback: Boolean(err?.engineFallback) });
          if (err?.engineFallback) decodeEngineRef.current = 'zxing';
        } finally {
          decodeBusyRef.current = false;
        }
      }, 300);
    } catch (error) {
      if (session === cameraSessionRef.current) {
        diagLog('camera_start_error', { name: error?.name, message: String(error?.message || error).slice(0, 200) });
        setCameraError(cameraErrorMessage(error)); setScannerActive(false);
      }
      if (stream) { try { stream.getTracks().forEach((t) => t.stop()); } catch { /* Cleanup. */ } }
    } finally { startingRef.current = false; setCameraStarting(false); }
  };

  const onScanSuccess = async (code) => {
    if (!armedRef.current || processingRef.current) return;
    armedRef.current = false; setScanLocked(true);
    audio.tripleFeedback(880, 35);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([40, 60, 40]); } catch (_) {}
    }
    await processBarcode(code);
  };

  const scanNext = () => {
    armedRef.current = true; setScanLocked(false); setScannedResult(null);
    setLastBatchMessage(null); setActionQuantity(1);
  };

  const handleToggleTorch = async () => {
    try {
      const track = mediaStreamRef.current?.getVideoTracks?.()[0];
      if (!track) throw new Error('Sin pista de video');
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(!torchOn);
      diagLog('torch', { on: !torchOn });
    } catch (err) {
      diagLog('torch_error', { name: err?.name, message: String(err?.message || err).slice(0, 200) });
      notify('No pudimos activar la linterna en este dispositivo.');
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
    diagLog('camera_switch', { to: nextCam.label ? 'con etiqueta' : 'sin etiqueta' });
    await startBarcodeScanner(id);
  };

  // Procesar código de barras o QR escaneado
  const processBarcode = async (rawCode) => {
    if (!rawCode || processingRef.current) return;
    processingRef.current = true;
    armedRef.current = false; setScanLocked(true);
    const request = ++requestRef.current;
    setIsSearching(true);

    const cavaZone = zones.find(z => z.type === 'WINE_CELLAR') || zones[0];
    const pantryZone = zones.find(z => z.type === 'DRY_PANTRY') || zones[0];

    // 1. Coincidencia en despensa local
    const { product: existingInPantry, cleanCode } = findProductByScanCode(products, rawCode);

    if (!cleanCode) { setCameraError('Este QR no contiene un código de producto válido.'); setIsSearching(false); processingRef.current = false; return; }
    if (existingInPantry) {
      audio.success();
      const assignedZone = existingInPantry.zone || selectedTargetZone || pantryZone?.name || 'Alacena Principal';
      const targetProd = sanitizeCavaProduct({ ...existingInPantry, zone: assignedZone }, zones);

      if (scanDirectionMode !== 'INTERACTIVE') {
        executeDirectAction(targetProd, scanDirectionMode);
        setIsSearching(false); processingRef.current = false;
        setTimeout(() => {
          if (armedRef.current === false) {
            armedRef.current = true;
            setScanLocked(false);
          }
        }, 1200);
        return;
      }

      setScannedResult({
        barcode: cleanCode,
        product: targetProd,
        isExisting: true,
      });
      setIsSearching(false); processingRef.current = false;
      return;
    }

    // 2. Consulta en catálogo comercial Open Food Facts / GS1
    try {
      const lookup = await lookupBarcode(cleanCode);
      if (request !== requestRef.current) return;
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

      if (!lookup?.needsName && scanDirectionMode === 'RESTOCK_SUPER') {
        executeDirectAction(newProd, 'RESTOCK_SUPER');
        setIsSearching(false); processingRef.current = false;
        setTimeout(() => {
          if (armedRef.current === false) {
            armedRef.current = true;
            setScanLocked(false);
          }
        }, 1200);
        return;
      }

      if (!lookup?.needsName && scanDirectionMode === 'ADD_ENTRY') {
        executeDirectAction(newProd, 'ADD_ENTRY');
        setIsSearching(false); processingRef.current = false;
        setTimeout(() => {
          if (armedRef.current === false) {
            armedRef.current = true;
            setScanLocked(false);
          }
        }, 1200);
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
          name: '',
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
      setIsSearching(false); processingRef.current = false;
    }
  };

  // Ejecución directa según modo multidireccional
  const executeDirectAction = (targetProduct, actionType) => {
    if (!targetProduct.name?.trim()) { setCameraError('Escribe el nombre del producto antes de guardarlo.'); return false; }
    const amount = Number(actionQuantity);
    if (!Number.isFinite(amount) || amount < 0.001) { setCameraError('La cantidad mínima es 0.001.'); return false; }
    if (actionType === 'CONSUME_EXIT' && (!targetProduct.id || Number(targetProduct.quantity) < amount)) { setCameraError('No hay suficiente existencia de este producto para descontar esa cantidad.'); return false; }
    if (actionType === 'ADD_ENTRY') {
      audio.success();
      if (onAddStockDirect) {
        onAddStockDirect(targetProduct, amount, targetProduct.zone || selectedTargetZone);
      }
      setBatchCount(prev => prev + 1);
      setLastBatchMessage(`➕ +${amount} "${targetProduct.name}" agregado a ${selectedTargetZone || targetProduct.zone}`);

      return;
    }

    if (actionType === 'CONSUME_EXIT') {
      audio.click();
      if (onSubtractStockDirect) {
        onSubtractStockDirect(targetProduct.id, amount);
      }
      setBatchCount(prev => prev + 1);
      setLastBatchMessage(`➖ -${amount} "${targetProduct.name}" descontado por consumo`);

      return;
    }

    if (actionType === 'RESTOCK_SUPER') {
      audio.superCheck();
      if (onAddToShoppingList) {
        onAddToShoppingList({
          name: targetProduct.name,
          quantity: amount,
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

      return;
    }
  };

  // Manejo de código manual
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim() || processingRef.current) return;
    setScannedResult(null);
    audio.click();
    await processBarcode(manualCode.trim());
    setManualCode('');
  };

  // Escaneo por archivo de imagen de código de barras
  const handleBarcodeFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await stopAllCameras();
    try {
      audio.click();
      setScannedResult(null); setIsSearching(true);
      const decoded = await decodeImageFile(file);

      if (decoded && decoded.trim()) {
        audio.success();
        await processBarcode(decoded.trim());
      } else {
        throw new Error('No se leyó código');
      }
    } catch (err) {
      setCameraError('No encontramos un QR o código de barras legible en esta foto. Prueba una foto de frente y con más luz, o escribe el código.');
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
        // Fallback a input de cámara nativa con captura ambiental directa
        fileReceiptCameraRef.current?.click();
      }
    } catch (err) {
      console.warn('Error capturando ticket de cámara:', err);
      fileReceiptCameraRef.current?.click();
    }
  };

  // Carga de archivo de ticket (Foto o PDF) desde archivo o cámara nativa
  const handleReceiptFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) { setReceiptNotice({ type: 'error', text: 'Este archivo supera 20 MB. Usa una imagen más ligera o divide el ticket en varias fotos.' }); return; }
    audio.click();
    setReceiptImage(file);
    const isPdf = file.name?.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    try {
      if (isPdf) {
        setReceiptPreviewUrl(null);
        await processReceiptPdf(file);
      } else {
        const url = URL.createObjectURL(file);
        setReceiptPreviewUrl(url);
        await processReceiptImage(file);
      }
    } finally {
      if (fileReceiptCameraRef.current) fileReceiptCameraRef.current.value = '';
      if (fileReceiptUploadRef.current) fileReceiptUploadRef.current.value = '';
    }
  };

  // Procesar archivo PDF de ticket con motor pdfjs y OCR
  const processReceiptPdf = async (pdfFile) => {
    setIsOcrProcessing(true);
    setReceiptNotice(null);
    setExtractedReceiptItems([]);

    try {
      const result = await extractTextFromFile(pdfFile, products, (p) => setOcrProgress(p));
      setReceiptRawText(result.rawText || '');
      if (!result.items || result.items.length === 0) {
        setReceiptNotice({
          type: 'warning',
          text: result.note || 'No se pudieron extraer líneas claras del PDF del ticket. Verifica que el archivo no esté protegido.',
        });
        audio.warning();
      } else {
        setExtractedReceiptItems(result.items);
        setSelectedReceiptItemIds(new Set(result.items.map(i => i.id)));
        setReceiptStoreName(result.items[0]?.store || 'Supermercado');
        setReceiptNotice({
          type: 'success',
          text: `🧾 ¡PDF de ticket procesado! Se detectaron ${result.items.length} artículos con sus importes reales.`,
        });
        audio.success();
      }
    } catch (err) {
      console.error('Error procesando PDF de ticket:', err);
      setReceiptNotice({
        type: 'error',
        text: 'Ocurrió un inconveniente al procesar el PDF del ticket: ' + (err.message || 'Error de lectura'),
      });
      audio.warning();
    } finally {
      setIsOcrProcessing(false);
      setOcrProgress(null);
    }
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
          text: `Lectura lista: ${result.items.length} artículos. Revisa nombres, cantidades y precios antes de guardar.${result.confidence < 60 ? ' La imagen tiene baja confianza de lectura; revisa cada partida.' : ''}`,
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
    } else if (store === 'lacomer') {
      sampleText = `laComer
Suc. Las Animas
Boulevard Atlixco, 3156
Puebla, Puebla C.P. 72400

CANT SKU ARTICULO PRECIO REGULAR PRECIO PROMOCION TOTAL
1 425 REFRESCO COCA COLA  161.00  161.00
1 999 REFRESCO MUNDET 235  130.00  130.00
1 785 AGUA CANADA DRY 237  68.60  68.60
2 869 ALUBIAS CIDACOS 570  95.00  190.00
1 969 EMPZANIZADOR BIMBO  48.10  46.00  46.00
2 073 QUESO SAINT MAURE C  87.00  174.00
1 669 HARINA HUNGRY JACK  99.00  99.00
2 142 MINI PEPINO PERSA C  49.70  99.40
2 772 TOCINO AHUMADO EN P  137.50  275.00
2 123 ELOTE COCIDO LOS AZ  49.90  99.80
0.645 029 PORO  49.90  32.19
1 660 LECHUGA HIDROPÓNICA  54.90  54.90
1 162 REFRESCO MUNDET 355  22.00  22.00
1 944 ESPINACA VEGETALIST  46.80  46.80
3 101 ARROZ SOS 1 KG  68.00  204.00
1 056 FRIJOL VERDE VALLE  50.40  50.40
2 318 GALLETAS OKKO SUPER  33.00  66.00
0.615 050 CHILE POBLANO  64.90  39.91
1 211 MORCILLA DE CONDE D  109.50  109.50
1 823 GALLETA NESTLE 108  42.00  42.00
1 105 CHORIZO TIPO CONDE  133.50  133.50
0.66 745 CASTAÑA  425.00  298.00  196.68
SUBTOTAL 2340.68
1 Estacionamiento (Las Animas) 5.00
TOTAL $ 2345.68`;
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

    setReceiptRawText(sampleText);
    const items = parseRawShoppingText(sampleText, products);
    setExtractedReceiptItems(items);
    setSelectedReceiptItemIds(new Set(items.map(i => i.id)));
    setReceiptStoreName(store === 'mercadona' ? 'Mercadona' : store === 'lacomer' ? 'La Comer' : 'Costco');
    setReceiptNotice({
      type: 'success',
      text: `🧾 Demo de ${store.toUpperCase()} cargado. Se detectaron ${items.length} artículos con importes reales.`,
    });
    audio.success();
  };

  // Análisis de inteligencia de precios para los artículos del ticket
  const priceIntelligence = useMemo(() => {
    return analyzeTicketPriceIntelligence(extractedReceiptItems.map((i) => ({ ...i, currency })), receiptStoreName || 'Supermercado');
  }, [extractedReceiptItems, receiptStoreName]);

  // Importar artículos del ticket a la Lista de Compras
  const handleImportReceiptToShoppingList = () => {
    const selectedItems = extractedReceiptItems.filter(i => selectedReceiptItemIds.has(i.id));
    if (selectedItems.length === 0) {
      notify('Por favor selecciona al menos un artículo.');
      return;
    }

    recordPricePoints(selectedItems, receiptStoreName || 'Supermercado');

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
    notify(`📥 ¡${selectedItems.length} artículos del ticket agregados a tu Lista del Súper con sus precios registrados!`);
    onClose();
  };

  // Guardar artículos del ticket DIRECTO en la Despensa (Reconciliación de compra realizada)
  const handleImportReceiptDirectToPantry = () => {
    const selectedItems = extractedReceiptItems.filter(i => selectedReceiptItemIds.has(i.id));
    if (selectedItems.length === 0) {
      notify('Por favor selecciona al menos un artículo.');
      return;
    }

    if (onBatchAddToInventory) {
      onBatchAddToInventory(selectedItems, receiptStoreName || 'Supermercado');
    } else {
      recordPricePoints(selectedItems, receiptStoreName || 'Supermercado');
      selectedItems.forEach(item => {
        const sanitized = sanitizeCavaProduct(item, zones);
        if (onAddStockDirect) {
          onAddStockDirect(sanitized, item.quantity || 1, item.targetZone);
        }
      });
    }

    audio.success();
    notify(`✅ ¡${selectedItems.length} artículos ingresados directamente a la Despensa con los precios de tu ticket!`);
    onClose();
  };

  scanCallbackRef.current = onScanSuccess;

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Escáner QR y códigos de barras" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[96vh] rounded-3xl bg-[var(--bg-base)] border border-[var(--gold)]/35 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Superior Limpio */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[var(--border-soft)] bg-[var(--bg-sunken)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent-cocina)]/20 to-[var(--gold)]/20 border border-[var(--accent-cocina)]/40 text-[var(--accent-cocina)]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                Escáner Inteligente ALACENA
              </h3>
              <p className="text-[11px] text-[var(--ink-secondary)]">
                Códigos de barra EAN/UPC · Códigos QR · Tickets de compra OCR
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Cerrar escáner" onClick={() => {
              audio.click();
              onClose();
            }}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Modo: Códigos de Barra vs Tickets vs Manual */}
        <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 bg-[var(--bg-sunken)] border-b border-[var(--border-soft)]">
          <button
            type="button"
            onClick={() => {
              audio.click();
              setActiveTab('BARCODE');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'BARCODE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'bg-[var(--bg-elevated)] text-[var(--ink-secondary)] hover:text-white hover:bg-white/5'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            <span>QR / Barras</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audio.click();
              setActiveTab('RECEIPT');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'RECEIPT'
                ? 'bg-[var(--terracotta)] text-white shadow-md shadow-[var(--terracotta)]/40'
                : 'bg-[var(--bg-elevated)] text-[var(--ink-secondary)] hover:text-white hover:bg-white/5'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Ticket</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audio.click();
              setActiveTab('MANUAL');
            }}
            className={`flex-initial flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'MANUAL'
                ? 'bg-[var(--gold)] text-[var(--on-gold)] shadow-md shadow-[var(--gold)]/30 font-black'
                : 'bg-[var(--bg-elevated)] text-[var(--ink-secondary)] hover:text-white hover:bg-white/5'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Escribir</span>
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {isSearching && <div role="status" className="p-4 rounded-xl bg-emerald-950 text-emerald-200 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Buscando el producto…</div>}
          {lastBatchMessage && activeTab !== 'BARCODE' && <p role="status" className="p-3 bg-emerald-950 text-emerald-200 rounded-xl">{lastBatchMessage}</p>}
          {cameraError && <p role="status" className="text-sm text-amber-300">{cameraError}</p>}
          {scanLocked && !isSearching && <button type="button" onClick={scanNext} className="w-full py-3 rounded-xl bg-emerald-700 text-white font-bold">Escanear otro producto</button>}
              {/* Tarjeta del Producto Detectado (Modo Interactivo) */}
              {scannedResult && (
                <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--gold)]/40 space-y-3 animate-fade-in shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        scannedResult.isExisting ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {scannedResult.isExisting ? '✓ En tu Despensa' : '✨ Nuevo Producto'}
                      </span>
                      {!scannedResult.isExisting && <label className="block text-xs text-[var(--ink-secondary)] mt-3">Nombre del producto
                        <input aria-label="Nombre del producto escaneado" value={scannedResult.product.name || ''} placeholder="Ej. Leche entera 1 litro" maxLength={300} onChange={(e) => setScannedResult((prev) => ({ ...prev, product: { ...prev.product, name: e.target.value } }))} className="block w-full p-3 mt-1 rounded-xl border border-white/20 text-white bg-black/20" />
                      </label>}
                      <p className="text-xs text-emerald-300 mt-2">{scannedResult.isExisting ? `En esta casa: ${scannedResult.product.quantity} ${scannedResult.product.unit}` : 'Confirma el nombre antes de registrarlo.'}</p>
                      <h4 className="text-base font-bold text-white mt-1">
                        {scannedResult.product.name}
                      </h4>
                      <p className="text-xs text-[var(--ink-secondary)]">
                        Código: <span className="font-mono text-white">{scannedResult.barcode}</span> • {scannedResult.product.category}
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-label="Cerrar ficha de producto"
                      onClick={() => scanNext()}
                      className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <label className="text-xs text-[var(--ink-secondary)] flex gap-3 items-center">Cantidad ({scannedResult.product.unit || 'piezas'})<input aria-label="Cantidad a registrar" type="number" inputMode="decimal" min="0.001" step="0.001" value={actionQuantity} onChange={(e) => setActionQuantity(e.target.value)} className="w-24 p-2 rounded-lg bg-black/30 text-white border border-white/20" /></label>
                  {/* Acciones para el Producto */}
                  <div className="grid grid-cols-3 gap-2 pt-1" inert={!scannedResult.product.name?.trim() || !Number.isFinite(Number(actionQuantity)) || Number(actionQuantity) <= 0 ? true : undefined}>
                    <button
                      type="button"
                      onClick={() => {
                        executeDirectAction(scannedResult.product, 'ADD_ENTRY');
                        scanNext();
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ingresar</span>
                    </button>

                    <button
                      type="button"
                      disabled={!scannedResult.isExisting || Number(scannedResult.product.quantity) < Number(actionQuantity)} onClick={() => {
                        executeDirectAction(scannedResult.product, 'CONSUME_EXIT');
                        scanNext();
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>Consumir</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        executeDirectAction(scannedResult.product, 'RESTOCK_SUPER');
                        scanNext();
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Al Súper</span>
                    </button>
                  </div>
                </div>
              )}


          {/* ═════════════════════════════════════════════════════════════════
              PESTAÑA 1: CÓDIGO DE BARRAS & QR (CÁMARA FLUIDA)
             ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'BARCODE' && (
            <div className="space-y-4">
              
              {/* Selector de Dirección Inmediata */}
              <div className="p-3 rounded-2xl bg-[var(--bg-sunken)] border border-[var(--border-soft)] space-y-1.5">
                <span className="text-[10px] font-extrabold text-[var(--gold)] uppercase tracking-wider block">
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
                          setScanDirectionMode(mode.id); scanNext();
                        }}
                        className={`flex items-center gap-1.5 p-2 rounded-xl text-[11px] font-bold transition-all text-left ${
                          isSelected
                            ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 shadow-sm'
                            : 'bg-[var(--bg-base)] border border-[var(--border-soft)] text-[var(--ink-secondary)] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <IconComp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : mode.color}`} />
                        <span className="leading-tight">{mode.label}</span>
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
              <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-[var(--border-soft)] min-h-[300px] sm:min-h-[360px] flex items-center justify-center">
                
                {/* 3.9.5: el video es de la app, no de ninguna
                    librería: getUserMedia directo + playsinline. Si
                    este video se queda en negro, el vigilante y el log
                    de diagnóstico lo dejan constancia. */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="absolute inset-0 w-full h-full object-cover"
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
                        Centra el QR o todas las barras
                      </span>
                    </div>
                  </div>
                )}

                {/* 3.9.4: cámara activa pero sin imagen todavía: nunca
                    en negro en silencio. Chip visible hasta que el
                    primer fotograma real fluya; si tarda, el vigilante
                    muestra el error con Reintentar y Foto. */}
                {scannerActive && !videoFlowing && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                    <span className="text-[11px] font-bold text-amber-200 bg-black/70 px-3 py-1.5 rounded-full border border-amber-500/40 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Conectando imagen…
                    </span>
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
                    {torchSupported && <button
                      type="button"
                      onClick={handleToggleTorch}
                      className={`p-2 rounded-xl backdrop-blur-md transition-all ${
                        torchOn ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/40' : 'bg-black/60 text-white hover:bg-black/80 border border-white/20'
                      }`}
                      title="Linterna / Flash"
                    >
                      <Flashlight className="w-4 h-4" />
                    </button>}
                  </div>
                )}

                {/* Estado de Error o Cámara Pausada */}
                {!scannerActive && (
                  <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center space-y-3 z-10">
                    <AlertCircle className="w-9 h-9 mx-auto text-[var(--gold)]" />
                    <p className="text-xs text-[var(--ink-secondary)] max-w-sm mx-auto">
                      {cameraError || (cameraStarting ? 'Abriendo cámara…' : 'La cámara está detenida. Puedes reintentar o usar una foto.')}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={cameraStarting} onClick={() => { autoAttemptsRef.current = 0; blackRecoveriesRef.current = 0; startBarcodeScanner(); }}
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

              <p className="text-xs text-[var(--ink-secondary)]">Coloca el envase a 15–25 cm, evita reflejos y mantén el código completo dentro de la imagen.</p>
              {/* Botón Alternativo de Subida por Foto */}
              <input
                type="file"
                ref={fileBarcodeRef}
                accept="image/*"
                capture="environment"
                aria-label="Subir foto de un QR o código de barras"
                onChange={handleBarcodeFileUpload}
                className="hidden"
              />
              <div className="flex items-center justify-between text-xs text-[var(--ink-secondary)] px-1">
                <span>¿Problemas de enfoque con el sensor?</span>
                <button
                  type="button"
                  onClick={() => fileBarcodeRef.current?.click()}
                  className="text-[var(--gold)] hover:underline font-semibold flex items-center gap-1"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Tomar Foto con Cámara Nativa</span>
                </button>
              </div>


            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              PESTAÑA 2: LECTOR DE TICKETS Y RECIBOS DE COMPRA (OCR)
             ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'RECEIPT' && (
            <div className="space-y-4">
              
              <input
                type="file"
                ref={fileReceiptCameraRef}
                accept="image/*"
                capture="environment"
                aria-label="Tomar foto al ticket con cámara nativa"
                onChange={handleReceiptFileSelected}
                className="hidden"
              />
              <input
                type="file"
                ref={fileReceiptUploadRef}
                accept="image/*,application/pdf,.pdf"
                aria-label="Cargar foto o archivo PDF del ticket"
                onChange={handleReceiptFileSelected}
                className="hidden"
              />

              {/* Botones de Captura del Ticket */}
              <div className="p-4 rounded-2xl bg-[var(--bg-sunken)] border border-[var(--border-soft)] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileReceiptCameraRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-gradient-to-r from-[var(--terracotta)] to-[var(--ember)] text-white font-bold text-xs sm:text-sm hover:brightness-110 shadow-lg shadow-[var(--terracotta)]/30 transition-all active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>📸 Tomar Foto al Ticket</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileReceiptUploadRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm border border-white/10 transition-all active:scale-95"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>🖼️ Foto de Galería</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileReceiptUploadRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-xs sm:text-sm border border-emerald-500/40 transition-all active:scale-95"
                  >
                    <FileText className="w-4 h-4" />
                    <span>📄 Cargar Ticket PDF</span>
                  </button>
                </div>

                {/* Pruebas 1-Clic de tickets reales */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-[11px]">
                  <span className="text-[var(--ink-secondary)]">Probar tickets muestra:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleLoadSampleTicket('lacomer')}
                      className="px-2.5 py-1 rounded-lg bg-[var(--gold)]/15 hover:bg-[var(--gold)]/25 text-[var(--gold)] font-semibold border border-[var(--gold)]/30 transition-all"
                    >
                      🇲🇽 La Comer ($ MXN)
                    </button>
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
                <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--gold)]/40 space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--gold)]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{ocrProgress?.status || 'Leyendo ticket con visión artificial OCR...'}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[var(--terracotta)] to-[var(--gold)] transition-all duration-300"
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
                <div className="p-4 rounded-2xl bg-[var(--bg-sunken)] border border-[var(--border-soft)] space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div>
                      <span className="text-xs font-extrabold text-white">
                        🧾 Artículos Detectados ({selectedReceiptItemIds.size} de {extractedReceiptItems.length})
                      </span>
                      <span className="text-[11px] text-[var(--ink-secondary)] block">
                        Tienda: <strong className="text-[var(--gold)]">{receiptStoreName}</strong>
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
                      className="text-xs text-[var(--gold)] hover:underline font-semibold"
                    >
                      {selectedReceiptItemIds.size === extractedReceiptItems.length ? 'Desmarcar todos' : 'Marcar todos'}
                    </button>
                  </div>

                  {/* Banner de Inteligencia de Precios & Asesor Multitienda */}
                  {priceIntelligence && (priceIntelligence.priceDropsCount > 0 || priceIntelligence.priceHikesCount > 0 || priceIntelligence.totalCrossStoreSavingsPotential > 0) && (
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-[var(--bg-elevated)] via-[var(--bg-elevated)] to-[var(--bg-elevated)] border border-[var(--gold)]/35 text-[11px] space-y-1.5 animate-fade-in">
                      <div className="flex items-center justify-between font-bold text-[var(--gold)]">
                        <span className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-[var(--gold)]" />
                          Auditoría de Precios & Asesor Multitienda:
                        </span>
                        {priceIntelligence.totalCrossStoreSavingsPotential > 0 && (
                          <span className="text-emerald-300 font-mono">
                            Ahorro potencial: ${priceIntelligence.totalCrossStoreSavingsPotential.toFixed(2)} MXN
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        {priceIntelligence.priceDropsCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" />
                            <span>{priceIntelligence.priceDropsCount} bajaron (-${priceIntelligence.totalSavedVsPrevious.toFixed(2)})</span>
                          </span>
                        )}
                        {priceIntelligence.priceHikesCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{priceIntelligence.priceHikesCount} subieron (+${priceIntelligence.totalInflationCost.toFixed(2)})</span>
                          </span>
                        )}
                        {priceIntelligence.recommendations.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/25 font-semibold">
                            💡 En {priceIntelligence.recommendations[0]?.cheapestStore}: "{priceIntelligence.recommendations[0]?.productName}" a ${priceIntelligence.recommendations[0]?.cheapestPrice.toFixed(2)} (-${priceIntelligence.recommendations[0]?.lineSavings.toFixed(2)})
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <TicketReview key={receiptRawText} items={extractedReceiptItems} setItems={setExtractedReceiptItems}
                    selectedIds={selectedReceiptItemIds} setSelectedIds={setSelectedReceiptItemIds} rawText={receiptRawText}
                    store={receiptStoreName} setStore={setReceiptStoreName} currency={currency} shoppingList={shoppingList}
                    onSave={onConfirmReceipt || ((payload) => onBatchAddToInventory?.(payload.checkedItems, receiptStoreName))} onClose={onClose} />

                </div>
              )}

            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              PESTAÑA 3: INGRESO MANUAL DE CÓDIGOS DE BARRA O ID
             ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'MANUAL' && (
            <form onSubmit={handleManualSubmit} className="p-4 rounded-2xl bg-[var(--bg-sunken)] border border-[var(--border-soft)] space-y-4">
              <div>
                <label className="text-xs font-extrabold text-[var(--gold)] block mb-1">
                  Escribe los dígitos del código de barras o clave corta:
                </label>
                <div className="relative">
                  <input
                    aria-label="Código de barras o QR" type="text" autoComplete="off" maxLength={4096}
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Ej. 7501055300076 o ALC-4B7"
                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white font-mono text-sm focus:outline-none focus:border-[var(--gold)]"
                  />
                  <button
                    aria-label="Buscar código" disabled={isSearching || !manualCode.trim()} type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[var(--gold)] text-[var(--on-gold)] font-bold hover:brightness-110"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-[var(--ink-secondary)] space-y-1">
                <p>💡 <strong>Tip del Comprador:</strong> Puedes escribir el código de barras impreso en cualquier envase de supermercado para consultar su catálogo o sumarlo a tu inventario.</p>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
