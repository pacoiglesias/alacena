import { parseRawShoppingText } from './frontend/src/services/smartListParser.js';

const laComerReceiptText = `
laComer
Suc. Las Animas
Boulevard Atlixco, 3156
Fraccionamiento Las Animas
Puebla, Puebla C.P. 72400

Comercial City Fresko S. de R.L. de C.V.
Av. Insurgentes Sur # 1517 Mod 2
Col. San Jose Insurgentes
Ciudad de Mexico, CP 03900
RFC CCF121101KQ4
Regimen de las personas morales titulo II LISR

CANT SKU ARTICULO PRECIO REGULAR PRECIO PROMOCION TOTAL
1 425 REFRESCO COCA COLA  161.00  161.00
1 999 REFRESCO MUNDET 235  130.00  130.00
1 785 AGUA CANADA DRY 237  68.60  68.60
2 869 ALUBIAS CIDACOS 570  95.00  190.00
1 969 EMPZANIZADOR BIMBO  48.10  46.00  46.00
2 073 QUESO SAINT MAURE C  87.00  174.00
1 669 HARINA HUNGRY JACK  99.00  99.00
2 142 MINI PEPINO PERSA C  49.70  99.40
2 772 TOCINO AHUMADO EN P  137.50  275.00
2 123 ELOTE COCIDO LOS AZ  49.90  99.80
0.645 029 PORO  49.90  32.19
1 660 LECHUGA HIDROPÓNICA  54.90  54.90
1 162 REFRESCO MUNDET 355  22.00  22.00
1 944 ESPINACA VEGETALIST  46.80  46.80
3 101 ARROZ SOS 1 KG  68.00  204.00
1 056 FRIJOL VERDE VALLE  50.40  50.40
2 318 GALLETAS OKKO SUPER  33.00  66.00
0.615 050 CHILE POBLANO  64.90  39.91
1 211 MORCILLA DE CONDE D  109.50  109.50
1 823 GALLETA NESTLE 108  42.00  42.00
1 105 CHORIZO TIPO CONDE  133.50  133.50
0.66 745 CASTAÑA  425.00  298.00  196.68
SUBTOTAL 2340.68
1 Estacionamiento (Las Animas) 5.00
Boleto: 012198440768
Folio: 48663848
IVA 16% 52.63
IEPS 8% 3.11
TOTAL $ 2345.68
`;

const items = parseRawShoppingText(laComerReceiptText);
console.log(`Parsed ${items.length} items from ticket:\n`);
items.forEach((it, idx) => {
  console.log(`${idx + 1}. [${it.quantity} ${it.unit}] ${it.name} | Precio: $${it.realPrice} MXN | Tienda: ${it.store} | Dept: ${it.department}`);
});
