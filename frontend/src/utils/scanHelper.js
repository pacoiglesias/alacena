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
  if (!rawCode) return '';
  let str = String(rawCode).trim();

  // 1. Si es un JSON serializado de ALACENA
  if (str.startsWith('{') && str.endsWith('}')) {
    try {
      const parsed = JSON.parse(str);
      if (parsed.barcode) return String(parsed.barcode).trim();
      if (parsed.id) return String(parsed.id).trim();
    } catch (_) {}
  }

  // 2. Si contiene parámetros de consulta (?scan=, &scan=, ?qr=, ?id=)
  if (str.includes('?scan=') || str.includes('&scan=')) {
    try {
      const dummyUrl = new URL(str, typeof window !== 'undefined' ? window.location.origin : 'https://alacena.local');
      const val = dummyUrl.searchParams.get('scan');
      if (val) return decodeURIComponent(val).trim();
    } catch (_) {
      const m = str.match(/[?&]scan=([^&#\s]+)/i);
      if (m && m[1]) return decodeURIComponent(m[1]).trim();
    }
  }

  if (str.includes('?qr=') || str.includes('&qr=')) {
    try {
      const dummyUrl = new URL(str, typeof window !== 'undefined' ? window.location.origin : 'https://alacena.local');
      const val = dummyUrl.searchParams.get('qr');
      if (val) return decodeURIComponent(val).trim();
    } catch (_) {
      const m = str.match(/[?&]qr=([^&#\s]+)/i);
      if (m && m[1]) return decodeURIComponent(m[1]).trim();
    }
  }

  if (str.includes('?id=') || str.includes('&id=')) {
    try {
      const dummyUrl = new URL(str, typeof window !== 'undefined' ? window.location.origin : 'https://alacena.local');
      const val = dummyUrl.searchParams.get('id');
      if (val) return decodeURIComponent(val).trim();
    } catch (_) {
      const m = str.match(/[?&]id=([^&#\s]+)/i);
      if (m && m[1]) return decodeURIComponent(m[1]).trim();
    }
  }

  // 3. Si es una URL externa con código numérico en la ruta (ej. https://.../product/7501030491024)
  const numPathMatch = str.match(/\/(\d{8,14})(?:\/|\.|$|\?)/);
  if (numPathMatch && numPathMatch[1]) {
    return numPathMatch[1].trim();
  }

  return str;
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

    const pIdLower = (p.id || '').toLowerCase();
    const pIdUpper = (p.id || '').toUpperCase();
    const pBarcodeLower = (p.barcode || '').toLowerCase();
    const pBarcodeUpper = (p.barcode || '').toUpperCase();

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
      const pNum = p.barcode.replace(/^0+/, '');
      if (cleanNum === pNum) return { product: p, cleanCode };
    }

    // 6. Coincidencia por nombre exacto si el QR codificó el nombre
    if (p.name && p.name.trim().toLowerCase() === cleanLower) {
      return { product: p, cleanCode };
    }
  }

  return { product: null, cleanCode };
}
