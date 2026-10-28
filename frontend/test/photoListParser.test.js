import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePhotoList, normalizeHandwrittenName, splitPhotoListText } from '../src/services/photoListParser.js';

// Transcripción fiel de la foto de ejemplo (~/workspace/user/media_library/image/photo.jpg):
// 16 renglones manuscritos, 30 productos. La foto dice "foronja", no "toronja".
const PHOTO_TEXT = `- Espinaca, nopales, urugula
- calabazas, pimientos, aguacate
- pepino, chiles poblanos
- Zetas, coliflor, lechuga
- tomate rojo bola, sal
- Huevo, crema
- frutos rojos, foronja
- cebolla, cebollitas cambray
- esparragos, Limón
- chocolate abuelita
- elotitos tiernos, en frasco
- Fusilli
- Costillas de cerdo, Sabanitas
- queso panela, manchego
- fabuloso
- Mr. musculo.`;

const EXPECTED_NAMES = [
  'Espinaca', 'Nopales', 'Arúgula',
  'Calabazas', 'Pimientos', 'Aguacate',
  'Pepino', 'Chiles Poblanos',
  'Setas', 'Coliflor', 'Lechuga',
  'Tomate Rojo Bola', 'Sal',
  'Huevo', 'Crema',
  'Frutos Rojos', 'Toronja',
  'Cebolla', 'Cebollitas Cambray',
  'Espárragos', 'Limón',
  'Chocolate Abuelita',
  'Elotitos Tiernos',
  'Fusilli',
  'Costillas de Cerdo', 'Sabanitas',
  'Queso Panela', 'Manchego',
  'Fabuloso',
  'Mr. Músculo',
];

test('la foto de ejemplo produce los 30 productos, normalizados y en orden', () => {
  const items = parsePhotoList(PHOTO_TEXT);
  assert.equal(items.length, 30, items.map((i) => i.name).join(' | '));
  assert.deepEqual(items.map((i) => i.name), EXPECTED_NAMES);
});

test('las variantes manuscritas se normalizan', () => {
  assert.equal(normalizeHandwrittenName('urugula'), 'Arúgula');
  assert.equal(normalizeHandwrittenName('Zetas'), 'Setas');
  assert.equal(normalizeHandwrittenName('foronja'), 'Toronja');
  assert.equal(normalizeHandwrittenName('Mr. musculo.'), 'Mr. Músculo');
  assert.equal(normalizeHandwrittenName('esparragos'), 'Espárragos');
});

test('los departamentos de la foto caen donde deben', () => {
  const items = parsePhotoList(PHOTO_TEXT);
  const byName = new Map(items.map((i) => [i.name, i]));
  assert.equal(byName.get('Setas').department, 'Frutas & Verduras');
  assert.equal(byName.get('Arúgula').department, 'Frutas & Verduras');
  assert.equal(byName.get('Toronja').department, 'Frutas & Verduras');
  assert.equal(byName.get('Costillas de Cerdo').department, 'Carnes & Proteínas');
  assert.equal(byName.get('Manchego').department, 'Lácteos & Huevos');
  assert.equal(byName.get('Fabuloso').department, 'Limpieza & Hogar');
  assert.equal(byName.get('Mr. Músculo').department, 'Limpieza & Hogar');
});

test('el calificador tras la coma no crea un producto aparte', () => {
  assert.deepEqual(splitPhotoListText('elotitos tiernos, en frasco'), ['elotitos tiernos en frasco']);
  const items = parsePhotoList('elotitos tiernos, en frasco');
  assert.equal(items.length, 1);
  // "frasco" queda como unidad (botellas) y el nombre sin la preposición colgando.
  assert.equal(items[0].name, 'Elotitos Tiernos');
  assert.equal(items[0].unit, 'botellas');
});

test('cantidades y unidades dentro del renglón se respetan', () => {
  const items = parsePhotoList('2 kg tomate, sal');
  assert.equal(items.length, 2);
  assert.equal(items[0].name, 'Tomate');
  assert.equal(items[0].quantity, 2);
  assert.equal(items[0].unit, 'kg');
  assert.equal(items[1].name, 'Sal');
});

test('duplicados exactos se suman en vez de repetirse', () => {
  const items = parsePhotoList('sal\nsal');
  assert.equal(items.length, 1);
  assert.equal(items[0].quantity, 2);
});

test('basura de OCR (viñetas, letras sueltas) no crea productos', () => {
  const items = parsePhotoList('- - -\nE...\n- sal');
  assert.deepEqual(items.map((i) => i.name), ['Sal']);
});

test('texto vacío o sin productos no rompe', () => {
  assert.deepEqual(parsePhotoList(''), []);
  assert.deepEqual(parsePhotoList(null), []);
});
