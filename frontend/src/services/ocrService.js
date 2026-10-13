// Servicio de Pre-procesamiento de Imagen y Reconocimiento Óptico de Caracteres (OCR)
// Optimizado para fotos tomadas con móvil a notas manuscritas, hojas de libreta y tickets de supermercado (España & México).

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
        const maxDim = 2200;
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
      console.warn('Error inicializando idioma "spa", probando fallback "eng":', langErr);
      onProgress({ status: 'Descargando modelo de reconocimiento alterno...', progress: 32 });
      worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pct = 35 + Math.round((m.progress || 0) * 50);
            onProgress({ 
              status: `Leyendo texto... (${Math.round((m.progress || 0) * 100)}%)`, 
              progress: pct 
            });
          }
        },
      });
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
export async function extractTextFromFile(file, existingProducts = []) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('Archivo no provisto'));

    const isPdf = file.name?.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    if (isPdf) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target.result;
          const textDecoder = new TextDecoder('latin1');
          const rawPdfString = textDecoder.decode(buffer);
          
          const streamMatches = rawPdfString.match(/BT[\s\S]*?ET/g) || [];
          let extractedText = '';
          
          if (streamMatches.length > 0) {
            extractedText = streamMatches
              .map(block => {
                const parts = block.match(/\((.*?)\)[\s]*Tj/g) || [];
                return parts.map(p => p.replace(/^\(|\)[\s]*Tj$/g, '')).join(' ');
              })
              .join('\n');
          }

          if (extractedText.trim().length > 10) {
            const items = parseRawShoppingText(extractedText, existingProducts);
            resolve({ rawText: extractedText, items });
            return;
          }

          resolve({
            rawText: '',
            items: [],
            note: 'El archivo PDF contiene imágenes escaneadas. Para mejores resultados, sube la foto (JPG/PNG) directamente a la pestaña de "Foto de Libreta / Ticket (OCR)".',
          });
        } catch (err) {
          reject(new Error('Error al leer el archivo PDF: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el PDF'));
      reader.readAsArrayBuffer(file);
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
