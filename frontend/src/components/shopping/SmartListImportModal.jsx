import React, { useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  X, Camera, FileText, Upload, Sparkles, Check, 
  Trash2, Plus, AlertCircle, ShoppingCart, Loader2,
  SlidersHorizontal, CheckCircle2, RefreshCw, QrCode
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { parseRawShoppingText } from '../../services/smartListParser';
import { extractShoppingListFromImage, extractTextFromFile } from '../../services/ocrService';

export default function SmartListImportModal({ 
  isOpen, 
  onClose, 
  onImportItems, 
  existingProducts = [],
  zones = []
}) {
  const [activeSubTab, setActiveSubTab] = useState('text'); // 'text' | 'ocr' | 'file'
  
  // Text Tab State
  const [rawText, setRawText] = useState('');
  
  // OCR Tab State
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(null); // { status, progress }
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  // File Tab State
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileDocInputRef = useRef(null);
  
  // Extracted Items State (Pre-import Review)
  const [extractedItems, setExtractedItems] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [importNotice, setImportNotice] = useState(null);

  if (!isOpen) return null;

  // Cargar ejemplo de WhatsApp
  const handleLoadSampleText = (type) => {
    audio.click();
    if (type === 'cocinera') {
      setRawText(
`Buenos días Don Paco, esto se requiere para la comida de la semana:
- 2 kg de jitomate saladet
- 1 botella de aceite de oliva
- 1/2 kg de queso manchego
- 4 aguacates hass
- [Costco] 3 paquetes de papel de baño
- 2 botellas de vino tinto
- 1.5 l de leche entera`
      );
    } else if (type === 'costco') {
      setRawText(
`[Costco] 1 paquete servilletas kleenex
[Costco] 2 kg de pechuga de pollo organica
[Costco] 1 bolsa de nuez de la india
[Costco] 1 charola de huevos blancos`
      );
    }
  };

  // Procesar texto libre
  const handleProcessText = () => {
    audio.click();
    if (!rawText.trim()) {
      setImportNotice({ type: 'warning', text: 'Por favor pega o escribe texto antes de analizar.' });
      return;
    }
    const items = parseRawShoppingText(rawText, existingProducts);
    if (items.length === 0) {
      setImportNotice({ type: 'warning', text: 'No se detectaron artículos válidos en el texto ingresado.' });
      return;
    }
    setExtractedItems(items);
    setSelectedItemIds(new Set(items.map((i) => i.id)));
    setImportNotice({ type: 'success', text: `¡Se detectaron ${items.length} artículos con éxito! Revisa la lista abajo.` });
    audio.success();
  };

  // Manejar selección de imagen para OCR
  const handleImageSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
    setOcrProgress(null);
    setImportNotice(null);
    audio.click();
  };

  // Ejecutar OCR o Decodificación QR
  const handleRunOcr = async () => {
    if (!selectedImage) return;

    setIsOcrProcessing(true);
    audio.click();
    try {
      // 1. Intentar decodificar primero si la imagen contiene un Código QR (ultra-rápido en ~150ms)
      try {
        const qrDetector = new Html5Qrcode('qr-detection-buffer');
        const decodedQr = await qrDetector.scanFile(selectedImage, false);
        try { qrDetector.clear(); } catch (_) {}
        if (decodedQr && decodedQr.trim()) {
          let textToParse = decodedQr.trim();
          if (textToParse.startsWith('{') || textToParse.startsWith('[')) {
            try {
              const parsedJson = JSON.parse(textToParse);
              const itemsArray = Array.isArray(parsedJson) ? parsedJson : (parsedJson.items || []);
              if (itemsArray.length > 0) {
                textToParse = itemsArray.map(i => `${i.quantity || 1} ${i.unit || 'pza'} de ${i.name}`).join('\n');
              }
            } catch (_) {}
          }
          const qrItems = parseRawShoppingText(textToParse, existingProducts);
          if (qrItems.length > 0) {
            setExtractedItems(qrItems);
            setSelectedItemIds(new Set(qrItems.map((i) => i.id)));
            setImportNotice({
              type: 'success',
              text: `🎯 ¡Código QR detectado y decodificado al instante! Se extrajeron ${qrItems.length} ingredientes.`
            });
            audio.success();
            setIsOcrProcessing(false);
            return;
          }
        }
      } catch (qrErr) {
        // No era un código QR, continuar al motor OCR óptico
      }

      // 2. Reconocimiento Óptico (OCR) con Tesseract en español para recetas, notas manuscritas y tickets
      const result = await extractShoppingListFromImage(
        selectedImage, 
        (progress) => setOcrProgress(progress),
        existingProducts
      );

      if (result.items.length === 0) {
        setImportNotice({ 
          type: 'warning', 
          text: 'Se leyó la imagen pero no se detectaron nombres claros de productos. Puedes revisar el texto extraído o editar manualmente.' 
        });
        setRawText(result.rawText);
        setActiveSubTab('text');
      } else {
        setExtractedItems(result.items);
        setSelectedItemIds(new Set(result.items.map((i) => i.id)));
        setImportNotice({ 
          type: 'success', 
          text: `¡OCR Exitoso! Se extrajeron ${result.items.length} artículos con ${Math.round(result.confidence || 85)}% de confianza.` 
        });
        audio.success();
      }
    } catch (err) {
      console.error('Error OCR:', err);
      setImportNotice({ type: 'error', text: 'Ocurrió un inconveniente al procesar el OCR. Intenta con otra foto con mejor iluminación.' });
      audio.alert();
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Manejar carga de archivo (.txt, .pdf)
  const handleFileDocSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingFile(true);
    audio.click();
    try {
      const result = await extractTextFromFile(file, existingProducts);
      if (result.note) {
        setImportNotice({ type: 'warning', text: result.note });
      } else if (result.items.length > 0) {
        setExtractedItems(result.items);
        setSelectedItemIds(new Set(result.items.map((i) => i.id)));
        setImportNotice({ type: 'success', text: `¡Archivo procesado! Se detectaron ${result.items.length} artículos.` });
        audio.success();
      } else {
        setImportNotice({ type: 'warning', text: 'No se encontraron artículos en el archivo. Puedes copiar el texto y pegarlo.' });
      }
    } catch (err) {
      setImportNotice({ type: 'error', text: 'No se pudo leer el archivo: ' + err.message });
      audio.alert();
    } finally {
      setIsReadingFile(false);
    }
  };

  // Toggle selección de un artículo individual
  const toggleItemSelection = (id) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle seleccionar todos
  const toggleSelectAll = () => {
    if (selectedItemIds.size === extractedItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(extractedItems.map((i) => i.id)));
    }
  };

  // Actualizar campo de un artículo
  const handleUpdateItem = (id, field, value) => {
    setExtractedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Eliminar un artículo de la lista de revisión
  const handleRemoveItem = (id) => {
    audio.delete();
    setExtractedItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Agregar fila manual en la revisión
  const handleAddManualRow = () => {
    audio.click();
    const newItem = {
      id: `manual-row-${Date.now()}`,
      name: 'Nuevo Artículo',
      quantity: 1,
      unit: 'piezas',
      department: 'Abarrotes',
      store: 'Costco',
      estimatedPriceMxn: 50,
      targetZone: zones[0]?.name || 'Alacena Principal',
      checked: false,
    };
    setExtractedItems((prev) => [newItem, ...prev]);
    setSelectedItemIds((prev) => new Set([...prev, newItem.id]));
  };

  // Confirmar e importar a la lista de compras del Súper
  const handleConfirmImport = () => {
    const itemsToImport = extractedItems.filter((i) => selectedItemIds.has(i.id));
    if (itemsToImport.length === 0) {
      alert('Por favor selecciona al menos un artículo para importar.');
      return;
    }

    audio.success();
    onImportItems(itemsToImport);
    onClose();
  };

  // Calcular métricas de la importación
  const totalCost = extractedItems
    .filter((i) => selectedItemIds.has(i.id))
    .reduce((sum, i) => sum + (Number(i.quantity) || 1) * (Number(i.estimatedPriceMxn) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#14110F] border border-[#E0B441]/35 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#2A2521] bg-[#1C1814]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#E0B441]/20 to-[#E5724A]/20 text-[#E0B441] border border-[#E0B441]/40">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-bold text-[#F2EDE4]">
                Importador Bidireccional Inteligente & OCR
              </h2>
              <p className="text-xs text-[#B8AFA3]">
                Pega notas de WhatsApp, toma foto a una libreta/ticket o sube archivos para poblar tu lista al instante
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="p-2 rounded-xl text-[#B8AFA3] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs: Texto / Foto OCR / Archivo */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 pb-2 border-b border-[#2A2521] bg-[#171412] overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              audio.click();
              setActiveSubTab('text');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeSubTab === 'text'
                ? 'bg-[#E0B441] text-[#12100E] shadow-md shadow-[#E0B441]/20 font-bold'
                : 'text-[#B8AFA3] hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>💬 Pegar Texto / WhatsApp</span>
          </button>

          <button
            onClick={() => {
              audio.click();
              setActiveSubTab('ocr');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeSubTab === 'ocr'
                ? 'bg-[#E5724A] text-white shadow-md shadow-[#E5724A]/20'
                : 'text-[#B8AFA3] hover:text-white hover:bg-white/5'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>📸 Foto de Libreta / Ticket (OCR)</span>
          </button>

          <button
            onClick={() => {
              audio.click();
              setActiveSubTab('file');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeSubTab === 'file'
                ? 'bg-[#3D8B6E] text-white shadow-md shadow-[#3D8B6E]/20'
                : 'text-[#B8AFA3] hover:text-white hover:bg-white/5'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>📄 Subir Archivo (PDF / TXT)</span>
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          
          {/* Notification Alert */}
          {importNotice && (
            <div className={`p-3.5 rounded-2xl flex items-center justify-between text-xs sm:text-sm border animate-fade-in ${
              importNotice.type === 'success' 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                : importNotice.type === 'warning'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-center gap-2.5">
                {importNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{importNotice.text}</span>
              </div>
              <button onClick={() => setImportNotice(null)} className="text-white/60 hover:text-white text-xs ml-2">
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: PEGAR TEXTO / WHATSAPP */}
          {activeSubTab === 'text' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-[#E0B441] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Escribe o Pega tu Lista (Una por renglón o separada por comas)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#B8AFA3]">Probar con:</span>
                  <button
                    type="button"
                    onClick={() => handleLoadSampleText('cocinera')}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-[#E0B441] border border-[#E0B441]/30 transition-all"
                  >
                    WhatsApp Cocinera
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSampleText('costco')}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-[#E5724A] border border-[#E5724A]/30 transition-all"
                  >
                    Costco Bulk
                  </button>
                </div>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={6}
                placeholder="Ejemplo:&#10;- 2 kg de jitomate saladet&#10;- 1 aceite de oliva extra virgen&#10;- 4 aguacates hass&#10;- 3 latas de atún dolores&#10;- 2 botellas vino tinto rioja&#10;- 1 paquete papel de baño regio luxury"
                className="w-full p-3.5 rounded-2xl bg-[#1C1814] border border-[#3D3630] focus:border-[#E0B441] text-sm text-[#F2EDE4] font-mono placeholder:text-[#6E655F] outline-none transition-all resize-y"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#8B8378]">
                  Detecta automáticamente cantidades, fracciones (1/2 kg), departamentos y tiendas.
                </span>
                <button
                  type="button"
                  onClick={handleProcessText}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E0B441] to-[#E5724A] text-[#12100E] font-bold text-xs sm:text-sm hover:brightness-110 shadow-lg shadow-[#E0B441]/20 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Analizar y Extraer Artículos</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FOTO DE LIBRETA / TICKET (OCR) */}
          {activeSubTab === 'ocr' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#1C1814] border border-[#3D3630] flex flex-col sm:flex-row items-center gap-4">
                
                {/* Inputs de Cámara y Archivo */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelected}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelected}
                  className="hidden"
                />

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#E5724A] to-[#C9552E] text-white font-bold text-xs sm:text-sm hover:brightness-110 shadow-md transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Tomar Foto con Cámara</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs sm:text-sm border border-[#3D3630] transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Subir de Galería</span>
                  </button>
                </div>

                <div className="text-xs text-[#8B8378] flex-1">
                  💡 <strong>Tip pro:</strong> Coloca la nota o ticket sobre una superficie plana y bien iluminada. El sistema aplica corrección de sombras y filtro de contraste automáticamente.
                </div>
              </div>

              {/* Vista previa y botón de procesamiento */}
              {imagePreviewUrl && (
                <div className="p-4 rounded-2xl bg-[#1C1814] border border-[#3D3630] flex flex-col md:flex-row items-center gap-5 animate-fade-in">
                  <div className="w-full md:w-48 h-48 rounded-xl overflow-hidden bg-black/50 border border-[#3D3630] shrink-0 flex items-center justify-center">
                    <img
                      src={imagePreviewUrl}
                      alt="Captura a procesar"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 w-full space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#F2EDE4]">
                        {selectedImage?.name || 'Foto capturada'}
                      </span>
                      <span className="text-xs text-[#B8AFA3]">
                        {Math.round((selectedImage?.size || 0) / 1024)} KB
                      </span>
                    </div>

                    {isOcrProcessing ? (
                      <div className="space-y-2 p-3 rounded-xl bg-[#14110F] border border-[#E5724A]/30">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#E5724A]">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{ocrProgress?.status || 'Procesando OCR con visión artificial...'}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#E5724A] to-[#E0B441] transition-all duration-300"
                            style={{ width: `${ocrProgress?.progress || 25}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRunOcr}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#E5724A] to-[#E0B441] text-[#12100E] font-bold text-sm hover:brightness-110 shadow-lg shadow-[#E5724A]/25 transition-all"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Extraer Texto y Productos con OCR</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUBIR ARCHIVO (PDF / TXT) */}
          {activeSubTab === 'file' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileDocInputRef}
                accept=".txt,.csv,.pdf,text/plain,application/pdf"
                onChange={handleFileDocSelected}
                className="hidden"
              />

              <div 
                onClick={() => fileDocInputRef.current?.click()}
                className="p-8 rounded-3xl border-2 border-dashed border-[#3D3630] hover:border-[#3D8B6E] bg-[#1C1814]/50 hover:bg-[#1C1814] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all text-center group"
              >
                <div className="p-4 rounded-2xl bg-[#3D8B6E]/15 text-[#3D8B6E] group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F2EDE4]">
                    Haz clic aquí o arrastra tu archivo (.TXT, .CSV o .PDF)
                  </h4>
                  <p className="text-xs text-[#8B8378] mt-1">
                    Ideal para notas de pedido de proveedores, listas de supermercado digital o respaldos
                  </p>
                </div>
                {isReadingFile && (
                  <div className="flex items-center gap-2 text-xs text-[#3D8B6E] font-medium mt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Leyendo y analizando archivo...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TABLA DE REVISIÓN Y EDICIÓN PREVIA (PRE-IMPORT) */}
          {extractedItems.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-[#2A2521] animate-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-semibold text-[#E0B441] hover:underline flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {selectedItemIds.size === extractedItems.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                  </button>
                  <span className="text-xs text-[#8B8378]">
                    ({selectedItemIds.size} de {extractedItems.length} seleccionados)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddManualRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#F2EDE4] border border-[#3D3630] transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-[#E0B441]" />
                  <span>Agregar Fila</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                {extractedItems.map((item) => {
                  const isChecked = selectedItemIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center gap-3 ${
                        isChecked 
                          ? 'bg-[#1C1814] border-[#E0B441]/40 shadow-sm' 
                          : 'bg-[#14110F]/60 border-[#2A2521] opacity-60'
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleItemSelection(item.id)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked 
                            ? 'bg-[#E0B441] border-[#E0B441] text-[#12100E]' 
                            : 'border-[#3D3630] hover:border-[#E0B441]'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Nombre del Artículo */}
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                          className="w-full bg-transparent text-sm font-semibold text-[#F2EDE4] focus:bg-[#14110F] px-2 py-1 rounded-lg border border-transparent focus:border-[#E0B441] outline-none transition-all"
                        />
                        {item.matchedInPantry && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono pl-2">
                            <span>✓ En tu Alacena ({item.targetZone})</span>
                          </div>
                        )}
                      </div>

                      {/* Cantidad y Unidad */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                          className="w-16 p-1.5 rounded-lg bg-[#14110F] border border-[#3D3630] text-center text-xs font-mono font-bold text-[#E0B441] outline-none"
                        />
                        <select
                          value={item.unit}
                          onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                          className="p-1.5 rounded-lg bg-[#14110F] border border-[#3D3630] text-xs font-medium text-[#B8AFA3] outline-none"
                        >
                          <option value="kg">kg</option>
                          <option value="litros">litros</option>
                          <option value="piezas">piezas</option>
                          <option value="botellas">botellas</option>
                          <option value="latas">latas</option>
                          <option value="paquetes">paquetes</option>
                          <option value="cajas">cajas</option>
                          <option value="bolsas">bolsas</option>
                          <option value="gramos">gramos</option>
                        </select>
                      </div>

                      {/* Tienda */}
                      <select
                        value={item.store}
                        onChange={(e) => handleUpdateItem(item.id, 'store', e.target.value)}
                        className="p-1.5 rounded-lg bg-[#14110F] border border-[#3D3630] text-xs text-[#E5724A] font-medium outline-none shrink-0"
                      >
                        <option value="Costco">Costco</option>
                        <option value="City Market">City Market</option>
                        <option value="Chedraui Selecto">Chedraui Selecto</option>
                        <option value="Walmart Express">Walmart Express</option>
                        <option value="Supermercado">Supermercado</option>
                        <option value="Mercado Local">Mercado Local</option>
                      </select>

                      {/* Botón Eliminar Fila */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-lg text-[#8B8378] hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                        title="Eliminar de la lista previa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-t border-[#2A2521] bg-[#1C1814] flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#B8AFA3]">
              Seleccionados: <strong className="text-white font-mono">{selectedItemIds.size}</strong> artículos
            </span>
            {totalCost > 0 && (
              <span className="text-xs text-[#B8AFA3] border-l border-[#3D3630] pl-3">
                Costo estimado: <strong className="text-[#E0B441] font-mono">${totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                audio.click();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl border border-[#3D3630] text-xs sm:text-sm font-semibold text-[#B8AFA3] hover:text-white hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={selectedItemIds.size === 0}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xl transition-all ${
                selectedItemIds.size > 0
                  ? 'bg-gradient-to-r from-[#E0B441] to-[#E5724A] text-[#12100E] hover:brightness-110 shadow-[#E0B441]/25 active:scale-95'
                  : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Importar ({selectedItemIds.size}) a la Lista del Súper</span>
            </button>
          </div>
        </div>

        {/* Buffer off-screen para decodificación de códigos QR en fotos */}
        <div id="qr-detection-buffer" className="hidden" />

      </div>
    </div>
  );
}
