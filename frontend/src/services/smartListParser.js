// Servicio de parseo inteligente de listas de compras (Texto, WhatsApp, Notas y OCR)
// Normaliza texto en lenguaje natural y genera partidas estructuradas para el Súper.

export const UNIT_SYNONYMS = {
  kg: ['kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos'],
  g: ['g', 'gr', 'gramo', 'gramos'],
  litros: ['l', 'lt', 'lts', 'litro', 'litros'],
  ml: ['ml', 'mililitro', 'mililitros'],
  piezas: ['pza', 'pzas', 'pieza', 'piezas', 'pz', 'unid', 'unidad', 'unidades', 'pzo', 'pz.'],
  botellas: ['botella', 'botellas', 'btl', 'btls', 'frasco', 'frascos'],
  latas: ['lata', 'latas'],
  paquetes: ['paq', 'paqs', 'paquete', 'paquetes', 'pqte', 'pack', 'packs'],
  cajas: ['caja', 'cajas'],
  bolsas: ['bolsa', 'bolsas'],
  manojos: ['manojo', 'manojos'],
  charolas: ['charola', 'charolas', 'bandeja', 'bandejas'],
  dientes: ['diente', 'dientes'],
  cabezas: ['cabeza', 'cabezas'],
  trozos: ['trozo', 'trozos', 'cubo', 'cubos'],
  cucharadas: ['cucharada', 'cucharadas', 'cda', 'cdas', 'cucharadita', 'cdita'],
  chorrito: ['chorrito', 'chorro', 'gotas'],
};

export const DEPT_KEYWORDS = {
  'Frutas & Verduras': ['jitomate', 'tomate', 'cebolla', 'aguacate', 'limon', 'limón', 'manzana', 'platano', 'plátano', 'papa', 'cilantro', 'lechuga', 'zanahoria', 'calabaza', 'chile', 'serrano', 'jalapeño', 'fresa', 'uva', 'naranja', 'espinaca', 'apio', 'ajo', 'ajos', 'puerro', 'morrón', 'morron', 'laurel', 'champignon', 'champiñon', 'moras', 'mango', 'pepino'],
  'Carnes & Proteínas': ['carne', 'pollo', 'res', 'pechuga', 'ribeye', 'arrachera', 'molida', 'salmon', 'salmón', 'atun', 'pescado', 'camaron', 'camarón', 'tocino', 'jamon', 'jamón', 'lomo', 'costilla', 'chuleta', 'filete', 'chorizo', 'morcilla', 'compango', 'chistorra', 'panceta'],
  'Lácteos & Huevos': ['huevo', 'huevos', 'leche', 'queso', 'crema', 'mantequilla', 'yogurt', 'yoghurt', 'parmesano', 'manchego', 'gouda', 'oaxaca'],
  'Vinos & Licores': ['vino', 'tinto', 'blanco', 'cabernet', 'malbec', 'tequila', 'mezcal', 'ron', 'whisky', 'whiskey', 'gin', 'ginebra', 'cerveza', 'champagne', 'cava', 'prosecco', 'bodega'],
  'Aceites & Condimentos': ['aceite', 'oliva', 'sal', 'pimienta', 'vinagre', 'oregano', 'orégano', 'comino', 'canela', 'soya', 'mayonesa', 'mostaza', 'catsup', 'pimentón', 'pimenton'],
  'Abarrotes': ['arroz', 'frijol', 'frijoles', 'negritos', 'alubia', 'alubias', 'legumbres', 'pasta', 'harina', 'azucar', 'azúcar', 'cereal', 'avena', 'galletas', 'pan', 'atun', 'atún', 'cafe', 'café', 'te', 'té', 'miel', 'mermelada', 'lenteja', 'garbanzo'],
  'Limpieza & Hogar': ['jabon', 'jabón', 'detergente', 'suavizante', 'cloro', 'papel', 'higienico', 'higiénico', 'servilleta', 'servilletas', 'bolsas de basura', 'trapeador', 'escoba', 'fabuloso', 'pinol', 'lavatrastes', 'esponja', 'aluminio', 'kleenex'],
  'Bebidas & Refrescos': ['agua', 'refresco', 'coca', 'coca-cola', 'mineral', 'peñafiel', 'jugo', 'tehuacan', 'squirt', 'sprite', 'tonica', 'tónica'],
};

export const STORE_KEYWORDS = {
  // España
  'Mercadona': ['mercadona', 'hacendado', 'deliplus', 'bosque verde'],
  'Dia Supermercados': ['dia', 'supermercados dia', 'dia market'],
  'El Corte Inglés': ['corte ingles', 'hipercor', 'club del gourmet'],
  'Carrefour': ['carrefour', 'carrefour express', 'carrefour market'],
  'Aldi España': ['aldi'],
  'Lidl España': ['lidl'],
  'Pescadería del Barrio': ['pescaderia', 'pescadería', 'lonja', 'marisqueria'],

  // México
  'Costco': ['costco', 'kirkland', 'paquete grande', 'bulk', 'kilo y medio'],
  'City Market': ['city market', 'gourmet', 'prime', 'importado', 'reserva', 'prosciutto', 'parmigiano', 'trufa'],
  'Chedraui Selecto': ['chedraui', 'selecto', 'super'],
  'Walmart Express': ['walmart', 'express', 'superama'],
  'OXXO': ['oxxo', 'six', 'hielo'],
  'Mercado Local': ['mercado', 'tianguis', 'recauderia', 'carniceria', 'polleria'],
};

// Frases de saludo o metadatos de tickets a ignorar
export const IGNORED_LINE_PATTERNS = [
  /^(hola|buen[ao]s|saludos|oiga|don|doña|buenas tardes|buenos días)/i,
  /^(esto falta|falta en la cocina|te paso la lista|lista del super|lista de compras|por favor|gracias|adjunto|saludos)/i,
  /^(total|subtotal|ticket|caja|cajero|fecha|folio|cambio|iva|atendido|supermercado|cliente)/i,
  /^[🛒]\s*lista\s+de\s+compras/i,
  /^lista\s+de\s+compras/i,
];

// Detectar encabezados de categoría (ej: "🫘 Legumbres", "🥩 Carnes y Compango...")
export const CATEGORY_HEADER_REGEX = /^(?:🫘|🥩|🥬|🥫|🍚|🍷|☕|🧼|🧀|🍞)\s*([A-Za-zÁÉÍÓÚáéíóúñÑ\s\/\(\)]+)/i;

export function parseRawShoppingText(rawText, existingProducts = []) {
  if (!rawText || typeof rawText !== 'string') return [];

  let lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 1 && lines[0].includes(',')) {
    lines = lines[0].split(',').map((l) => l.trim()).filter(Boolean);
  }

  const parsedItems = [];
  let currentDeptContext = null;

  for (let line of lines) {
    // 1. Filtrar saludos o encabezados globales
    if (IGNORED_LINE_PATTERNS.some((pat) => pat.test(line))) {
      continue;
    }

    // 2. Detectar si la línea es un encabezado de sección con emoji
    const headerMatch = line.match(CATEGORY_HEADER_REGEX);
    if (headerMatch && !line.match(/^\d/) && !line.match(/^(?:un|una|\d+)/i)) {
      const headerTitle = headerMatch[1].toLowerCase();
      if (headerTitle.includes('legumbre') || headerTitle.includes('abarrote')) currentDeptContext = 'Abarrotes';
      else if (headerTitle.includes('carne') || headerTitle.includes('compango')) currentDeptContext = 'Carnes & Proteínas';
      else if (headerTitle.includes('verdura') || headerTitle.includes('aromatic')) currentDeptContext = 'Frutas & Verduras';
      else if (headerTitle.includes('especia') || headerTitle.includes('despensa')) currentDeptContext = 'Aceites & Condimentos';
      else if (headerTitle.includes('arroz')) currentDeptContext = 'Abarrotes';
      continue;
    }

    // 3. Limpiar viñetas tipográficas y enumeraciones
    let cleanLine = line
      .replace(/^[\s-*•·–—>~•]+/, '')
      .replace(/^\d+[\.\)\-]+\s+/, '')
      .trim();

    if (!cleanLine || cleanLine.length < 2) continue;

    // Detectar si hay tienda explícita entre corchetes o paréntesis ej: "[Costco] Leche"
    let explicitStore = null;
    const storeBracketMatch = cleanLine.match(/\[(.*?)\]|\((.*?)\)/);
    if (storeBracketMatch) {
      const inside = (storeBracketMatch[1] || storeBracketMatch[2] || '').toLowerCase();
      for (const [stName, keys] of Object.entries(STORE_KEYWORDS)) {
        if (keys.some((k) => inside.includes(k))) {
          explicitStore = stName;
          cleanLine = cleanLine.replace(storeBracketMatch[0], '').trim();
          break;
        }
      }
    }

    // Quitar códigos de barras numéricos al inicio
    cleanLine = cleanLine.replace(/^\d{8,14}\s+/, '').trim();

    // Detectar expresiones coloquiales como "Un chorrito de...", "Un/Una..."
    cleanLine = cleanLine.replace(/^un\s+chorrito\s+de\s+/i, '1 chorrito ');
    cleanLine = cleanLine.replace(/^un[a]?\s+/i, '1 ');

    // 4. Detectar cantidad
    let quantity = 1;
    let unit = 'piezas';

    const fractionMatch = cleanLine.match(/^(\d+)\/(\d+)\s*/);
    if (fractionMatch) {
      quantity = parseFloat((parseInt(fractionMatch[1], 10) / parseInt(fractionMatch[2], 10)).toFixed(2));
      cleanLine = cleanLine.replace(fractionMatch[0], '').trim();
    } else {
      const numberMatch = cleanLine.match(/^(\d+(?:[.,]\d+)?)\s*/);
      if (numberMatch) {
        quantity = parseFloat(numberMatch[1].replace(',', '.'));
        cleanLine = cleanLine.replace(numberMatch[0], '').trim();
      }
    }

    // 5. Detectar unidad de medida después del número
    let words = cleanLine.split(/\s+/);
    if (words.length > 0) {
      const firstWordLower = words[0].toLowerCase();
      let matchedUnit = null;

      for (const [standardUnit, synonyms] of Object.entries(UNIT_SYNONYMS)) {
        if (synonyms.includes(firstWordLower)) {
          matchedUnit = standardUnit;
          break;
        }
      }

      if (matchedUnit) {
        unit = matchedUnit;
        words.shift();
        if (words.length > 0 && ['de', 'del', 'd'].includes(words[0].toLowerCase())) {
          words.shift();
        }
        cleanLine = words.join(' ').trim();
      }
    }

    // 6. Detectar unidad al final de la línea si no se encontró al inicio
    words = cleanLine.split(/\s+/);
    if (words.length >= 2) {
      const lastWordLower = words[words.length - 1].toLowerCase();
      for (const [standardUnit, synonyms] of Object.entries(UNIT_SYNONYMS)) {
        if (synonyms.includes(lastWordLower)) {
          unit = standardUnit;
          words.pop();
          if (words.length > 0 && /^\d+(?:[.,]\d+)?$/.test(words[words.length - 1])) {
            quantity = parseFloat(words[words.length - 1].replace(',', '.'));
            words.pop();
          }
          cleanLine = words.join(' ').trim();
          break;
        }
      }
    }

    // Quitar "de " residual al principio de forma precisa
    cleanLine = cleanLine.replace(/^(?:de|del|d)\s+/i, '').trim();

    let productName = cleanLine;
    if (!productName || productName.length < 2) continue;

    // Capitalizar primera letra respetando el resto del texto
    productName = productName.charAt(0).toUpperCase() + productName.slice(1);

    // Cruzar con productos existentes en el inventario de casa para enriquecer
    const prodLower = productName.toLowerCase();
    const matchedPantryProd = existingProducts.find((p) => {
      const pName = (p.name || '').toLowerCase();
      return pName.includes(prodLower) || prodLower.includes(pName);
    });

    // Inferencia de Departamento
    let department = currentDeptContext || 'Abarrotes';
    if (matchedPantryProd?.category) {
      department = matchedPantryProd.category;
    } else {
      for (const [deptName, keywords] of Object.entries(DEPT_KEYWORDS)) {
        if (keywords.some((k) => prodLower.includes(k))) {
          department = deptName;
          break;
        }
      }
    }

    // Inferencia de Tienda
    let store = explicitStore || matchedPantryProd?.store || 'Supermercado';
    if (!explicitStore && !matchedPantryProd?.store) {
      for (const [stName, keywords] of Object.entries(STORE_KEYWORDS)) {
        if (keywords.some((k) => prodLower.includes(k))) {
          store = stName;
          break;
        }
      }
    }

    // Precios referenciales según departamento
    let estimatedPriceMxn = 45.0;
    if (department.includes('Carnes')) estimatedPriceMxn = 120.0;
    if (department.includes('Aceites') && prodLower.includes('oliva')) estimatedPriceMxn = 220.0;
    if (prodLower.includes('pimentón') || prodLower.includes('pimenton')) estimatedPriceMxn = 95.0;
    if (prodLower.includes('morcilla') || prodLower.includes('chorizo')) estimatedPriceMxn = 85.0;
    if (prodLower.includes('tocino')) estimatedPriceMxn = 55.0;

    const targetZone = matchedPantryProd?.zone || (
      department.includes('Carnes') ? 'Refrigerador' : 
      department.includes('Frutas') ? 'Alacena Fresca' : 
      'Alacena Principal'
    );

    parsedItems.push({
      id: `shop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: productName,
      quantity,
      unit,
      department,
      store,
      estimatedPriceMxn,
      targetZone,
      checked: false,
    });
  }

  return parsedItems;
}
