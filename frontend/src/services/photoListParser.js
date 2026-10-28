// Parser de foto-lista: convierte el texto OCR de una lista de compra
// manuscrita (varios productos por renglón, separados por comas) en
// partidas revisables para la lista del súper.
//
// Diferencia con parseRawShoppingText (tickets): en una lista manuscrita
// cada renglón puede traer VARIOS productos separados por comas, y la
// escritura trae variantes que hay que normalizar (urugula -> arúgula,
// zetas -> setas). El texto ya viene de extractShoppingListFromImage
// (OCR español local) o de la pestaña de texto; aquí solo se trocea,
// se normaliza y se delega la inferencia (cantidad, unidad, departamento,
// tienda, zona) al parser general, fragmento por fragmento.

import { parseRawShoppingText, formatProductName, inferDepartment } from './smartListParser.js';

// Quita acentos, puntos y signos para comparar sin importar cómo lo
// escribió la mano o cómo lo leyó el OCR ("Mr. Músculo" -> "mr musculo").
export function foldKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Fragmento completo -> nombre canónico. Solo casos atestiguados
// (foto de ejemplo o su OCR), no adivinanzas de marcas.
const WHOLE_FRAGMENT_FIXES = {
  'mr musculo': 'Mr. Músculo',
};

// Palabra suelta (plegada) -> palabra corregida. Incluye las variantes
// reales de la foto de ejemplo (urugula, zetas) y lecturas del OCR
// sobre esa misma foto (urugola, favuloso/lavuloso, sabantta/sabanttas,
// aguacaro). No se tocan palabras que no están en este mapa.
const WORD_FIXES = {
  urugula: 'arúgula',
  urugola: 'arúgula',
  zetas: 'setas',
  foronja: 'toronja',
  favuloso: 'fabuloso',
  lavuloso: 'fabuloso',
  sabantta: 'sabanitas',
  sabanttas: 'sabanitas',
  aguacaro: 'aguacate',
  musculo: 'músculo',
  esparragos: 'espárragos',
};

export function normalizeHandwrittenName(rawName) {
  if (!rawName) return '';
  const trimmed = String(rawName).trim().replace(/[.]+$/, '');
  if (!trimmed) return '';
  const whole = WHOLE_FRAGMENT_FIXES[foldKey(trimmed)];
  if (whole) return whole;
  const fixed = trimmed
    .split(/\s+/)
    .map((word) => WORD_FIXES[foldKey(word)] || word)
    .join(' ');
  return formatProductName(fixed);
}

// Fragmentos que NO son un producto aparte sino la continuación del
// anterior: calificadores ("en frasco", "en lata") o cantidad/unidad
// suelta ("2 kg"). "elotitos tiernos, en frasco" es UN producto.
const QUALIFIER_RE = /^(en|con|de|del)\s+(frasco|frascos|lata|latas|botella|botellas|caja|cajas|bolsa|bolsas|paquete|paquetes|bote|botes|tarro|tarros)$/i;
const QTY_ONLY_RE = /^\d+(?:[.,]\d+)?\s*(kg|kilos|g|gr|l|lt|litros|piezas|pzas|latas|botellas)?$/i;

export function splitPhotoListText(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  const fragments = [];
  for (const rawLine of rawText.split(/\r?\n/)) {
    // Quita viñetas y numeración inicial, igual que el parser general.
    const line = rawLine
      .trim()
      .replace(/^[\s-*•·–—>~•✓✔#]+/, '')
      .replace(/^\d+[\.)\-]+\s+/, '')
      .trim();
    if (!line) continue;
    for (const piece of line.split(',')) {
      const fragment = piece.trim();
      if (!fragment || fragment.length < 2 || /^[\W_]+$/.test(fragment)) continue;
      const prev = fragments[fragments.length - 1];
      if (prev && (QUALIFIER_RE.test(fragment) || QTY_ONLY_RE.test(fragment))) {
        fragments[fragments.length - 1] = `${prev} ${fragment}`;
      } else {
        fragments.push(fragment);
      }
    }
  }
  return fragments;
}

// Parsea una foto-lista completa. Cada fragmento se resuelve con el
// parser general (cantidades, unidades, departamento, tienda, zona) y
// su nombre se normaliza. Fragmentos ilegibles se descartan en silencio:
// la revisión previa es donde el usuario corrige o agrega lo que falte.
// Duplicados exactos (mismo nombre plegado y misma unidad) se suman.
export function parsePhotoList(rawText, existingProducts = []) {
  const fragments = splitPhotoListText(rawText);
  const items = [];
  const byKey = new Map();
  for (const fragment of fragments) {
    const parsed = parseRawShoppingText(fragment, existingProducts);
    if (!parsed || parsed.length === 0) continue;
    const item = parsed[0];
    item.name = normalizeHandwrittenName(item.name);
    if (!item.name || item.name.length < 2) continue;
    // Basura de OCR (letras sueltas, restos de viñetas) fuera: exige al
    // menos una palabra de 2 letras. "sal" y "té" pasan; "E..." no.
    if (!/[a-zñ]{2,}/.test(foldKey(item.name))) continue;
    // El parser general puede dejar una preposición colgando cuando la
    // palabra final era una unidad ("elotitos tiernos en" + frasco como
    // unidad botellas). La unidad ya guarda el dato; el nombre queda limpio.
    item.name = item.name.replace(/\s+(en|de|del|con)$/i, '');
    // Re-inferir el departamento con el nombre YA normalizado: la variante
    // manuscrita ("foronja", "zetas", "urugula") no casaba con ninguna
    // palabra clave y quedaba en Abarrotes. Solo se mejora, nunca se baja
    // un departamento que el parser ya había asignado.
    if (!item.matchedInPantry) {
      const dept = inferDepartment(item.name);
      if (dept !== 'Abarrotes') item.department = dept;
    }
    const key = `${foldKey(item.name)}|${item.unit}`;
    const prev = byKey.get(key);
    if (prev) {
      prev.quantity = Number((Number(prev.quantity || 1) + Number(item.quantity || 1)).toFixed(3));
    } else {
      byKey.set(key, item);
      items.push(item);
    }
  }
  return items;
}
