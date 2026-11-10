// Lotes por caducidad (ronda 3.11.0, FEFO mínimo viable).
//
// Un producto puede llevar `lots: [{ expiryDate, quantity }]` además de su
// `expiryDate` principal. Compatibilidad total hacia atrás: un producto
// sin lotes (o con la lista vacía) se comporta exactamente como antes —
// estas funciones devuelven sus lotes tal cual (vacío) y el consumo no
// toca ninguna fecha.
//
// Reglas FEFO al consumir: se descuenta primero del lote que antes vence.
// La `expiryDate` visible del producto pasa a ser la del lote vigente más
// próximo con cantidad > 0; si ya no queda ningún lote con cantidad, se
// conserva la fecha que traía el producto (no se inventa ninguna).

const round3 = (n) => Math.round(Number(n) * 1000) / 1000;

export function normalizeLots(product) {
  const lots = Array.isArray(product?.lots) ? product.lots : [];
  return lots
    .filter((l) => l && typeof l === 'object' && String(l.expiryDate || '').trim() && Number(l.quantity) > 0)
    .map((l) => ({ expiryDate: String(l.expiryDate), quantity: round3(l.quantity) }))
    .sort((a, b) => (a.expiryDate < b.expiryDate ? -1 : a.expiryDate > b.expiryDate ? 1 : 0));
}

export function totalLotsQuantity(lots) {
  return round3((lots || []).reduce((sum, l) => sum + (Number(l.quantity) || 0), 0));
}

// Descuenta `amount` de los lotes en orden FEFO. Devuelve los lotes
// restantes (sin los agotados) y el detalle consumido por lote.
export function consumeFromLots(lots, amount) {
  let remaining = round3(amount);
  const consumed = [];
  const next = [];
  for (const lot of normalizeLots({ lots })) {
    if (remaining <= 0) { next.push(lot); continue; }
    const take = Math.min(lot.quantity, remaining);
    consumed.push({ expiryDate: lot.expiryDate, quantity: round3(take) });
    remaining = round3(remaining - take);
    const left = round3(lot.quantity - take);
    if (left > 0) next.push({ expiryDate: lot.expiryDate, quantity: left });
  }
  return { lots: next, consumed, unassigned: remaining };
}

// Suma `amount` al lote de la misma fecha; si no existe y hay fecha, crea
// uno nuevo. Sin fecha no se puede lotear: devuelve los lotes sin tocar.
export function addToLots(lots, amount, expiryDate) {
  const normalized = normalizeLots({ lots });
  if (!expiryDate) return normalized;
  const date = String(expiryDate);
  const idx = normalized.findIndex((l) => l.expiryDate === date);
  if (idx >= 0) {
    normalized[idx] = { expiryDate: date, quantity: round3(normalized[idx].quantity + Number(amount)) };
    return normalized;
  }
  return normalizeLots({ lots: [...normalized, { expiryDate: date, quantity: Number(amount) }] });
}

// Fecha visible tras un movimiento: la del lote vigente más próximo, o la
// de respaldo si no queda ningún lote con cantidad.
export function nextVisibleExpiryDate(lots, fallback) {
  const normalized = normalizeLots({ lots });
  return normalized.length ? normalized[0].expiryDate : (fallback ?? null);
}

// Aplica un movimiento (delta con signo, ya redondeado a 3 decimales por
// quien llama) sobre los lotes de un producto y devuelve { lots, expiryDate }
// nuevos, o null si el producto no tiene lotes (nada que lotear).
export function applyMovementToLots(product, delta) {
  const lots = normalizeLots(product);
  if (!lots.length) return null;
  if (delta < 0) {
    const { lots: remaining } = consumeFromLots(lots, Math.abs(delta));
    return { lots: remaining, expiryDate: nextVisibleExpiryDate(remaining, product.expiryDate ?? null) };
  }
  if (delta > 0) {
    const grown = addToLots(lots, delta, product.expiryDate);
    return { lots: grown, expiryDate: nextVisibleExpiryDate(grown, product.expiryDate ?? null) };
  }
  return { lots, expiryDate: product.expiryDate ?? null };
}
