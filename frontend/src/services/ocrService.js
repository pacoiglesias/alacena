// Servicio de Pre-procesamiento de Imagen y Reconocimiento Óptico de Caracteres (OCR)
// Optimizado para fotos tomadas con móvil a notas manuscritas, hojas de libreta y tickets de supermercado.

import { createWorker } from 'tesseract.js';
import { parseRawShoppingText } from './smartListParser';

/**
 * Pre-procesa una imagen en un elemento Canvas para maximizar la precisión del OCR:
 * 1. Escala a resolución óptima (evita saturación de memoria pero mantiene nitidez).
 * 2. Conversión a escala de grises con pesos luminosos ITU-R BT.601.
 * 3. Aumento de contraste y binarización adaptativa suave para atenuar sombras del teléfono.
 */
export async function preprocessImageForOcr(imageSource) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Ajustar tamaño: máximo 2000px en el lado mayor para rendimiento rápido en móvil
        let { width, height } = img;
        const maxDim = 2000;
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

        // Dibujar original
        ctx.drawImage(img, 0, 0, width, height);

        // Obtener datos de píxeles
        const imgData = ctx.getImageData(0, 0, width, height);
        const d = imgData.data;

        // 1. Escala de grises y cálculo de brillo medio
        let totalBrightness = 0;
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          d[i] = gray;
          d[i + 1] = gray;
          d[i + 2] = gray;
          totalBrightness += gray;
        }
        const avgBrightness = totalBrightness / (d.length / 4);

        // 2. Aumento de contraste adaptativo (estiramiento de histograma)
        const contrastFactor = 1.35; // Aumentar contraste 35%
        for (let i = 0; i < d.length; i += 4) {
          let v = d[i];
          // Curva S centrada en el brillo medio
          v = (v - avgBrightness) * contrastFactor + avgBrightness;
          // Ligero umbral para papel blanco y tinta oscura
          if (v > 215) v = 255;
          else if (v < 60) v = 0;
          else v = Math.min(255, Math.max(0, v));

          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        // Si falla el canvas por restricciones raras, devolver imagen original
        resolve(imageSource);
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
 * Ejecuta OCR sobre una imagen con Tesseract.js en español
 * @param {File|Blob|string} imageFile - Imagen a procesar
 * @param {Function} onProgress - Callback con { status, progress (0 a 100) }
 * @param {Array} existingProducts - Catálogo de productos para cruce inteligente
 */
export async function extractShoppingListFromImage(imageFile, onProgress = () => {}, existingProducts = []) {
  let worker = null;
  try {
    onProgress({ status: 'Optimizando calidad de imagen (contraste y sombras)...', progress: 15 });
    
    // 1. Preprocesar imagen
    const processedImageDataUrl = await preprocessImageForOcr(imageFile);

    onProgress({ status: 'Inicializando motor OCR en español...', progress: 35 });

    // 2. Crear worker de Tesseract con idioma español ('spa') y fallback a inglés ('eng')
    worker = await createWorker('spa+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const pct = 35 + Math.round((m.progress || 0) * 55);
          onProgress({ status: `Reconociendo texto manuscrito/impreso... (${Math.round((m.progress || 0) * 100)}%)`, progress: pct });
        }
      },
    });

    onProgress({ status: 'Extrayendo caracteres y líneas...', progress: 75 });

    // 3. Ejecutar reconocimiento
    const ret = await worker.recognize(processedImageDataUrl);
    const rawText = ret.data.text || '';

    onProgress({ status: 'Estructurando artículos, cantidades y departamentos...', progress: 95 });

    // 4. Limpieza de texto OCR común
    const cleanedText = cleanOcrArtifacts(rawText);

    // 5. Parseo inteligente con el motor de lenguaje
    const items = parseRawShoppingText(cleanedText, existingProducts);

    onProgress({ status: '¡Extracción completada!', progress: 100 });

    return {
      rawText: cleanedText,
      confidence: ret.data.confidence,
      items,
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
      // Quitar caracteres basura sueltos al inicio/fin
      l = l.replace(/^[|~_<>:;!¡]+/, '').replace(/[|~_<>:;]+$/, '').trim();
      // Corregir patrones comunes como "1kg." -> "1 kg"
      l = l.replace(/(\d+)\s*(kg|kilos|l|lt|piezas|pzas|latas|botellas)/i, '$1 $2');
      // Corregir O mayúscula como cero o viceversa en números obvios
      l = l.replace(/^O\s+(kg|l|piezas)/i, '0 $1');
      return l;
    })
    .filter((l) => l.length >= 2 && !/^[\d\W]+$/.test(l)) // descartar líneas que solo sean símbolos o números sueltos
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
      // Para PDF: intentar extraer texto plano nativo
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target.result;
          // Decodificar cadenas de texto legibles dentro del PDF
          const textDecoder = new TextDecoder('latin1');
          const rawPdfString = textDecoder.decode(buffer);
          
          // Buscar flujos de texto en el PDF
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

          // Si el PDF era texto vectorizado o digital
          if (extractedText.trim().length > 10) {
            const items = parseRawShoppingText(extractedText, existingProducts);
            resolve({ rawText: extractedText, items });
            return;
          }

          // Si es un PDF escaneado (imagen pura), avisar al usuario
          resolve({
            rawText: '',
            items: [],
            note: 'El archivo PDF contiene imágenes escaneadas. Para mejores resultados, sube la imagen (JPG/PNG) directamente a la pestaña de Foto OCR.',
          });
        } catch (err) {
          reject(new Error('Error al leer el archivo PDF: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el PDF'));
      reader.readAsArrayBuffer(file);
    } else {
      // TXT o CSV
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
