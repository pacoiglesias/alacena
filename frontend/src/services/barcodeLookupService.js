// Servicio de búsqueda de productos por código de barras (EAN / UPC / QR / Web)
// Combina: Catálogo Local (0ms) + Open Food Facts (MX y Mundial) + Open Beauty/Products Facts + UPCitemdb + Prefijos GS1 Internacionales

import { extractCodeFromScan } from '../utils/scanHelper';
import { findLearnedProduct } from './learningService';

export async function lookupBarcode(rawBarcode) {
  if (!rawBarcode) return null;
  const cleanCode = extractCodeFromScan(rawBarcode).toString().trim();
  if (!cleanCode) return null;

  // 0. Capa de Memoria Aprendida del Usuario (Productos ya memorizados previamente por la familia)
  const learned = findLearnedProduct(cleanCode);
  if (learned) {
    return {
      barcode: cleanCode,
      ...learned,
      source: 'MEMORIZED_HISTORY',
      googleSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(`${cleanCode} ${learned.name}`)}`,
      chedrauiSearchUrl: `https://www.chedraui.com.mx/search?text=${encodeURIComponent(cleanCode)}`,
    };
  }

  // 1. Catálogo Local de Códigos de Alta Frecuencia para respuesta instantánea (0ms)
  const LOCAL_BARCODE_CATALOG = {
    // Abarrotes y Harinas
    '7501000111223': { name: 'Harina de Trigo Selecta 1kg', category: 'Abarrotes', unit: 'kg', price: 38.50, zone: 'Alacena Principal', store: 'Costco', brand: 'Selecta' },
    '7501000101010': { name: 'Arroz Grano Grueso 1kg', category: 'Abarrotes', unit: 'kg', price: 36.00, zone: 'Alacena Principal', store: 'Costco', brand: 'Verde Valle' },
    '7501000202020': { name: 'Frijol Negro Selección 1kg', category: 'Abarrotes', unit: 'kg', price: 42.00, zone: 'Alacena Principal', store: 'Costco', brand: 'La Costeña' },
    '7501008000011': { name: 'Huevo Blanco San Juan (Cono 30 piezas)', category: 'Lácteos & Huevos', unit: 'paquetes', price: 92.00, zone: 'Alacena Principal', store: 'City Market', brand: 'San Juan' },
    '7501000333445': { name: 'Aceite de Oliva Extra Virgen 1L', category: 'Aceites & Condimentos', unit: 'litros', price: 345.00, zone: 'Alacena Principal', store: 'Costco', brand: 'Carbonell' },
    '7501000777889': { name: 'Corte Ribeye Prime Sonorense', category: 'Carnes & Proteínas', unit: 'kg', price: 680.00, zone: 'Cuarto Frío', store: 'City Market', brand: 'Rancho el 17' },
    '7501000999001': { name: 'Queso Parmigiano Reggiano 24 Meses', category: 'Lácteos & Quesos', unit: 'kg', price: 890.00, zone: 'Refrigerador', store: 'Costco', brand: 'Importación' },

    // Lácteos y Bebidas
    '7501055300076': { name: 'Leche Entera Pasteurizada 1L', category: 'Lácteos & Quesos', unit: 'litros', price: 29.50, zone: 'Refrigerador', store: 'Supermercado', brand: 'Lala' },
    '7501020513654': { name: 'Leche Deslactosada 1L', category: 'Lácteos & Quesos', unit: 'litros', price: 31.00, zone: 'Refrigerador', store: 'Supermercado', brand: 'Alpura' },
    '7501030490631': { name: 'Café Grano Tostado 500g', category: 'Bebidas Calientes', unit: 'kg', price: 195.00, zone: 'Alacena Principal', store: 'City Market', brand: 'Punta del Cielo' },
    '7501055301097': { name: 'Coca-Cola Original Refresco 600ml', category: 'Bebidas & Refrescos', unit: 'piezas', price: 19.50, zone: 'Refrigerador', store: 'OXXO / Super', brand: 'Coca-Cola' },
    '7501055310884': { name: 'Coca-Cola Sin Azúcar 600ml', category: 'Bebidas & Refrescos', unit: 'piezas', price: 19.50, zone: 'Refrigerador', store: 'Supermercado', brand: 'Coca-Cola' },
    '7501055365440': { name: 'Agua Purificada Ciel 1L', category: 'Bebidas & Refrescos', unit: 'piezas', price: 15.00, zone: 'Alacena Principal', store: 'OXXO / Super', brand: 'Ciel' },

    // Cava y Vinos
    '7501000555667': { name: 'Vino Tinto Reserva Cabernet Sauvignon', category: 'Vinos & Licores', unit: 'botellas', price: 4850.00, zone: 'Cava Principal', store: 'La Europea', brand: 'Casa Madero', isWine: true },
    '7501011105431': { name: 'Vino Tinto Gran Reserva Tempranillo', category: 'Vinos & Licores', unit: 'botellas', price: 1250.00, zone: 'Cava Principal', store: 'La Europea', brand: 'Marqués de Riscal', isWine: true },
    '7501055320012': { name: 'Cerveza Corona Extra 355ml', category: 'Vinos & Licores', unit: 'piezas', price: 24.00, zone: 'Refrigerador', store: 'Supermercado', brand: 'Corona' },
    '7501055330028': { name: 'Cerveza Modelo Especial 355ml', category: 'Vinos & Licores', unit: 'piezas', price: 26.00, zone: 'Refrigerador', store: 'Supermercado', brand: 'Grupo Modelo' },

    // Limpieza y Papel
    '7501008000022': { name: 'Papel Higiénico Regio Luxury (Paquete 12)', category: 'Limpieza & Hogar', unit: 'paquetes', price: 145.00, zone: 'Alacena Principal', store: 'Costco', brand: 'Regio' },
    '7501008000033': { name: 'Detergente Líquido Mas Color 5L', category: 'Limpieza & Hogar', unit: 'piezas', price: 210.00, zone: 'Alacena Principal', store: 'Costco', brand: 'Henkel' },
    '7501032900015': { name: 'Cloralex El Rendidor Blanqueador 1L', category: 'Limpieza & Hogar', unit: 'piezas', price: 22.00, zone: 'Alacena Principal', store: 'Supermercado', brand: 'Cloralex' },
    '7501000153401': { name: 'Jabón Líquido para Trastes Axion 750ml', category: 'Limpieza & Hogar', unit: 'piezas', price: 45.00, zone: 'Alacena Principal', store: 'Supermercado', brand: 'Colgate-Palmolive' },
  };

  if (LOCAL_BARCODE_CATALOG[cleanCode]) {
    const item = LOCAL_BARCODE_CATALOG[cleanCode];
    return {
      barcode: cleanCode,
      ...item,
      source: 'LOCAL_CATALOG',
      googleSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(`${cleanCode} ${item.name}`)}`,
      chedrauiSearchUrl: `https://www.chedraui.com.mx/search?text=${encodeURIComponent(cleanCode)}`,
    };
  }

  // Si no es un código numérico estándar de barras (ej. es un ID interno o clave alfanumérica)
  const isNumericBarcode = /^\d{7,14}$/.test(cleanCode);

  if (isNumericBarcode) {
    // Generar variantes numéricas (por ejemplo, UPC-A de 12 dígitos vs EAN-13 con 0 adelante)
    const codeVariants = [cleanCode];
    if (cleanCode.length === 12) {
      codeVariants.push(`0${cleanCode}`);
    } else if (cleanCode.length === 13 && cleanCode.startsWith('0')) {
      codeVariants.push(cleanCode.slice(1));
    }

    // 2. Consulta en vivo a Open Food Facts y Open Beauty/Products
    for (const codeToTry of codeVariants) {
      const endpoints = [
        `https://world.openfoodfacts.org/api/v2/product/${codeToTry}.json`,
        `https://es.openfoodfacts.org/api/v0/product/${codeToTry}.json`,
        `https://world.openbeautyfacts.org/api/v0/product/${codeToTry}.json`,
        `https://world.openproductsfacts.org/api/v0/product/${codeToTry}.json`,
      ];

      for (const url of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2800); // 2.8s por endpoint para no bloquear la UI

          const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if ((data.status === 1 || data.status_verbose === 'product found') && data.product) {
              const prod = data.product;
              const brand = prod.brands || prod.brand_owner || '';
              let name = prod.product_name_es || prod.product_name || prod.generic_name_es || prod.generic_name || '';

              if (!name && brand) {
                name = `${brand} (Código ${cleanCode})`;
              } else if (!name) {
                name = `Artículo ${cleanCode}`;
              }

              // Categorización inteligente
              let category = 'Abarrotes';
              const cats = `${prod.categories || ''} ${prod.categories_tags?.join(' ') || ''}`.toLowerCase();
              if (cats.includes('beverage') || cats.includes('bebida') || cats.includes('soda') || cats.includes('refresco')) category = 'Bebidas & Refrescos';
              else if (cats.includes('dairy') || cats.includes('lacteo') || cats.includes('queso') || cats.includes('milk') || cats.includes('leche')) category = 'Lácteos & Quesos';
              else if (cats.includes('meat') || cats.includes('carne') || cats.includes('fish') || cats.includes('pescado')) category = 'Carnes & Proteínas';
              else if (cats.includes('wine') || cats.includes('vino') || cats.includes('beer') || cats.includes('cerveza') || cats.includes('licor')) category = 'Vinos & Licores';
              else if (cats.includes('cleaning') || cats.includes('limpieza') || cats.includes('detergent') || cats.includes('soap')) category = 'Limpieza & Hogar';
              else if (cats.includes('fruit') || cats.includes('vegetable') || cats.includes('verdura') || cats.includes('fruta')) category = 'Frutas & Verduras';

              const photo = prod.image_front_small_url || prod.image_url || prod.image_front_url || null;
              const isWine = category === 'Vinos & Licores';

              return {
                barcode: cleanCode,
                name: name.trim(),
                brand: brand.trim(),
                category,
                unit: 'piezas',
                price: 0,
                photo,
                zone: isWine ? 'Cava Principal' : 'Alacena Principal',
                isWine,
                source: 'INTERNET_OPENFOODFACTS',
                googleSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(`${cleanCode} ${name}`)}`,
                chedrauiSearchUrl: `https://www.chedraui.com.mx/search?text=${encodeURIComponent(cleanCode)}`,
              };
            }
          }
        } catch (_) {
          // Continuar al siguiente endpoint
        }
      }
    }
  }

  // 3. Reconocimiento de Prefijos GS1 Internacionales si no estuvo en base de datos
  let originLabel = '';
  if (/^750/.test(cleanCode)) {
    originLabel = 'Producto Comercial Mexicano (GS1 750)';
  } else if (/^0[0-9]/.test(cleanCode) || /^1[0-9]/.test(cleanCode)) {
    originLabel = 'Producto Importado USA / Canadá (UPC)';
  } else if (/^84/.test(cleanCode)) {
    originLabel = 'Producto Importado de España (GS1 84)';
  } else if (/^80|^81|^82|^83/.test(cleanCode)) {
    originLabel = 'Producto Importado de Italia (GS1 80-83)';
  } else if (/^30|^31|^32|^33|^34|^35|^36|^37/.test(cleanCode)) {
    originLabel = 'Producto Importado de Francia (GS1 30-37)';
  }

  const generatedName = isNumericBarcode
    ? `Artículo ${cleanCode}`
    : `Código ${cleanCode}`;

  return {
    barcode: cleanCode,
    name: generatedName,
    brand: originLabel || '',
    category: 'Abarrotes',
    unit: 'piezas',
    price: 0,
    photo: null,
    zone: 'Alacena Principal',
    source: originLabel ? 'GS1_PREFIX_DETECTED' : 'NEW_CODE',
    googleSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(cleanCode)}`,
    chedrauiSearchUrl: `https://www.chedraui.com.mx/search?text=${encodeURIComponent(cleanCode)}`,
    walmartSearchUrl: `https://www.walmart.com.mx/search?q=${encodeURIComponent(cleanCode)}`,
  };
}
