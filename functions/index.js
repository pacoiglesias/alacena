/**
 * ALACENA Enterprise - Cloud Functions
 * Consumo predictivo, alertas de stock y búsqueda EAN.
 *
 * MODELO DE DATOS REAL de la app (colecciones top-level, sin `workspaces/`):
 * - products: { id, name, zone, category, quantity, unit, minStock,
 *     idealStock, unitPriceMxn, store, barcode, householdId, householdName,
 *     burnRateWeekly? }
 *     Stock bajo en la app: quantity <= minStock (App.jsx,
 *     handleAutoGenerateShoppingList / InventoryView).
 * - shopping_list: { id, name, quantity, unit, department, store,
 *     targetZone, estimatedPriceMxn, householdId, householdName,
 *     currency, checked, source?, createdAt, updatedAt }
 *     La app deduce duplicados por sameStockItem (misma casa + misma
 *     unidad normalizada + nombre equivalente; si ambos traen barcode,
 *     manda el barcode), NO por itemId. El sameStockItem de abajo es un
 *     puerto fiel del de la app: ver la nota «CAUSA RAÍZ 3.11.0».
 * - audit_logs: bitácora forense de TEXTO { id, timestamp (ISO), staff,
 *     action, description, details, householdId, householdName }.
 *     Los consumos se registran con acción CONSUMO_STOCK pero SIN itemId
 *     ni quantityDelta, así que el cron NO puede atribuir consumos por
 *     producto desde audit_logs. Usa los niveles de stock y, cuando la
 *     app lo escribe en el producto, burnRateWeekly.
 * - global_ean_cache: catálogo maestro de códigos de barras (top-level).
 *
 * El modelo anterior (workspaces/{id}/inventory, workspaces/{id}/audit_logs
 * con acción SCAN_CONSUME, trigger workspaces/{id}/inventory/{itemId}) era
 * legado: el frontend no tiene ninguna referencia a `workspaces/` y la app
 * nunca escribe ahí, así que el cron no generaba sugerencias y el trigger
 * nunca se disparaba. Reescritura 6-nov-2026 al modelo real.
 *
 * PENDIENTE antes de fusionar: confirmar en Firebase Console que no hay
 * datos activos en `workspaces/` (la sesión de Firebase CLI de esta VM
 * está caducada: el refresh token devuelve invalid_grant/invalid_rapt y
 * no se pudo comprobar Firestore desde aquí).
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

admin.initializeApp();
const db = getFirestore();

const REGION = "us-central1";
const EAN_ALLOWED_ORIGIN = "https://alacena.cobertores.com";
const DEFAULT_HOUSEHOLD_ID = "house-1";
const DEFAULT_HOUSEHOLD_NAME = "Casa México";
const DEFAULT_CURRENCY = "MXN";
/** Firestore permite 500 escrituras por batch; se trocea en 400. */
const BATCH_MAX_WRITES = 400;
/** Días restantes para considerar urgente una sugerencia predictiva. */
const PREDICTIVE_DAYS_THRESHOLD = 3;

// --- utilidades -----------------------------------------------------------

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

function toNum(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Puerto fiel de normalizeItemName de la app
 * (frontend/src/utils/deduplication.js). NO reinventar: la deduplicación
 * de las funciones tiene que coincidir con la de la app, o ambas partes
 * discrepan sobre si un producto «ya está en la lista».
 */
function normalizeItemName(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos (á -> a, é -> e)
    .replace(/[°º]/g, "") // Símbolos de grado y ordinales (5° -> 5)
    .replace(/[^\w\s]/g, " ") // Signos de puntuación y paréntesis
    .trim()
    .replace(/\s+/g, " "); // Colapsar espacios múltiples
}

/**
 * Puerto fiel de areItemsEquivalent de la app
 * (frontend/src/utils/deduplication.js): igualdad normalizada o igualdad
 * tras pasar cada palabra a singular (con su mapa de casos comunes y la
 * regla ces -> z: «nueces» equivale a «nuez», «peces» a «pez»).
 * La normalización anterior de functions/index.js singularizaba distinto
 * («nueces» -> «nuec», palabras de 3 letras acabadas en s -> sin s) y
 * duplicaba artículos que la app ya tenía en la lista.
 */
function areItemsEquivalent(nameA = "", nameB = "") {
  const normA = normalizeItemName(nameA);
  const normB = normalizeItemName(nameB);
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  const toSingular = (w) => {
    const common = {
      tomates: "tomate", jitomates: "jitomate", chiles: "chile",
      elotes: "elote", aguacates: "aguacate", aceites: "aceite",
      quesos: "queso", huevos: "huevo",
    };
    if (common[w]) return common[w];
    if (w.endsWith("ces")) return w.slice(0, -3) + "z"; // peces -> pez
    if (w.endsWith("es") && w.length > 4) return w.slice(0, -2);
    if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) return w.slice(0, -1);
    return w;
  };

  const singA = normA.split(" ").map(toSingular).join(" ");
  const singB = normB.split(" ").map(toSingular).join(" ");
  return singA === singB;
}

/**
 * Puerto fiel de sameStockItem de la app
 * (frontend/src/utils/householdShopping.js).
 *
 * CAUSA RAÍZ 3.11.0: la versión anterior ignoraba el barcode y declaraba
 * «ya está en la lista» a todo artículo con el mismo nombre normalizado y
 * la misma unidad. En la app, si AMBOS artículos traen barcode, la
 * identidad es el barcode: con otro barcode es OTRO artículo (pasa con
 * los barcodes sintéticos «ALC-…» que la app genera al dar de alta
 * productos desde compras/escáner y con presentaciones distintas del
 * mismo producto). Resultado: un producto en su mínimo (p. ej. 0,6 kg
 * con mínimo 1 en house-1) que en la app NO estaba en la lista nunca
 * entraba por ninguna de las dos vías — la alerta y el cron comparten
 * este sameStockItem — y el fallo era silencioso: ambas funciones
 * «funcionaban» y devolvían 0 sugerencias.
 */
function sameStockItem(a, b) {
  const houseA = a.householdId || DEFAULT_HOUSEHOLD_ID;
  const houseB = b.householdId || DEFAULT_HOUSEHOLD_ID;
  return (
    houseA === houseB &&
    normalizeItemName(a.unit || "piezas") === normalizeItemName(b.unit || "piezas") &&
    (a.barcode && b.barcode
      ? String(a.barcode) === String(b.barcode)
      : areItemsEquivalent(a.name, b.name))
  );
}

/** Dígito de control EAN/UPC (peso 3,1 alternando desde la derecha). */
function eanCheckDigitValid(code) {
  const digits = code.slice(0, -1).split("").reverse();
  let sum = 0;
  digits.forEach((d, i) => {
    sum += Number(d) * (i % 2 === 0 ? 3 : 1);
  });
  const check = (10 - (sum % 10)) % 10;
  return check === Number(code[code.length - 1]);
}

/** EAN-8, UPC-A (12) o EAN-13 con dígito de control válido. */
function isValidBarcode(code) {
  if (typeof code !== "string") return false;
  const clean = code.trim();
  if (!/^\d{8}$|^\d{12}$|^\d{13}$/.test(clean)) return false;
  return eanCheckDigitValid(clean);
}

/** Confirma escrituras en trozos de BATCH_MAX_WRITES como mucho. */
async function commitOpsInChunks(ops) {
  let commits = 0;
  let batch = db.batch();
  let count = 0;
  for (const op of ops) {
    if (count >= BATCH_MAX_WRITES) {
      await batch.commit();
      commits += 1;
      batch = db.batch();
      count = 0;
    }
    if (op.type === "set") batch.set(op.ref, op.data);
    else batch.update(op.ref, op.data);
    count += 1;
  }
  if (count > 0) {
    await batch.commit();
    commits += 1;
  }
  return commits;
}

/** Nombre y moneda de la casa (defaults de la app si no hay documento). */
async function loadHouseholdMeta(householdId) {
  try {
    const snap = await db.collection("households").doc(householdId).get();
    if (snap.exists) {
      const data = snap.data() || {};
      return {
        householdName: data.name || DEFAULT_HOUSEHOLD_NAME,
        currency: data.currency || DEFAULT_CURRENCY,
      };
    }
  } catch (err) {
    console.warn(`loadHouseholdMeta: no se pudo leer households/${householdId}:`, err.message);
  }
  return { householdName: DEFAULT_HOUSEHOLD_NAME, currency: DEFAULT_CURRENCY };
}

/**
 * Lista de la compra de una casa. Se filtra por householdId en la consulta
 * y por `checked` en memoria: dos filtros de igualdad necesitarían un
 * índice compuesto en Firestore.
 */
async function loadHouseholdShoppingList(householdId) {
  const snap = await db
    .collection("shopping_list")
    .where("householdId", "==", householdId)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
}

/** Sugerencia con la forma exacta que usa la app (handleAddShoppingItem). */
function buildSuggestionDoc({ id, product, householdName, currency, source }) {
  const qty = toNum(product.quantity, 0);
  const ideal = toNum(product.idealStock, 5);
  return {
    id,
    name: product.name,
    barcode: product.barcode || "",
    unit: product.unit || "piezas",
    // Como handleAutoGenerateShoppingList: ideal - existencia, mínimo 0.01.
    quantity: Math.max(0.01, round3(ideal - qty)),
    department: product.category || "Abarrotes",
    store: product.store || "Supermercado",
    targetZone: product.zone || "Alacena Principal",
    estimatedPriceMxn: Math.max(0, toNum(product.unitPriceMxn, 0)),
    householdId: product.householdId || DEFAULT_HOUSEHOLD_ID,
    householdName: householdName || DEFAULT_HOUSEHOLD_NAME,
    currency: currency || DEFAULT_CURRENCY,
    checked: false,
    source,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

/**
 * Evalúa los productos de una casa: sugiere los que se van a agotar y, si
 * el producto trae burnRateWeekly, actualiza sus métricas de consumo.
 * Devuelve cuántas sugerencias generó.
 */
async function processHousehold(householdId, products) {
  const meta = await loadHouseholdMeta(householdId);
  const existingItems = await loadHouseholdShoppingList(householdId);
  const ops = [];
  let suggestionsCount = 0;

  for (const { ref, data } of products) {
    const qty = toNum(data.quantity, 0);
    const min = toNum(data.minStock, 0);
    const burnRateWeekly = toNum(data.burnRateWeekly, NaN);
    const hasBurnRate = Number.isFinite(burnRateWeekly) && burnRateWeekly > 0;
    const daysLeft = hasBurnRate ? qty / (burnRateWeekly / 7) : null;

    // Urgente como la app: stock <= mínimo, o <= 3 días según el ritmo.
    const needsSuggestion =
      (daysLeft !== null && daysLeft <= PREDICTIVE_DAYS_THRESHOLD) || qty <= min;

    if (hasBurnRate) {
      ops.push({
        type: "update",
        ref,
        data: {
          dias_estimados_restantes: Math.round(daysLeft * 10) / 10,
          run_rate_diario: Math.round((burnRateWeekly / 7) * 100) / 100,
          updatedAt: FieldValue.serverTimestamp(),
        },
      });
    }

    if (!needsSuggestion) continue;
    if (!data.name || !String(data.name).trim()) continue;

    const alreadyListed = existingItems.some(
      (item) => !item.checked && sameStockItem(item, data)
    );
    if (alreadyListed) continue;

    const newRef = db.collection("shopping_list").doc();
    ops.push({
      type: "set",
      ref: newRef,
      data: buildSuggestionDoc({
        id: newRef.id,
        product: data,
        householdName: meta.householdName,
        currency: meta.currency,
        source: "AI_PREDICTIVE",
      }),
    });
    // Evita duplicar dentro de esta misma pasada.
    existingItems.push({ ...ops[ops.length - 1].data, checked: false });
    suggestionsCount += 1;
  }

  await commitOpsInChunks(ops);
  return suggestionsCount;
}

/**
 * 1. Consumo Predictivo (Cron Diario a las 03:00 AM)
 * Recorre los productos por casa y sugiere a la lista de la compra los que
 * están en mínimo o se agotan en <= 3 días según su ritmo semanal.
 * Cada casa se procesa aislada: si una falla, las demás siguen.
 */
exports.predictiveConsumptionCron = onSchedule(
  {
    schedule: "every day 03:00",
    timeZone: "America/Mexico_City",
    region: REGION,
    memory: "256MiB",
  },
  async () => {
    console.log("Iniciando análisis de consumo predictivo multi-tenant...");
    const productsSnap = await db.collection("products").get();

    const byHousehold = new Map();
    for (const docSnap of productsSnap.docs) {
      const data = docSnap.data() || {};
      const householdId = data.householdId || DEFAULT_HOUSEHOLD_ID;
      if (!byHousehold.has(householdId)) byHousehold.set(householdId, []);
      byHousehold.get(householdId).push({ id: docSnap.id, ref: docSnap.ref, data });
    }

    let suggestionsTotal = 0;
    for (const [householdId, items] of byHousehold) {
      try {
        const count = await processHousehold(householdId, items);
        suggestionsTotal += count;
        console.log(`Casa ${householdId}: generadas ${count} sugerencias predictivas.`);
      } catch (err) {
        console.error(`Casa ${householdId}: falló el análisis predictivo:`, err);
      }
    }

    return { success: true, suggestions: suggestionsTotal };
  }
);

/**
 * 2. Disparador de Stock Bajo en Tiempo Real
 * Cuando un producto de `products` queda en su mínimo o por debajo, lo
 * añade a la lista de compras de su casa si aún no está (sin comprar).
 */
exports.onStockLevelAlert = onDocumentWritten(
  { document: "products/{productId}", region: REGION },
  async (event) => {
    const after = event.data && event.data.after;
    if (!after || !after.exists) return; // Eliminación

    const data = after.data() || {};
    if (!data.name || !String(data.name).trim()) return;

    const currentQty = toNum(data.quantity, 0);
    const minAlert = toNum(data.minStock, 0);
    if (currentQty > minAlert) return;

    const householdId = data.householdId || DEFAULT_HOUSEHOLD_ID;
    const existingItems = await loadHouseholdShoppingList(householdId);
    const alreadyListed = existingItems.some(
      (item) => !item.checked && sameStockItem(item, data)
    );
    if (alreadyListed) return;

    const meta = await loadHouseholdMeta(householdId);
    const newRef = db.collection("shopping_list").doc();
    await newRef.set(
      buildSuggestionDoc({
        id: newRef.id,
        product: data,
        householdName: meta.householdName,
        currency: meta.currency,
        source: "LOW_STOCK_RULE",
      })
    );
    console.log(
      `Stock bajo: ${data.name} (${currentQty} <= ${minAlert}) añadido a la lista de ${householdId}.`
    );
  }
);

/**
 * Exige un ID token de Firebase válido con el claim alacenaAccess.
 * Devuelve el token decodificado, o responde 401/403 y devuelve null.
 * (AL-2, 7-nov-2026: antes la función era pública; solo CORS la
 * "protegía" y CORS no es autenticación — cualquier cliente fuera del
 * navegador lo ignora. El frontend hoy ni llama a esta función; si se
 * vuelve a usar desde la app, el cliente debe enviar
 * `Authorization: Bearer <idToken>`.)
 */
async function requireHomeAccess(req, res) {
  const header = req.headers && req.headers.authorization;
  const match =
    typeof header === "string" ? header.match(/^Bearer (.+)$/) : null;
  if (!match) {
    res.status(401).json({
      error: "Falta el token de autenticación (Authorization: Bearer)",
    });
    return null;
  }
  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(match[1]);
  } catch (error) {
    console.warn(
      "globalEanLookup: token inválido",
      error.code || error.message
    );
    res.status(401).json({ error: "Token de autenticación inválido" });
    return null;
  }
  if (decoded == null || decoded.alacenaAccess !== true) {
    res.status(403).json({ error: "La cuenta no tiene acceso a Alacena" });
    return null;
  }
  return decoded;
}

/**
 * 3. Endpoint de Fallback Global EAN / UPC
 * Solo acepta EAN-8, UPC-A o EAN-13 con dígito de control válido, solo
 * responde a alacena.cobertores.com (CORS) y solo a cuentas autenticadas
 * con el claim alacenaAccess (verifyIdToken, ver requireHomeAccess).
 */
exports.globalEanLookup = onRequest(
  { region: REGION, cors: [EAN_ALLOWED_ORIGIN] },
  async (req, res) => {
    const caller = await requireHomeAccess(req, res);
    if (caller === null) return;
    const barcode = req.query && req.query.barcode;
    if (barcode === undefined || barcode === null || barcode === "") {
      return res.status(400).json({ error: "Falta el parámetro barcode" });
    }
    if (!isValidBarcode(barcode)) {
      return res.status(400).json({
        error: "Parámetro barcode inválido: se espera EAN-8, UPC-A o EAN-13 con dígito de control válido",
      });
    }

    // Consulta en catálogo maestro cacheado de Firestore
    const cached = await db.collection("global_ean_cache").doc(barcode).get();
    if (cached.exists) {
      return res.json({ source: "CACHE", product: cached.data() });
    }

    return res.json({
      source: "NOT_FOUND",
      requires_metadata_update: true,
      barcode,
    });
  }
);
