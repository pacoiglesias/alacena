// Utilidad centralizada para extracción y coincidencia ultra robusta de Códigos QR, Barcodes y NFC
// Soporta deep-links URL (?scan=..., ?qr=..., ?id=...), claves ALC-XXXX, EAN-13, UPC y JSON

/**
 * Extrae la clave limpia o código de barras a partir de cualquier texto escaneado:
 * - URL completa: http://localhost:5173/?scan=ALC-1 -> ALC-1
 * - URL de producción: https://alacena-enterprise-prod.web.app/?scan=prod-1 -> prod-1
 * - JSON interno: {"id":"prod-1",...} -> prod-1
 * - Clave directa: ALC-1, 7501000111223, prod-1
 */
export function extractCodeFromScan(rawCode) {
  if (rawCode == null) return '';
  const value = String(rawCode).trim();
  if (!value || value.length > 4096) return '';
  if (value.startsWith('{')) {
    try {
      const parsed = JSON.parse(value);
      const code = parsed.barcode || parsed.qrId || parsed.id;
      return typeof code === 'string' || typeof code === 'number' ? String(code).trim() : '';
    } catch { return ''; }
  }
  if (value.includes('?')) {
    try {
      const url = new URL(value, 'https://alacena.local');
      for (const key of ['scan', 'qr', 'id']) {
        const code = url.searchParams.get(key);
        if (code) return code.trim(); // URLSearchParams already decodes percent escapes.
      }
    } catch { return ''; }
  }
  const path = value.match(/\/(\d{8,14})(?:\/|\.|$|\?)/);
  if (path) return path[1];
  return value;
}

/** User-facing camera errors and the next useful action. */
export function cameraErrorMessage(error) {
  if (typeof window !== 'undefined' && !window.isSecureContext)
    return 'La cámara necesita HTTPS. Abre ALACENA desde su dirección segura o usa una foto del código.';
  const name = error?.name || String(error || '');
  if (/NotAllowed|PermissionDenied|denied/i.test(name)) return 'El permiso de cámara está bloqueado. Actívalo en los permisos de este sitio y toca Reintentar. También puedes usar una foto o escribir el código.';
  if (/NotFound|DevicesNotFound|no camera/i.test(name)) return 'No encontramos una cámara. Conecta una, sube una foto del código o escríbelo abajo.';
  if (/NotReadable|TrackStart|in use/i.test(name)) return 'Otra aplicación está usando la cámara. Ciérrala y toca Reintentar.';
  return 'No pudimos iniciar esta cámara. Toca Reintentar, elige otra cámara o usa una foto del código.';
}

/**
 * Busca un producto en el inventario local con múltiples estrategias de tolerancia:
 * - ID exacto (prod-1)
 * - Barcode exacto (7501000777889)
 * - Clave ALC (ALC-1 <-> prod-1)
 * - Tolerancia de ceros a la izquierda (12 vs 13 dígitos UPC/EAN)
 * - Nombre exacto
 */
export function findProductByScanCode(products = [], rawInput) {
  if (!products || products.length === 0 || !rawInput) {
    return { product: null, cleanCode: extractCodeFromScan(rawInput) };
  }

  const cleanCode = extractCodeFromScan(rawInput);
  if (!cleanCode) {
    return { product: null, cleanCode: '' };
  }

  const cleanLower = cleanCode.toLowerCase();
  const cleanUpper = cleanCode.toUpperCase();

  // Quitar prefijo ALC- si existe (ej. ALC-1 -> 1 o ALC-PROD-1 -> prod-1)
  const strippedAlc = cleanUpper.startsWith('ALC-') ? cleanUpper.replace(/^ALC-/, '') : null;

  for (const p of products) {
    if (!p) continue;

    const pIdLower = String(p.id || '').toLowerCase();
    const pIdUpper = String(p.id || '').toUpperCase();
    const pBarcodeLower = String(p.barcode || '').toLowerCase();
    const pBarcodeUpper = String(p.barcode || '').toUpperCase();

    if (p.qrId && String(p.qrId).toLowerCase() === cleanLower) return { product: p, cleanCode };

    // 1. Coincidencia directa por ID o Barcode
    if (pIdLower === cleanLower) return { product: p, cleanCode };
    if (pBarcodeLower && pBarcodeLower === cleanLower) return { product: p, cleanCode };

    // 2. Clave generada ALC-XXXX
    const generatedAlc = `ALC-${pIdUpper.replace(/^PROD-/, '')}`;
    if (generatedAlc === cleanUpper) return { product: p, cleanCode };

    // 3. Si cleanCode era ALC-1 y p.id es 'prod-1' o '1'
    if (strippedAlc) {
      if (pIdUpper === strippedAlc) return { product: p, cleanCode };
      if (pIdUpper === `PROD-${strippedAlc}`) return { product: p, cleanCode };
      if (pBarcodeUpper === strippedAlc) return { product: p, cleanCode };
    }

    // 4. Si cleanCode es solo el número '1' y p.id es 'prod-1'
    if (cleanLower === pIdLower.replace(/^prod-/, '')) {
      return { product: p, cleanCode };
    }

    // 5. Normalización UPC / EAN-13 (tolerancia de cero inicial)
    if (/^\d{12,14}$/.test(cleanCode) && p.barcode && /^\d{12,14}$/.test(p.barcode)) {
      const cleanNum = cleanCode.replace(/^0+/, '');
      const pNum = String(p.barcode).replace(/^0+/, '');
      if (cleanNum === pNum) return { product: p, cleanCode };
    }

    // 6. Coincidencia por nombre exacto si el QR codificó el nombre
    if (p.name && p.name.trim().toLowerCase() === cleanLower) {
      return { product: p, cleanCode };
    }
  }

  return { product: null, cleanCode };
}

// El escáner puede reportar "activo" con el video en negro: pista viva
// pero sin fotogramas (caso iOS visto en 3.9.0). Sano solo si el video
// tiene metadatos (readyState >= HAVE_CURRENT_DATA) y ancho real.
export function isScannerVideoHealthy(video) {
  if (!video) return false;
  return video.readyState >= 2 && video.videoWidth > 0;
}

// 3.9.3: los metadatos NO bastan en iOS. Un video puede tener
// readyState >= 2 y ancho real sin entregar ningún fotograma: se queda
// en negro y el vigilante de 3.9.1 lo declaraba sano y se retiraba.
// Sano = flujo real: el currentTime del MISMO elemento avanzó desde
// la muestra anterior. Sin muestra anterior no se puede afirmar flujo
// (la primera muestra solo establece la base).
export function isScannerVideoFlowing(prevCurrentTime, video) {
  if (!video || typeof video.currentTime !== 'number' || typeof prevCurrentTime !== 'number') return false;
  return video.currentTime > prevCurrentTime;
}

// 3.9.4: el vigilante solo sigue videos con stream real. La librería
// deja un <video> oculto sin srcObject que nunca fluye: si se mezcla
// con el video real, las muestras se contaminan y el diagnóstico miente.
// Un video cuenta solo si tiene stream attached y tamaño visible.
export function isScannerStreamingVideo(video) {
  if (!video || !video.srcObject) return false;
  const w = video.videoWidth || video.clientWidth || 0;
  return w > 0;
}

// 3.9.4: presupuesto total de negro por sesión de escáner. Antes el
// vigilante reiniciaba hasta 3 veces con 5 s de paro cada una y el
// usuario veía ~20 s de cuadro negro en silencio antes del error.
// Con 12 s de negro acumulado sin un solo fotograma, se muestra el
// error con Reintentar y Foto aunque quede presupuesto de reinicio.
export const SCANNER_BLACK_BUDGET_MS = 12000;
export function isBlackBudgetExceeded(blackSinceMs, nowMs, budgetMs = SCANNER_BLACK_BUDGET_MS) {
  if (typeof blackSinceMs !== 'number' || typeof nowMs !== 'number') return false;
  return nowMs - blackSinceMs >= budgetMs;
}
