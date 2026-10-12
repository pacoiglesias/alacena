// Servicio de búsqueda de productos por código de barras (EAN / UPC / QR)
// Utiliza Open Food Facts API (gratuita, sin API key) y catálogo local predefinido

export async function lookupBarcode(barcode) {
  if (!barcode) return null;
  const cleanCode = barcode.trim();

  // 1. Base de datos rápida local de códigos comunes para respuesta instantánea
  const LOCAL_BARCODE_CATALOG = {
    '7501000111223': { name: 'Harina de Trigo Selecta 1kg', category: 'Abarrotes', unit: 'kg', price: 38.50, zone: 'Alacena Principal' },
    '7501000333445': { name: 'Aceite de Oliva Extra Virgen 1L', category: 'Aceites & Condimentos', unit: 'litros', price: 345.00, zone: 'Alacena Principal' },
    '7501000555667': { name: 'Vino Tinto Reserva Cabernet', category: 'Vinos & Licores', unit: 'botellas', price: 4850.00, zone: 'Cava Subterránea' },
    '7501000777889': { name: 'Corte Ribeye Prime Sonorense', category: 'Carnes & Proteínas', unit: 'kg', price: 680.00, zone: 'Cuarto Frío' },
    '7501000999001': { name: 'Queso Parmigiano Reggiano', category: 'Lácteos & Quesos', unit: 'kg', price: 890.00, zone: 'Refrigerador' },
    '7501055300076': { name: 'Leche Entera Pasteurizada 1L', category: 'Lácteos & Quesos', unit: 'litros', price: 29.50, zone: 'Refrigerador' },
    '7501030490631': { name: 'Café Grano Tostado 500g', category: 'Bebidas Calientes', unit: 'kg', price: 195.00, zone: 'Alacena Principal' },
    '7501055301097': { name: 'Coca-Cola Original Refresco 600ml', category: 'Bebidas & Refrescos', unit: 'piezas', price: 19.50, zone: 'Refrigerador', store: 'OXXO / Super' },
    '7501055310884': { name: 'Coca-Cola Sin Azúcar 600ml', category: 'Bebidas & Refrescos', unit: 'piezas', price: 19.50, zone: 'Refrigerador', store: 'Supermercado' },
    '7501000101010': { name: 'Arroz Grano Grueso 1kg', category: 'Abarrotes', unit: 'kg', price: 36.00, zone: 'Alacena Principal', store: 'Costco' },
    '7501000202020': { name: 'Frijol Negro Selección 1kg', category: 'Abarrotes', unit: 'kg', price: 42.00, zone: 'Alacena Principal', store: 'Costco' },
    '7501008000011': { name: 'Huevo Blanco San Juan (Cono 30 piezas)', category: 'Lácteos & Huevos', unit: 'paquetes', price: 92.00, zone: 'Alacena Principal', store: 'City Market' },
    '7501008000022': { name: 'Papel Higiénico Regio Luxury (Paquete 12)', category: 'Limpieza & Hogar', unit: 'paquetes', price: 145.00, zone: 'Alacena Principal', store: 'Costco' },
    '7501008000033': { name: 'Detergente Líquido Mas Color 5L', category: 'Limpieza & Hogar', unit: 'piezas', price: 210.00, zone: 'Alacena Principal', store: 'Costco' },
  };

  if (LOCAL_BARCODE_CATALOG[cleanCode]) {
    return {
      barcode: cleanCode,
      ...LOCAL_BARCODE_CATALOG[cleanCode],
      source: 'LOCAL_CATALOG',
    };
  }

  // 2. Consulta en vivo a Open Food Facts
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s max

    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${cleanCode}.json?fields=product_name,brands,categories_tags,quantity`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.status === 1 && data.product) {
        const prod = data.product;
        const name = prod.product_name || (prod.brands ? `${prod.brands} Producto` : `Artículo ${cleanCode}`);
        return {
          barcode: cleanCode,
          name: name.trim(),
          category: 'Abarrotes',
          unit: 'piezas',
          price: 0,
          zone: 'Alacena Principal',
          source: 'OPEN_FOOD_FACTS',
        };
      }
    }
  } catch (e) {
    console.warn('Consulta OpenFoodFacts omitida o con timeout:', e);
  }

  // Fallback genérico con el código
  return {
    barcode: cleanCode,
    name: `Artículo ${cleanCode}`,
    category: 'Abarrotes',
    unit: 'piezas',
    price: 0,
    zone: 'Alacena Principal',
    source: 'NEW_CODE',
  };
}
