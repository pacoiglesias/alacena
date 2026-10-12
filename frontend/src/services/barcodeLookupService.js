// Servicio de búsqueda de productos por código de barras (EAN / UPC / QR)
// Utiliza catálogo local instantáneo + Open Food Facts API (multi-región) + búsqueda web externa

export async function lookupBarcode(barcode) {
  if (!barcode) return null;
  const cleanCode = barcode.toString().trim();

  // 1. Base de datos rápida local de códigos comunes para respuesta ultra veloz (0ms)
  const LOCAL_BARCODE_CATALOG = {
    '7501000111223': { name: 'Harina de Trigo Selecta 1kg', category: 'Abarrotes', unit: 'kg', price: 38.50, zone: 'Alacena Principal', brand: 'Selecta' },
    '7501000333445': { name: 'Aceite de Oliva Extra Virgen 1L', category: 'Aceites & Condimentos', unit: 'litros', price: 345.00, zone: 'Alacena Principal', brand: 'Carbonell' },
    '7501000555667': { name: 'Vino Tinto Reserva Cabernet', category: 'Vinos & Licores', unit: 'botellas', price: 4850.00, zone: 'Cava Subterránea', brand: 'Casa Madero' },
    '7501000777889': { name: 'Corte Ribeye Prime Sonorense', category: 'Carnes & Proteínas', unit: 'kg', price: 680.00, zone: 'Cuarto Frío', brand: 'Rancho el 17' },
    '7501000999001': { name: 'Queso Parmigiano Reggiano', category: 'Lácteos & Quesos', unit: 'kg', price: 890.00, zone: 'Refrigerador', brand: 'Importación' },
    '7501055300076': { name: 'Leche Entera Pasteurizada 1L', category: 'Lácteos & Quesos', unit: 'litros', price: 29.50, zone: 'Refrigerador', brand: 'Lala' },
    '7501030490631': { name: 'Café Grano Tostado 500g', category: 'Bebidas Calientes', unit: 'kg', price: 195.00, zone: 'Alacena Principal', brand: 'Punta del Cielo' },
    '7501055301097': { name: 'Coca-Cola Original Refresco 600ml', category: 'Bebidas & Refrescos', unit: 'piezas', price: 19.50, zone: 'Refrigerador', store: 'OXXO / Super', brand: 'Coca-Cola' },
    '7501055310884': { name: 'Coca-Cola Sin Azúcar 600ml', category: 'Bebidas & Refrescos', unit: 'piezas', price: 19.50, zone: 'Refrigerador', store: 'Supermercado', brand: 'Coca-Cola' },
    '7501000101010': { name: 'Arroz Grano Grueso 1kg', category: 'Abarrotes', unit: 'kg', price: 36.00, zone: 'Alacena Principal', store: 'Costco', brand: 'Verde Valle' },
    '7501000202020': { name: 'Frijol Negro Selección 1kg', category: 'Abarrotes', unit: 'kg', price: 42.00, zone: 'Alacena Principal', store: 'Costco', brand: 'La Costeña' },
    '7501008000011': { name: 'Huevo Blanco San Juan (Cono 30 piezas)', category: 'Lácteos & Huevos', unit: 'paquetes', price: 92.00, zone: 'Alacena Principal', store: 'City Market', brand: 'San Juan' },
    '7501008000022': { name: 'Papel Higiénico Regio Luxury (Paquete 12)', category: 'Limpieza & Hogar', unit: 'paquetes', price: 145.00, zone: 'Alacena Principal', store: 'Costco', brand: 'Regio' },
    '7501008000033': { name: 'Detergente Líquido Mas Color 5L', category: 'Limpieza & Hogar', unit: 'piezas', price: 210.00, zone: 'Alacena Principal', store: 'Costco', brand: 'Henkel' },
  };

  if (LOCAL_BARCODE_CATALOG[cleanCode]) {
    return {
      barcode: cleanCode,
      ...LOCAL_BARCODE_CATALOG[cleanCode],
      source: 'LOCAL_CATALOG',
      googleSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(cleanCode + ' ' + LOCAL_BARCODE_CATALOG[cleanCode].name)}`,
      chedrauiSearchUrl: `https://www.chedraui.com.mx/search?text=${encodeURIComponent(cleanCode)}`,
    };
  }

  // 2. Consulta en vivo a Open Food Facts México / Mundial
  const endpoints = [
    `https://es.openfoodfacts.org/api/v0/product/${cleanCode}.json`,
    `https://world.openfoodfacts.org/api/v0/product/${cleanCode}.json`,
    `https://world.openfoodfacts.net/api/v2/product/${cleanCode}.json`,
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if ((data.status === 1 || data.status_verbose === 'product found') && data.product) {
          const prod = data.product;
          const brand = prod.brands || '';
          let name = prod.product_name_es || prod.product_name || '';

          if (!name && brand) {
            name = `${brand} (Código ${cleanCode})`;
          } else if (!name) {
            name = `Artículo ${cleanCode}`;
          }

          // Infiere categoría aproximada
          let category = 'Abarrotes';
          const cats = `${prod.categories || ''} ${prod.categories_tags?.join(' ') || ''}`.toLowerCase();
          if (cats.includes('beverage') || cats.includes('bebida') || cats.includes('soda')) category = 'Bebidas & Refrescos';
          else if (cats.includes('dairy') || cats.includes('lacteo') || cats.includes('queso') || cats.includes('milk')) category = 'Lácteos & Quesos';
          else if (cats.includes('meat') || cats.includes('carne') || cats.includes('fish')) category = 'Carnes & Proteínas';
          else if (cats.includes('wine') || cats.includes('vino') || cats.includes('beer')) category = 'Vinos & Licores';
          else if (cats.includes('cleaning') || cats.includes('limpieza')) category = 'Limpieza & Hogar';

          const photo = prod.image_front_small_url || prod.image_url || prod.image_front_url || null;

          return {
            barcode: cleanCode,
            name: name.trim(),
            brand: brand.trim(),
            category,
            unit: 'piezas',
            price: 0,
            photo,
            zone: 'Alacena Principal',
            source: 'INTERNET_OPENFOODFACTS',
            googleSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(cleanCode + ' ' + name)}`,
            chedrauiSearchUrl: `https://www.chedraui.com.mx/search?text=${encodeURIComponent(cleanCode)}`,
          };
        }
      }
    } catch (e) {
      // Continuar al siguiente endpoint si falla
    }
  }

  // 3. Fallback genérico con enlaces de búsqueda en internet directa
  return {
    barcode: cleanCode,
    name: `Artículo ${cleanCode}`,
    brand: '',
    category: 'Abarrotes',
    unit: 'piezas',
    price: 0,
    photo: null,
    zone: 'Alacena Principal',
    source: 'NEW_CODE',
    googleSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(cleanCode)}`,
    chedrauiSearchUrl: `https://www.chedraui.com.mx/search?text=${encodeURIComponent(cleanCode)}`,
  };
}
