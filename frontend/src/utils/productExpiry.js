// Utilidad de caducidad: la app usa UN SOLO campo, `expiryDate`.
// Los documentos viejos que traen `expirationDate` se migran al cargar
// (nada escribe `expirationDate` en toda la app; los lectores solo
// conocen `expiryDate`).

// Día local (calendario) de una fecha de caducidad, o null si no es válida.
// Las fechas `YYYY-MM-DD` se leen como día local: `new Date('2026-11-08')`
// es medianoche UTC y en México restaba un día según la hora de consulta.
function parseExpiryLocalDate(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (m) {
      const year = Number(m[1]), month = Number(m[2]), day = Number(m[3]);
      if (month < 1 || month > 12 || day < 1 || day > 31) return null;
      return new Date(year, month - 1, day);
    }
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  return null;
}

// Días de calendario hasta la caducidad: hoy = 0, mañana = 1, ayer = -1.
// Es estable durante todo el día: antes se calculaba con milisegundos y
// `Math.ceil`, así que el mismo producto marcaba "2d" por la noche y "3d"
// por la mañana, y una fecha inválida acababa en "Vence en NaNd".
// Devuelve null si no hay fecha válida.
export function daysUntilExpiry(value, now = new Date()) {
  const target = parseExpiryLocalDate(value);
  if (!target) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Fecha de caducidad legible ("8 nov 2026"); si no se puede leer,
// devuelve el valor tal cual en vez de inventar una fecha.
export function formatExpiryDate(value) {
  const date = parseExpiryLocalDate(value);
  if (!date) return value == null ? '' : String(value);
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getProductExpiryDate(product) {
  if (!product || typeof product !== 'object') return null;
  return product.expiryDate ?? null;
}

export function migrateProductExpiry(product) {
  if (!product || typeof product !== 'object') return product;
  if (!('expirationDate' in product)) return product;
  const { expirationDate, ...rest } = product;
  if (rest.expiryDate !== undefined && rest.expiryDate !== null) {
    // Ya trae fecha buena: se suelta la llave vieja sin tocarla.
    return rest;
  }
  return { ...rest, expiryDate: expirationDate ?? null };
}

export function migrateProductsExpiry(list) {
  if (!Array.isArray(list)) return list;
  return list.map(migrateProductExpiry);
}

// ── «Por vencer»: UNA sola definición para toda la app (3.14.0) ──
// Antes cada pantalla usaba su propio umbral (Despensa 15 días,
// cabecera 3, Resumen Diario 4) y el mismo producto «urgía» en una
// pantalla y no existía en otra. Definición única, la de Despensa:
//
//   Por vencer = el producto caduca hoy o en los próximos 15 días
//   (o ya caducó) Y todavía queda existencia que consumir.
//
// Cabecera, Resumen Diario y Despensa cuentan con isExpiringSoon;
// nadie vuelve a escribir su propio «<= N días» de caducidad.
export const EXPIRY_SOON_DAYS = 15;

export function isExpiringSoon(product, now = new Date()) {
  if (!product || (product.quantity || 0) <= 0) return false;
  const diffDays = daysUntilExpiry(getProductExpiryDate(product), now);
  if (diffDays === null) return false;
  return diffDays <= EXPIRY_SOON_DAYS;
}
