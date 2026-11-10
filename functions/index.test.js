/**
 * Tests de las Cloud Functions de Alacena (modelo real top-level).
 * Sin dependencias externas: node:test + Firestore en memoria y módulos
 * de firebase-admin / firebase-functions simulados.
 * Ejecutar: node --test functions/index.test.js
 */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("module");

const originalLoad = Module._load;

// --- Firestore falso en memoria -------------------------------------------

class FakeDocSnap {
  constructor(id, data, ref) {
    this.id = id;
    this._data = data;
    this.ref = ref;
    this.exists = data !== null && data !== undefined;
  }
  data() {
    return this._data ? { ...this._data } : undefined;
  }
}

class FakeDocRef {
  constructor(collection, id) {
    this._collection = collection;
    this.id = id;
  }
  async get() {
    const failKey = `${this._collection.name}/${this.id}`;
    if (this._collection._db._failDocs.has(failKey)) {
      throw new Error(`firestore simulado: fallo al leer ${failKey}`);
    }
    const data = this._collection._docs.get(this.id);
    return new FakeDocSnap(this.id, data === undefined ? null : data, this);
  }
  async set(data) {
    this._collection._docs.set(this.id, { ...data });
  }
  async update(data) {
    const cur = this._collection._docs.get(this.id) || {};
    this._collection._docs.set(this.id, { ...cur, ...data });
  }
  async delete() {
    this._collection._docs.delete(this.id);
  }
}

class FakeQuery {
  constructor(collection, filters = []) {
    this._collection = collection;
    this._filters = filters;
  }
  where(field, op, value) {
    return new FakeQuery(this._collection, [...this._filters, { field, op, value }]);
  }
  async get() {
    for (const f of this._filters) {
      const key = `${this._collection.name}:${f.field}:${f.value}`;
      if (this._collection._db._failQueries.has(key)) {
        throw new Error(`firestore simulado: fallo en consulta ${key}`);
      }
    }
    const docs = [];
    for (const [id, data] of this._collection._docs) {
      const ok = this._filters.every((f) => {
        if (f.op === "==") return data[f.field] === f.value;
        if (f.op === ">=") return data[f.field] >= f.value;
        return true;
      });
      if (ok) docs.push(new FakeDocSnap(id, data, new FakeDocRef(this._collection, id)));
    }
    return { docs, empty: docs.length === 0 };
  }
}

class FakeCollection {
  constructor(db, name) {
    this._db = db;
    this.name = name;
    this._docs = new Map();
    this._autoId = 0;
  }
  doc(id) {
    if (!id) id = `auto-${++this._autoId}`;
    return new FakeDocRef(this, id);
  }
  async add(data) {
    const ref = this.doc();
    await ref.set(data);
    return ref;
  }
  where(field, op, value) {
    return new FakeQuery(this, [{ field, op, value }]);
  }
  async get() {
    const docs = [...this._docs].map(
      ([id, data]) => new FakeDocSnap(id, data, new FakeDocRef(this, id))
    );
    return { docs, empty: docs.length === 0 };
  }
}

class FakeBatch {
  constructor(db) {
    this._db = db;
    this.ops = [];
  }
  set(ref, data) {
    this.ops.push({ type: "set", ref, data });
    return this;
  }
  update(ref, data) {
    this.ops.push({ type: "update", ref, data });
    return this;
  }
  async commit() {
    for (const op of this.ops) {
      if (op.type === "set") await op.ref.set(op.data);
      else await op.ref.update(op.data);
    }
    this._db._commits.push(this.ops.length);
    this.ops = [];
  }
}

class FakeFirestore {
  constructor() {
    this._collections = new Map();
    this._commits = [];
    this._accessed = new Set();
    this._failQueries = new Set();
    this._failDocs = new Set();
  }
  collection(name) {
    this._accessed.add(name);
    if (!this._collections.has(name)) {
      this._collections.set(name, new FakeCollection(this, name));
    }
    return this._collections.get(name);
  }
  batch() {
    return new FakeBatch(this);
  }
}

// --- carga de index.js con los módulos de Firebase simulados -------------

let fakeDb;
let captured;

function loadFunctions() {
  delete require.cache[require.resolve("./index.js")];
  fakeDb = new FakeFirestore();
  captured = {};
  const fakeAdmin = { initializeApp: () => {} };
  const fakeFirestoreModule = {
    getFirestore: () => fakeDb,
    FieldValue: { serverTimestamp: () => ({ __serverTimestamp: true }) },
  };
  // verifyIdToken simulado (AL-2): solo "token-valido" trae el claim.
  const fakeAuthModule = {
    getAuth: () => ({
      verifyIdToken: async (token) => {
        if (token === "token-valido") {
          return { uid: "test-user", alacenaAccess: true };
        }
        if (token === "token-sin-acceso") {
          return { uid: "test-user", alacenaAccess: false };
        }
        const error = new Error("Token inválido");
        error.code = "auth/invalid-id-token";
        throw error;
      },
    }),
  };
  Module._load = function (request, ...args) {
    if (request === "firebase-admin") return fakeAdmin;
    if (request === "firebase-admin/firestore") return fakeFirestoreModule;
    if (request === "firebase-admin/auth") return fakeAuthModule;
    if (request === "firebase-functions/v2/scheduler") {
      return {
        onSchedule: (opts, handler) => {
          captured.scheduleOpts = opts;
          captured.cron = handler;
          return handler;
        },
      };
    }
    if (request === "firebase-functions/v2/firestore") {
      return {
        onDocumentWritten: (opts, handler) => {
          captured.triggerOpts = opts;
          captured.alert = handler;
          return handler;
        },
      };
    }
    if (request === "firebase-functions/v2/https") {
      return {
        onRequest: (opts, handler) => {
          captured.requestOpts = opts;
          captured.ean = handler;
          return handler;
        },
      };
    }
    return originalLoad.call(this, request, ...args);
  };
  try {
    return require("./index.js");
  } finally {
    Module._load = originalLoad;
  }
}

// --- ayudas ---------------------------------------------------------------

async function seedProduct(data) {
  const ref = fakeDb.collection("products").doc(data.id);
  await ref.set(data);
  return ref;
}

async function seedShoppingItem(data) {
  const ref = fakeDb.collection("shopping_list").doc(data.id);
  await ref.set(data);
  return ref;
}

async function listShopping() {
  const snap = await fakeDb.collection("shopping_list").get();
  return snap.docs.map((d) => d.data());
}

function makeRes() {
  return {
    _code: 200,
    _body: null,
    status(code) {
      this._code = code;
      return this;
    },
    json(obj) {
      this._body = obj;
      return this;
    },
  };
}

// --- opciones de despliegue -----------------------------------------------

test("las 3 funciones se registran con región us-central1 y rutas reales", () => {
  loadFunctions();
  assert.equal(captured.scheduleOpts.region, "us-central1");
  assert.equal(captured.scheduleOpts.schedule, "every day 03:00");
  assert.equal(captured.scheduleOpts.timeZone, "America/Mexico_City");
  assert.equal(captured.triggerOpts.document, "products/{productId}");
  assert.equal(captured.triggerOpts.region, "us-central1");
  assert.equal(captured.requestOpts.region, "us-central1");
  assert.ok(captured.requestOpts.cors.includes("https://alacena.cobertores.com"));
});

// --- cron predictivo ------------------------------------------------------

test("cron: sugiere el producto en mínimo con la forma de la app y no toca workspaces/ ni audit_logs", async () => {
  loadFunctions();
  await seedProduct({
    id: "prod-1", name: "Harina de Trigo", zone: "Alacena Principal",
    category: "Abarrotes", quantity: 1, unit: "kg", minStock: 4,
    idealStock: 15, unitPriceMxn: 38.5, store: "Costco",
    householdId: "house-1",
  });
  const result = await captured.cron();
  assert.deepEqual(result, { success: true, suggestions: 1 });
  const items = await listShopping();
  assert.equal(items.length, 1);
  assert.equal(items[0].name, "Harina de Trigo");
  assert.equal(items[0].quantity, 14); // ideal 15 - existencia 1
  assert.equal(items[0].unit, "kg");
  assert.equal(items[0].department, "Abarrotes");
  assert.equal(items[0].store, "Costco");
  assert.equal(items[0].targetZone, "Alacena Principal");
  assert.equal(items[0].estimatedPriceMxn, 38.5);
  assert.equal(items[0].householdId, "house-1");
  assert.equal(items[0].checked, false);
  assert.equal(items[0].source, "AI_PREDICTIVE");
  assert.ok(!fakeDb._accessed.has("workspaces"));
  assert.ok(!fakeDb._accessed.has("audit_logs"));
});

test("cron: no duplica si el producto ya está en la lista sin comprar; sí sugiere si ya está comprado", async () => {
  loadFunctions();
  await seedProduct({
    id: "prod-1", name: "Aceite de Oliva", quantity: 1, unit: "litros",
    minStock: 2, idealStock: 6, householdId: "house-1",
  });
  await seedShoppingItem({
    id: "shop-1", name: "Aceite de Oliva", quantity: 2, unit: "litros",
    householdId: "house-1", checked: false,
  });
  let result = await captured.cron();
  assert.equal(result.suggestions, 0);
  assert.equal((await listShopping()).length, 1);

  // Marcado como comprado: vuelve a sugerir.
  await fakeDb.collection("shopping_list").doc("shop-1").update({ checked: true });
  result = await captured.cron();
  assert.equal(result.suggestions, 1);
  assert.equal((await listShopping()).length, 2);
});

test("cron: con burnRateWeekly escribe días restantes y ritmo; sugiere solo si <= 3 días", async () => {
  loadFunctions();
  await seedProduct({
    id: "prod-1", name: "Leche", quantity: 7, unit: "litros", minStock: 2,
    idealStock: 10, burnRateWeekly: 7, householdId: "house-1",
  });
  await seedProduct({
    id: "prod-2", name: "Huevos", quantity: 2, unit: "piezas", minStock: 5,
    idealStock: 12, burnRateWeekly: 7, householdId: "house-1",
  });
  const result = await captured.cron();
  assert.equal(result.suggestions, 1); // solo Huevos (2 días); Leche tiene 7 días
  const leche = await fakeDb.collection("products").doc("prod-1").get();
  assert.equal(leche.data().dias_estimados_restantes, 7);
  assert.equal(leche.data().run_rate_diario, 1);
  const huevos = await fakeDb.collection("products").doc("prod-2").get();
  assert.equal(huevos.data().dias_estimados_restantes, 2);
  const items = await listShopping();
  assert.equal(items.length, 1);
  assert.equal(items[0].name, "Huevos");
});

test("cron: producto sano no genera escrituras", async () => {
  loadFunctions();
  await seedProduct({
    id: "prod-1", name: "Arroz", quantity: 20, unit: "kg", minStock: 2,
    idealStock: 10, householdId: "house-1",
  });
  const result = await captured.cron();
  assert.deepEqual(result, { success: true, suggestions: 0 });
  assert.equal(fakeDb._commits.length, 0);
  assert.equal((await listShopping()).length, 0);
});

test("cron: campos inválidos o ausentes no rompen la pasada", async () => {
  loadFunctions();
  await seedProduct({ id: "prod-1", name: "Raro", householdId: "house-1" });
  await seedProduct({
    id: "prod-2", name: "Texto", quantity: "3", minStock: "2",
    householdId: "house-1",
  });
  const result = await captured.cron();
  assert.equal(result.success, true);
  // "Raro" sin cantidad ni mínimo: 0 <= 0, se sugiere como la app (vacío).
  // "Texto": cantidad 3 > mínimo 2, no se sugiere.
  assert.equal(result.suggestions, 1);
});

test("cron: trocea los batch en 400 escrituras como máximo", async () => {
  loadFunctions();
  for (let i = 0; i < 401; i++) {
    await seedProduct({
      id: `prod-${i}`, name: `Producto ${i}`, quantity: 0, unit: "piezas",
      minStock: 2, idealStock: 5, householdId: "house-1",
    });
  }
  const result = await captured.cron();
  assert.equal(result.suggestions, 401);
  assert.deepEqual(fakeDb._commits, [400, 1]);
  assert.equal((await listShopping()).length, 401);
});

test("cron: si una casa falla, las demás se procesan igual", async () => {
  loadFunctions();
  fakeDb._failQueries.add("shopping_list:householdId:house-bad");
  await seedProduct({
    id: "prod-1", name: "A", quantity: 0, minStock: 2, householdId: "house-bad",
  });
  await seedProduct({
    id: "prod-2", name: "B", quantity: 0, minStock: 2, householdId: "house-1",
  });
  const result = await captured.cron();
  assert.equal(result.success, true);
  assert.equal(result.suggestions, 1);
  const items = await listShopping();
  assert.equal(items.length, 1);
  assert.equal(items[0].name, "B");
});

// --- alerta de stock ------------------------------------------------------

test("alerta: stock bajo añade a la lista; stock suficiente, borrado o sin nombre no hacen nada", async () => {
  loadFunctions();
  const lowAfter = {
    exists: true,
    data: () => ({
      name: "Café", quantity: 1, unit: "kg", minStock: 2, idealStock: 5,
      category: "Abarrotes", unitPriceMxn: 120, store: "Costco",
      zone: "Alacena Principal", householdId: "house-1",
    }),
  };
  await captured.alert({ params: { productId: "prod-1" }, data: { after: lowAfter } });
  let items = await listShopping();
  assert.equal(items.length, 1);
  assert.equal(items[0].name, "Café");
  assert.equal(items[0].quantity, 4); // ideal 5 - existencia 1
  assert.equal(items[0].source, "LOW_STOCK_RULE");

  // Repetir el mismo aviso no duplica.
  await captured.alert({ params: { productId: "prod-1" }, data: { after: lowAfter } });
  assert.equal((await listShopping()).length, 1);

  // Stock suficiente.
  const okAfter = { exists: true, data: () => ({ name: "Café", quantity: 9, minStock: 2, householdId: "house-1" }) };
  await captured.alert({ params: { productId: "prod-1" }, data: { after: okAfter } });
  assert.equal((await listShopping()).length, 1);

  // Borrado del documento.
  await captured.alert({ params: { productId: "prod-1" }, data: { after: { exists: false, data: () => undefined } } });
  assert.equal((await listShopping()).length, 1);

  // Sin nombre.
  const noName = { exists: true, data: () => ({ quantity: 0, minStock: 2, householdId: "house-1" }) };
  await captured.alert({ params: { productId: "prod-9" }, data: { after: noName } });
  assert.equal((await listShopping()).length, 1);
  items = await listShopping();
  assert.equal(items[0].name, "Café");
});

// --- regresión 3.11.0: stock bajo -> lista (caso 0,6 kg / mínimo 1) -------
// Fixtures inventados (ningún dato del hogar). El producto análogo al real:
// quantity 0.6 kg, minStock 1, casa house-1.

const REPRO_PRODUCT = {
  id: "prod-repro-311", name: "Queso Inventado de Prueba", quantity: 0.6,
  unit: "kg", minStock: 1, idealStock: 3, category: "Abarrotes",
  store: "Supermercado", zone: "Alacena Principal", unitPriceMxn: 50,
  barcode: "7509999999999", householdId: "house-1",
};

function reproAfter(product) {
  return { exists: true, data: () => ({ ...product }) };
}

test("regresión 3.11.0 cron: producto bajo mínimo (0,6 <= 1) sin estar en lista -> exactamente 1 sugerencia", async () => {
  loadFunctions();
  await seedProduct(REPRO_PRODUCT);
  const result = await captured.cron();
  assert.equal(result.suggestions, 1);
  const items = await listShopping();
  assert.equal(items.length, 1);
  assert.equal(items[0].name, "Queso Inventado de Prueba");
  assert.equal(items[0].quantity, 2.4); // ideal 3 - existencia 0.6
  assert.equal(items[0].source, "AI_PREDICTIVE");
  // Segunda pasada del cron: la sugerencia ya creada no se duplica.
  const again = await captured.cron();
  assert.equal(again.suggestions, 0);
  assert.equal((await listShopping()).length, 1);
});

test("regresión 3.11.0 alerta: producto bajo mínimo (0,6 <= 1) sin estar en lista -> exactamente 1 sugerencia", async () => {
  loadFunctions();
  await captured.alert({
    params: { productId: REPRO_PRODUCT.id },
    data: { after: reproAfter(REPRO_PRODUCT) },
  });
  const items = await listShopping();
  assert.equal(items.length, 1);
  assert.equal(items[0].name, "Queso Inventado de Prueba");
  assert.equal(items[0].quantity, 2.4);
  assert.equal(items[0].source, "LOW_STOCK_RULE");
  // Repetir el aviso no duplica.
  await captured.alert({
    params: { productId: REPRO_PRODUCT.id },
    data: { after: reproAfter(REPRO_PRODUCT) },
  });
  assert.equal((await listShopping()).length, 1);
});

test("regresión 3.11.0 causa raíz: mismo nombre/unidad pero OTRO barcode en lista NO cuenta como ya listado (como en la app)", async () => {
  // En la app (sameStockItem de householdShopping.js), si ambos artículos
  // traen barcode, la identidad es el barcode: otro barcode = otro artículo.
  // Las funciones ignoraban el barcode y saltaban el producto para siempre.
  loadFunctions();
  await seedProduct(REPRO_PRODUCT);
  await seedShoppingItem({
    id: "shop-otro-barcode", name: "Queso Inventado de Prueba", quantity: 1,
    unit: "kg", barcode: "7508888888888", householdId: "house-1", checked: false,
  });
  const result = await captured.cron();
  assert.equal(result.suggestions, 1);
  assert.equal((await listShopping()).length, 2);

  // Y la alerta en tiempo real, partiendo de la misma situación:
  loadFunctions();
  await seedShoppingItem({
    id: "shop-otro-barcode", name: "Queso Inventado de Prueba", quantity: 1,
    unit: "kg", barcode: "7508888888888", householdId: "house-1", checked: false,
  });
  await captured.alert({
    params: { productId: REPRO_PRODUCT.id },
    data: { after: reproAfter(REPRO_PRODUCT) },
  });
  assert.equal((await listShopping()).length, 2);
});

test("regresión 3.11.0: ya está en lista (mismo barcode) -> 0 sugerencias en cron y en alerta", async () => {
  loadFunctions();
  await seedProduct(REPRO_PRODUCT);
  await seedShoppingItem({
    id: "shop-mismo", name: "Queso Inventado de Prueba", quantity: 1,
    unit: "kg", barcode: "7509999999999", householdId: "house-1", checked: false,
  });
  const result = await captured.cron();
  assert.equal(result.suggestions, 0);
  await captured.alert({
    params: { productId: REPRO_PRODUCT.id },
    data: { after: reproAfter(REPRO_PRODUCT) },
  });
  assert.equal((await listShopping()).length, 1);
});

test("regresión 3.11.0: equivalencia de nombre como la app (Nueces en despensa, Nuez en lista) -> 0 sugerencias", async () => {
  // areItemsEquivalent de la app: "nueces" -> "nuez" (regla ces -> z).
  // La normalización propia de las funciones daba "nuec" != "nuez" y
  // duplicaba el artículo en la lista.
  loadFunctions();
  await seedProduct({
    id: "prod-nueces", name: "Nueces Inventadas", quantity: 0.6, unit: "kg",
    minStock: 1, idealStock: 3, barcode: "", householdId: "house-1",
  });
  await seedShoppingItem({
    id: "shop-nuez", name: "Nuez Inventada", quantity: 1, unit: "kg",
    barcode: "", householdId: "house-1", checked: false,
  });
  const result = await captured.cron();
  assert.equal(result.suggestions, 0);
  assert.equal((await listShopping()).length, 1);
});

test("regresión 3.11.0: producto sobre el mínimo (2,5 > 1) -> 0 sugerencias en cron y en alerta", async () => {
  loadFunctions();
  await seedProduct({ ...REPRO_PRODUCT, quantity: 2.5 });
  const result = await captured.cron();
  assert.equal(result.suggestions, 0);
  await captured.alert({
    params: { productId: REPRO_PRODUCT.id },
    data: { after: reproAfter({ ...REPRO_PRODUCT, quantity: 2.5 }) },
  });
  assert.equal((await listShopping()).length, 0);
});

// --- EAN ------------------------------------------------------------------

// Petición autenticada con el claim (AL-2): el resto de tests EAN la usan.
function authedReq(barcode) {
  return {
    headers: { authorization: "Bearer token-valido" },
    query: barcode === undefined ? {} : { barcode },
  };
}

test("ean: sin token -> 401; token inválido -> 401; token sin claim -> 403", async () => {
  loadFunctions();
  let res = makeRes();
  await captured.ean({ query: { barcode: "5449000000996" } }, res);
  assert.equal(res._code, 401);
  assert.match(res._body.error, /Falta el token/);

  res = makeRes();
  await captured.ean(
    { headers: { authorization: "Bearer token-roto" }, query: { barcode: "5449000000996" } },
    res
  );
  assert.equal(res._code, 401);
  assert.match(res._body.error, /inválido/);

  res = makeRes();
  await captured.ean(
    { headers: { authorization: "Bearer token-sin-acceso" }, query: { barcode: "5449000000996" } },
    res
  );
  assert.equal(res._code, 403);
  assert.match(res._body.error, /no tiene acceso/);
});

test("ean: falta el código -> 400; formato o dígito inválido -> 400", async () => {
  loadFunctions();
  let res = makeRes();
  await captured.ean(authedReq(undefined), res);
  assert.equal(res._code, 400);
  assert.match(res._body.error, /Falta el parámetro barcode/);

  for (const bad of ["ABC", "123", "5449000000997", "75012345678901", "  "]) {
    res = makeRes();
    await captured.ean(authedReq(bad), res);
    assert.equal(res._code, 400, `esperaba 400 para ${JSON.stringify(bad)}`);
    assert.match(res._body.error, /inválido/);
  }
});

test("ean: código válido en caché -> CACHE; válido sin caché -> NOT_FOUND", async () => {
  loadFunctions();
  await fakeDb.collection("global_ean_cache").doc("5449000000996").set({
    name: "Refresco de cola", brand: "Coca-Cola",
  });
  let res = makeRes();
  await captured.ean(authedReq("5449000000996"), res);
  assert.equal(res._code, 200);
  assert.equal(res._body.source, "CACHE");
  assert.equal(res._body.product.name, "Refresco de cola");

  res = makeRes();
  await captured.ean(authedReq("96385074"), res); // EAN-8 válido
  assert.equal(res._code, 200);
  assert.equal(res._body.source, "NOT_FOUND");
  assert.equal(res._body.requires_metadata_update, true);
  assert.equal(res._body.barcode, "96385074");

  res = makeRes();
  await captured.ean(authedReq("036000291452"), res); // UPC-A válido
  assert.equal(res._code, 200);
  assert.equal(res._body.source, "NOT_FOUND");
});
