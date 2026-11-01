// Prueba automatizada de auditoría para el parser de listas de compras
import { parseRawShoppingText } from './frontend/src/services/smartListParser.js';

const mockExistingProducts = [
  { name: 'Jitomate Saladet', category: 'Frutas & Verduras', unit: 'kg', price: 34.50, zone: 'Alacena Principal', store: 'City Market' },
  { name: 'Aceite de Oliva Extra Virgen 1L', category: 'Aceites & Condimentos', unit: 'litros', price: 345.00, zone: 'Alacena Principal', store: 'Costco' },
  { name: 'Vino Tinto Reserva Cabernet', category: 'Vinos & Licores', unit: 'botellas', price: 4850.00, zone: 'Cava Subterránea', store: 'City Market' },
  { name: 'Leche Entera Pasteurizada 1L', category: 'Lácteos & Huevos', unit: 'litros', price: 29.50, zone: 'Refrigerador', store: 'Supermercado' },
];

console.log('=== INICIANDO AUDITORÍA Y TEST DE EXTRACCIÓN DE DATOS ===\n');

// Caso 1: Formato WhatsApp con viñetas y lenguaje cotidiano mexicano
const testCaseWhatsApp = `
Hola Don Paco, esto falta en la cocina:
- 2 kg de jitomate
- 1 botella de aceite de oliva
- 1/2 kg de queso manchego
- 4 aguacates hass
- [Costco] 3 paquetes de papel de baño
- 2 botellas de vino tinto
- 1.5 l de leche entera
`;

console.log('🧪 TEST 1: Parseo de mensaje de WhatsApp con viñetas y fracciones...');
const result1 = parseRawShoppingText(testCaseWhatsApp, mockExistingProducts);
console.log(`Artículos detectados: ${result1.length}`);
result1.forEach((item, idx) => {
  console.log(`  ${idx + 1}. [${item.quantity} ${item.unit}] ${item.name} | Depto: ${item.department} | Tienda: ${item.store} | Zona: ${item.targetZone}`);
});

// Verificaciones
if (result1.length !== 7) throw new Error(`Esperaba 7 artículos, obtuvo ${result1.length}`);
if (result1[2].quantity !== 0.5) throw new Error(`Esperaba 0.5 para 1/2 kg, obtuvo ${result1[2].quantity}`);
if (result1[4].store !== 'Costco') throw new Error(`Esperaba tienda Costco, obtuvo ${result1[4].store}`);

// Caso 2: Ticket escaneado con OCR (con ruido y mayúsculas)
const testCaseTicket = `
SUPERMERCADO SELECTO
7501000111223 HARINA DE TRIGO 1 KG
ACEITE OLIVA 1 LITRO
AGUACATE HASS 4 PZAS
ATUN EN AGUA 6 LATAS
CARNE RIBEYE 2 KG
`;

console.log('\n🧪 TEST 2: Parseo de líneas de Ticket / OCR de supermercado...');
const result2 = parseRawShoppingText(testCaseTicket, mockExistingProducts);
console.log(`Artículos detectados: ${result2.length}`);
result2.forEach((item, idx) => {
  console.log(`  ${idx + 1}. [${item.quantity} ${item.unit}] ${item.name} | Depto: ${item.department}`);
});

if (result2.length < 5) throw new Error(`Esperaba al menos 5 artículos, obtuvo ${result2.length}`);

// Caso 3: Lista separada por comas en un solo renglón
const testCaseCommas = "3 manzanas gala, 2 litros de agua mineral, 1 caja de te verde, 5 limones";
console.log('\n🧪 TEST 3: Lista rápida en un solo renglón separada por comas...');
const result3 = parseRawShoppingText(testCaseCommas, mockExistingProducts);
console.log(`Artículos detectados: ${result3.length}`);
result3.forEach((item, idx) => {
  console.log(`  ${idx + 1}. [${item.quantity} ${item.unit}] ${item.name} | Cant: ${item.quantity} ${item.unit}`);
});

if (result3.length !== 4) throw new Error(`Esperaba 4 artículos, obtuvo ${result3.length}`);

console.log('\n✅ ¡TODOS LOS TESTS DE AUDITORÍA DE EXTRACCIÓN PASARON AL 100%!');
