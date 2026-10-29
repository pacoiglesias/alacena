// Diagnóstico del escáner — módulo pequeño y reutilizable.
//
// Propósito: que una revisión posterior (humana o automática) pueda ver
// QUÉ pasó en la cámara del usuario sin estar delante de su teléfono:
// permiso, apertura de cámara, primer fotograma, reinicios, timeouts
// y errores, con su mensaje. Nació en Alacena 3.9.5, cuando el escáner
// llevaba cuatro versiones en negro en el iPhone real mientras en las
// pruebas con cámara simulada todo salía en verde: sin registro, el
// fallo era invisible desde fuera.
//
// Reutilización prevista: RealScan y Bolsas pueden importar este mismo
// módulo tal cual; solo cambia la clave de almacenamiento (pasar otro
// `storageKey` a createScannerDiag) y el nombre del módulo en los
// eventos. No depende de React ni de Firebase.
//
// PRIVACIDAD — regla dura: aquí solo entran eventos técnicos. NUNCA se
// registran fotos, imágenes de códigos, valores decodificados, nombres
// de productos ni contenido de la lista/despensa del hogar. Como red de
// seguridad, sanitizeDetails() borra cualquier clave sospechosa
// (code, barcode, text, value, name, product, items, ...) aunque algún
// llamador la pase por error, y recorta los textos a 200 caracteres.
//
// Almacenamiento: localStorage, últimos 200 eventos (se descartan los
// más viejos). Si no hay almacenamiento disponible, no rompe nada: los
// eventos solo viven en memoria de la sesión.
import { APP_VERSION } from '../version.js';

export const SCANNER_DIAG_KEY = 'alacena:scanner_diag';
export const SCANNER_DIAG_MAX_EVENTS = 200;

// Claves que nunca deben quedar en el registro, ni por error de un llamador.
const FORBIDDEN_KEYS = new Set([
  'code', 'barcode', 'qr', 'rawvalue', 'raw_value', 'text', 'value',
  'name', 'product', 'items', 'list', 'photo', 'image', 'dataurl',
  'data_url', 'src', 'password', 'token',
]);

function sanitizeValue(value, depth = 0) {
  if (typeof value === 'string') return value.slice(0, 200);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) return value;
  if (Array.isArray(value)) return depth > 2 ? '[...]' : value.slice(0, 20).map((v) => sanitizeValue(v, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(String(k).toLowerCase())) continue;
      out[String(k).slice(0, 40)] = sanitizeValue(v, depth + 1);
    }
    return out;
  }
  return String(value).slice(0, 200);
}

export function sanitizeDiagDetails(details = {}) {
  if (!details || typeof details !== 'object') return {};
  return sanitizeValue(details);
}

function readStored(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStored(key, events) {
  try {
    localStorage.setItem(key, JSON.stringify(events));
  } catch {
    // Sin almacenamiento: el registro solo vive en memoria esta sesión.
  }
}

// Fábrica para poder reutilizarlo en otras apps con otra clave.
export function createScannerDiag(storageKey = SCANNER_DIAG_KEY) {
  let memoryFallback = [];

  function log(event, details = {}) {
    const entry = {
      t: new Date().toISOString(),
      v: APP_VERSION,
      ev: String(event).slice(0, 60),
      d: sanitizeDiagDetails(details),
    };
    try {
      const events = readStored(storageKey);
      events.push(entry);
      while (events.length > SCANNER_DIAG_MAX_EVENTS) events.shift();
      writeStored(storageKey, events);
    } catch {
      memoryFallback.push(entry);
      while (memoryFallback.length > SCANNER_DIAG_MAX_EVENTS) memoryFallback.shift();
    }
    return entry;
  }

  function getEvents() {
    try {
      const events = readStored(storageKey);
      if (events.length > 0) return events;
    } catch {
      // Cae al respaldo en memoria.
    }
    return [...memoryFallback];
  }

  function clear() {
    memoryFallback = [];
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Nada que limpiar.
    }
  }

  // Texto plano para Copiar y pasar a quien revisa el problema.
  function toText() {
    const events = getEvents();
    const lines = [
      `Alacena v${APP_VERSION} — diagnóstico del escáner`,
      `Agente: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'desconocido'}`,
      `Eventos: ${events.length} (los más recientes al final)`,
      '',
    ];
    for (const e of events) {
      lines.push(`${e.t} [${e.ev}] ${JSON.stringify(e.d)}`);
    }
    return lines.join('\n');
  }

  return { log, getEvents, clear, toText };
}

// Instancia por defecto para Alacena.
const diag = createScannerDiag();

export const diagLog = (...args) => diag.log(...args);
export const getDiagEvents = () => diag.getEvents();
export const clearDiag = () => diag.clear();
export const diagText = () => diag.toText();

// Evento inicial de sesión: versión, navegador, contexto seguro y qué
// motores de decodificación están disponibles en este dispositivo.
export function diagSessionStart(extra = {}) {
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  return diag.log('session_start', {
    ua: nav.userAgent || 'desconocido',
    secure: typeof window !== 'undefined' ? window.isSecureContext : false,
    barcodeDetector: typeof window !== 'undefined' && 'BarcodeDetector' in window,
    mediaDevices: Boolean(nav.mediaDevices?.getUserMedia),
    ...extra,
  });
}
