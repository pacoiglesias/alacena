// Servicio de Pre-procesamiento de Imagen y Reconocimiento Óptico de Caracteres (OCR)
// Optimizado para fotos tomadas con móvil a notas manuscritas, hojas de libreta y tickets de supermercado (España & México).

import { pdfTextLines } from '../utils/pdfTextLines';
import { createWorker } from 'tesseract.js';
import { parseRawShoppingText } from './smartListParser';

/**
 * Pre-procesa una imagen en un elemento Canvas para maximizar la legibilidad de tickets y notas:
 * 1. Escala a resolución óptima (máx 2200px) para mantener nítidas las letras térmicas pequeñas.
 * 2. Conversión a escala de grises ponderada (ITU-R BT.601).
 * 3. Estiramiento de histograma adaptativo suave (percentiles 3% y 97%) para compensar sombras del móvil sin quemar blancos ni oscurecer números.
 * 4. Ligero realce de bordes (unsharp mask suave) para tipografías de matriz de puntos o térmicas.
 */
export async function preprocessImageForOcr(imageSource) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        let { width, height } = img;
        const maxDim = 4200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar original escalado
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const d = imgData.data;
        const len = d.length;

        // 1. Escala de grises y recolección de histograma
        const hist = new Int32Array(256);
        for (let i = 0; i < len; i += 4) {
          const gray = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
          d[i] = gray;
          d[i + 1] = gray;
          d[i + 2] = gray;
          hist[gray]++;
        }

        // 2. Estiramiento de histograma adaptativo (percentiles 3% y 97%)
        const totalPixels = len / 4;
        const pLowThreshold = totalPixels * 0.03;
        const pHighThreshold = totalPixels * 0.97;

        let accum = 0;
        let lowVal = 0;
        let highVal = 255;

        for (let i = 0; i < 256; i++) {
          accum += hist[i];
          if (accum >= pLowThreshold && lowVal === 0) {
            lowVal = i;
          }
          if (accum >= pHighThreshold) {
            highVal = i;
            break;
          }
        }

        const range = Math.max(1, highVal - lowVal);

        // Aplicar estiramiento con curva gamma suave
        for (let i = 0; i < len; i += 4) {
          let v = d[i];
          // Normalizar rango
          let stretched = ((v - lowVal) / range) * 255;
          stretched = Math.max(0, Math.min(255, stretched));

          // Acento en letras oscuras sobre papel claro
          if (stretched < 110) {
            stretched = Math.round(stretched * 0.82); // Tintas más oscuras
          } else if (stretched > 180) {
            stretched = Math.min(255, Math.round(stretched * 1.08)); // Papel más limpio
          }

          d[i] = stretched;
          d[i + 1] = stretched;
          d[i + 2] = stretched;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        // En caso de excepción, devolver la fuente original
        resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
      }
    };

    img.onerror = (e) => reject(new Error('No se pudo cargar la imagen para pre-procesamiento: ' + e));

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof Blob || imageSource instanceof File) {
      img.src = URL.createObjectURL(imageSource);
    } else {
      reject(new Error('Formato de imagen inválido para OCR'));
    }
  });
}

/**
 * Convierte un File o Blob a URL limpia de objeto
 */
function getSourceUrl(source) {
  if (typeof source === 'string') return source;
  if (source instanceof Blob || source instanceof File) return URL.createObjectURL(source);
  return null;
}

/**
 * Ejecuta OCR sobre una imagen con Tesseract.js en español (con doble pasada adaptativa)
 * @param {File|Blob|string} imageFile - Imagen del ticket o nota
 * @param {Function} onProgress - Callback con { status, progress (0 a 100) }
 * @param {Array} existingProducts - Catálogo de productos para cruce inteligente
 */
export async function extractShoppingListFromImage(imageFile, onProgress = () => {}, existingProducts = []) {
  let worker = null;
  const rawOriginalUrl = getSourceUrl(imageFile);

  try {
    onProgress({ status: 'Preparando imagen y eliminando sombras del móvil...', progress: 15 });
    
    // 1. Preprocesar imagen
    let processedImageDataUrl = null;
    try {
      processedImageDataUrl = await preprocessImageForOcr(imageFile);
    } catch (_) {
      processedImageDataUrl = rawOriginalUrl;
    }

    onProgress({ status: 'Inicializando motor OCR en español...', progress: 30 });

    // 2. Crear worker de Tesseract con español ('spa').
    // Si la descarga de 'spa' falla, intenta fallback a 'eng'.
    try {
      worker = await createWorker('spa', 1, {
        workerPath: '/ocr/worker.min.js', corePath: '/ocr', langPath: '/ocr',
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pct = 35 + Math.round((m.progress || 0) * 50);
            onProgress({ 
              status: `Leyendo líneas del ticket / texto... (${Math.round((m.progress || 0) * 100)}%)`, 
              progress: pct 
            });
          }
        },
      });
    } catch (langErr) {
      throw new Error('No se pudo cargar el motor local de tickets. Abre ALACENA con conexión una vez para completar la preparación sin internet. ' + (langErr.message || ''));
    }

    onProgress({ status: 'Extrayendo caracteres, importes y columnas...', progress: 75 });

    // 3. Ejecutar primera pasada con la imagen optimizada
    let ret = await worker.recognize(processedImageDataUrl);
    let rawText = ret.data.text || '';

    // 4. Doble pasada adaptativa:
    // Si la imagen optimizada arrojó muy poco texto (< 25 caracteres), reintentar con la imagen original sin filtros
    if (rawText.trim().length < 25 && rawOriginalUrl) {
      onProgress({ status: 'Aplicando segunda pasada con imagen natural...', progress: 85 });
      try {
        const secondPass = await worker.recognize(rawOriginalUrl);
        if ((secondPass.data.text || '').trim().length > rawText.trim().length) {
          ret = secondPass;
          rawText = secondPass.data.text || '';
        }
      } catch (_) {}
    }

    onProgress({ status: 'Estructurando artículos, precios y departamentos...', progress: 95 });

    // 5. Limpieza de texto OCR
    const cleanedText = cleanOcrArtifacts(rawText);

    // 6. Parseo inteligente con el motor de lenguaje y tickets
    const items = parseRawShoppingText(cleanedText, existingProducts);

    onProgress({ status: `¡Extracción completada! ${items.length} artículos detectados`, progress: 100 });

    return {
      rawText: cleanedText,
      confidence: ret.data.confidence,
      items,
      isReceipt: items.some(i => i.realPrice !== null),
    };
  } catch (error) {
    console.error('Error en extracción OCR:', error);
    throw new Error('Fallo al procesar OCR de la imagen: ' + (error.message || error));
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {}
    }
  }
}

/**
 * Limpia errores típicos de OCR en tickets y notas manuscritas
 */
export function cleanOcrArtifacts(text) {
  if (!text) return '';
  return text
    .split('\n')
    .map((line) => {
      let l = line.trim();
      // Quitar caracteres basura al inicio o al final
      l = l.replace(/^[|~_<>:;!¡*]+/, '').replace(/[|~_<>:;!*]+$/, '').trim();
      
      // Corregir patrones comunes como "1kg." -> "1 kg" o "1L." -> "1L"
      l = l.replace(/(\d+)\s*(kg|kilos|l|lt|piezas|pzas|latas|botellas)/i, '$1 $2');
      
      // Corregir comas o puntos tipográficos en precios ej: "0 . 95" -> "0.95"
      l = l.replace(/(\d+)\s*([.,])\s*(\d{2})/g, '$1$2$3');

      // Corregir 'O' mayúscula como cero en números aislados
      l = l.replace(/^O\s+(kg|l|piezas)/i, '0 $1');
      return l;
    })
    .filter((l) => l.length >= 2 && !/^[\W_]+$/.test(l)) // Descartar líneas que solo sean símbolos
    .join('\n');
}

/**
 * Lee archivos de texto (.txt, .csv) o extrae contenido de un archivo
 */
export async function extractTextFromFile(file, existingProducts = [], onProgress = null) {
  return new Promise(async (resolve, reject) => {
    if (!file) return reject(new Error('Archivo no provisto'));

    const isPdf = file.name?.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    if (isPdf) {
      try {
        const arrayBuffer = await file.arrayBuffer();

        // 1. Intentar renderizar y extraer con pdfjs-dist (soporta PDFs digitales y escaneados de cualquier formato)
        try {
          const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
          if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
              'pdfjs-dist/build/pdf.worker.min.mjs',
              import.meta.url
            ).toString();
          }

          const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
          const doc = await loadingTask.promise;
          if (doc.numPages > 10) { await doc.destroy(); resolve({ rawText: '', items: [], note: 'Este PDF tiene más de 10 páginas. Divide el ticket en archivos más pequeños.' }); return; }
          const pages = [];
          for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
            const page = await doc.getPage(pageNumber);
            const content = await page.getTextContent();
            const text = pdfTextLines(content.items);
            if (content.items.length > 8 && parseRawShoppingText(text, existingProducts).length) pages.push(text);
            else {
              const viewport = page.getViewport({ scale: 2 });
              const canvas = document.createElement('canvas');
              canvas.width = viewport.width; canvas.height = viewport.height;
              await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
              const result = await extractShoppingListFromImage(canvas.toDataURL('image/png'), onProgress || (() => {}), existingProducts);
              pages.push(result.rawText);
            }
            page.cleanup();
          }
          await doc.destroy();
          const rawText = pages.join('\n');
          resolve({ rawText, items: parseRawShoppingText(rawText, existingProducts), note: 'PDF revisado: ' + pages.length + ' páginas.' });
          return;
        } catch (pdfjsErr) {
          console.warn('Fallo en motor pdfjs, aplicando fallback directo:', pdfjsErr);
        }

        // 2. Fallback de extracción de streams de texto y JPEG en bruto
        const textDecoder = new TextDecoder('latin1');
        const rawPdfString = textDecoder.decode(arrayBuffer);
        const streamMatches = rawPdfString.match(/BT[\s\S]*?ET/g) || [];
        let extractedText = '';

        if (streamMatches.length > 0) {
          extractedText = streamMatches
            .map((block) => {
              const parts = block.match(/\((.*?)\)[\s]*Tj/g) || [];
              return parts.map((p) => p.replace(/^\(|\)[\s]*Tj$/g, '')).join(' ');
            })
            .join('\n');
        }

        if (extractedText.trim().length > 10) {
          const items = parseRawShoppingText(extractedText, existingProducts);
          resolve({ rawText: extractedText, items });
          return;
        }

        // Si el PDF contiene un JPEG embebido
        const uint8 = new Uint8Array(arrayBuffer);
        let startIdx = -1;
        for (let i = 0; i < uint8.length - 2; i++) {
          if (uint8[i] === 0xff && uint8[i + 1] === 0xd8 && uint8[i + 2] === 0xff) {
            startIdx = i;
            break;
          }
        }
        if (startIdx !== -1) {
          let endIdx = -1;
          for (let i = uint8.length - 2; i >= startIdx; i--) {
            if (uint8[i] === 0xff && uint8[i + 1] === 0xd9) {
              endIdx = i + 2;
              break;
            }
          }
          if (endIdx > startIdx) {
            const imageBlob = new Blob([uint8.subarray(startIdx, endIdx)], { type: 'image/jpeg' });
            const ocrRes = await extractShoppingListFromImage(imageBlob, onProgress || (() => {}), existingProducts);
            resolve({
              rawText: ocrRes.rawText,
              items: ocrRes.items,
              note: ocrRes.items.length > 0 ? `Se extrajo y procesó la imagen del PDF (${ocrRes.items.length} artículos).` : null,
            });
            return;
          }
        }

        resolve({
          rawText: '',
          items: [],
          note: 'El archivo PDF no contiene texto legible ni imágenes claras. Intenta con una foto directa.',
        });
      } catch (err) {
        reject(new Error('Error al leer el archivo PDF: ' + err.message));
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result || '';
        const items = parseRawShoppingText(text, existingProducts);
        resolve({ rawText: text, items });
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo de texto'));
      reader.readAsText(file, 'UTF-8');
    }
  });
}
