// Decodificación de códigos de barras y QR sin html5-qrcode.
//
// 3.9.5 sustituye la apertura de cámara de html5-qrcode 2.3.8 por un
// motor en dos capas, porque la librería creaba su propio <video> y en
// el iPhone real ese video se quedaba en negro versión tras versión
// (aunque en pruebas con cámara simulada todo salía en verde):
//
//   1. La app abre la cámara ella misma con getUserMedia y su propio
//      <video> visible (ver CameraScannerModal). Ninguna librería toca
//      el elemento de video.
//   2. Decodificación: si el navegador trae BarcodeDetector nativo
//      (Chrome, Edge, Safari 17+), se usa; si no, o si el nativo falla,
//      se usa ZXing (@zxing/browser) sobre el fotograma. ZXing funciona
//      en todos los navegadores modernos, incluido Safari anterior a 17.
//
// Formatos: los mismos que usaba html5-qrcode en Alacena (QR, EAN-13,
// EAN-8, UPC-A, UPC-E, Code 128, Code 39, ITF).
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

export const SUPPORTED_FORMATS = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.ITF,
];

// Formatos con el nombre que acepta BarcodeDetector (cuando existe).
export const SUPPORTED_NATIVE_FORMATS = [
  'qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf',
];

let reader = null;
function getReader() {
  if (!reader) {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, SUPPORTED_FORMATS);
    hints.set(DecodeHintType.TRY_HARDER, true);
    reader = new BrowserMultiFormatReader(hints);
  }
  return reader;
}

let nativeDetector = null;
let nativeDetectorFailed = false;
export function hasNativeDetector() {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

// Decodifica un fotograma del video en vivo. Devuelve { text, engine }
// o null si no hay código en el fotograma. Los errores que no son "no
// encontrado" se propagan para que el llamador los registre en el log.
export async function decodeVideoFrame(video, canvas) {
  if (!video || video.readyState < 2 || video.videoWidth === 0) return null;
  if (hasNativeDetector() && !nativeDetectorFailed) {
    try {
      if (!nativeDetector) {
        nativeDetector = new window.BarcodeDetector({ formats: SUPPORTED_NATIVE_FORMATS });
      }
      const found = await nativeDetector.detect(video);
      if (found && found.length > 0 && found[0].rawValue) {
        return { text: found[0].rawValue, engine: 'native' };
      }
      return null;
    } catch (err) {
      // El detector nativo existe pero no sirve en este dispositivo:
      // se cae a ZXing para el resto de la sesión y se deja constancia
      // en el error para que el log lo recoja.
      nativeDetectorFailed = true;
      err.engineFallback = true;
      throw err;
    }
  }
  // ZXing sobre el fotograma (canvas reutilizable del llamador).
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const scale = Math.min(1, 1280 / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  try {
    const result = getReader().decodeFromCanvas(canvas);
    return result?.getText?.() ? { text: result.getText(), engine: 'zxing' } : null;
  } catch (err) {
    // NotFoundException = fotograma sin código: no es un error.
    if (err?.name === 'NotFoundException') return null;
    throw err;
  }
}

// Decodifica una foto (File/Blob) de QR o código de barras. Devuelve el
// texto o lanza si no hay código legible. Usado por el escáner (foto
// con cámara nativa) y por la importación de listas con foto.
export async function decodeImageFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('No se pudo leer la imagen'));
      img.src = url;
    });
    const result = await getReader().decodeFromImageElement(img);
    const text = result?.getText?.();
    if (!text) throw new Error('No se leyó código');
    return text;
  } finally {
    URL.revokeObjectURL(url);
  }
}
