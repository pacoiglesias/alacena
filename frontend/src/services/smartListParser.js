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
};

export const DEPT_KEYWORDS = {
  'Frutas & Verduras': ['jitomate', 'tomate', 'cebolla', 'aguacate', 'limon', 'limón', 'manzana', 'platano', 'plátano', 'papa', 'cilantro', 'lechuga', 'zanahoria', 'calabaza', 'chile', 'serrano', 'jalapeño', 'fresa', 'uva', 'naranja', 'espinaca', 'apio', 'ajo', 'champignon', 'champiñon', 'moras', 'mango', 'pepino'],
  'Carnes & Proteínas': ['carne', 'pollo', 'res', 'pechuga', 'ribeye', 'arrachera', 'molida', 'salmon', 'salmón', 'atun', 'pescado', 'camaron', 'camarón', 'tocino', 'jamon', 'jamón', 'lomo', 'costilla', 'chuleta', 'filete'],
  'Lácteos & Huevos': ['huevo', 'huevos', 'leche', 'queso', 'crema', 'mantequilla', 'yogurt', 'yoghurt', 'parmesano', 'manchego', 'gouda', 'oaxaca'],
  'Vinos & Licores': ['vino', 'tinto', 'blanco', 'cabernet', 'malbec', 'tequila', 'mezcal', 'ron', 'whisky', 'whiskey', 'gin', 'ginebra', 'cerveza', 'champagne', 'cava', 'prosecco', 'bodega'],
  'Aceites & Condimentos': ['aceite', 'oliva', 'sal', 'pimienta', 'vinagre', 'oregano', 'orégano', 'comino', 'canela', 'soya', 'mayonesa', 'mostaza', 'catsup'],
  'Abarrotes': ['arroz', 'frijol', 'pasta', 'harina', 'azucar', 'azúcar', 'cereal', 'avena', 'galletas', 'pan', 'atun', 'atún', 'cafe', 'café', 'te', 'té', 'miel', 'mermelada', 'lenteja', 'garbanzo'],
  'Limpieza & Hogar': ['jabon', 'jabón', 'detergente', 'suavizante', 'cloro', 'papel', 'higienico', 'higiénico', 'servilleta', 'servilletas', 'bolsas de basura', 'trapeador', 'escoba', 'fabuloso', 'pinol', 'lavatrastes', 'esponja', 'aluminio', 'kleenex'],
  'Bebidas & Refrescos': ['agua', 'refresco', 'coca', 'coca-cola', 'mineral', 'peñafiel', 'jugo', 'tehuacan', 'squirt', 'sprite', 'tonica', 'tónica'],
};

export const STORE_KEYWORDS = {
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
];

export function parseRawShoppingText(rawText, existingProducts = []) {
  if (!rawText || typeof rawText !== 'string') return [];

  // Dividir por líneas o por comas si es una sola línea con comas
  let lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Si solo viene una línea con comas o puntos, dividir por comas
  if (lines.length === 1 && lines[0].includes(',')) {
    lines = lines[0].split(',').map((l) => l.trim()).filter(Boolean);
  }

  const parsedItems = [];

  for (let line of lines) {
    // 1. Filtrar saludos o encabezados
    if (IGNORED_LINE_PATTERNS.some((pat) => pat.test(line))) {
      continue;
    }

    // 2. Limpiar SOLO viñetas tipográficas (sin borrar números reales)
    let cleanLine = line
      .replace(/^[\s-*•·–—>~•]+/, '') // Quita viñetas
      .trim();

    // 3. Quitar enumeración de lista como "1. ", "2) ", "10.- " solo si va seguido de espacio
    cleanLine = cleanLine.replace(/^\d+[\.\)\-]+\s+/, '').trim();

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

    // 4. Quitar códigos de barras o números EAN de ticket al inicio (ej: "7501000111223 HARINA")
    cleanLine = cleanLine.replace(/^\d{8,14}\s+/, '').trim();

    // 5. Detectar cantidad
    let quantity = 1;
    let unit = 'piezas';
    let productName = cleanLine;

    // 5a. Detectar fracciones tipo "1/2", "1/4", "3/4"
    const fractionMatch = cleanLine.match(/^(\d+)\/(\d+)\s*/);
    if (fractionMatch) {
      quantity = parseFloat((parseInt(fractionMatch[1], 10) / parseInt(fractionMatch[2], 10)).toFixed(2));
      cleanLine = cleanLine.replace(fractionMatch[0], '').trim();
    } else {
      // 5b. Detectar número entero o decimal al inicio
      const numberMatch = cleanLine.match(/^(\d+(?:[.,]\d+)?)\s*/);
      if (numberMatch) {
        quantity = parseFloat(numberMatch[1].replace(',', '.'));
        cleanLine = cleanLine.replace(numberMatch[0], '').trim();
      }
    }

    // 6. Detectar unidad de medida después del número
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
        words.shift(); // Quitar la palabra de la unidad
        // Si la siguiente palabra es "de" o "del", quitarla también
        if (words.length > 0 && ['de', 'del', 'd'].includes(words[0].toLowerCase())) {
          words.shift();
        }
        cleanLine = words.join(' ').trim();
      }
    }

    // 7. También detectar unidad al FINAL de la línea (muy común en tickets: "HARINA DE TRIGO 1 KG")
    words = cleanLine.split(/\s+/);
    if (words.length >= 2) {
      const lastWordLower = words[words.length - 1].toLowerCase();
      for (const [standardUnit, synonyms] of Object.entries(UNIT_SYNONYMS)) {
        if (synonyms.includes(lastWordLower)) {
          unit = standardUnit;
          words.pop();
          // Si el penúltimo es un número ej: "1", extraerlo como cantidad si aún era 1
          if (words.length > 0 && /^\d+(?:[.,]\d+)?$/.test(words[words.length - 1])) {
            quantity = parseFloat(words[words.length - 1].replace(',', '.'));
            words.pop();
          }
          cleanLine = words.join(' ').trim();
          break;
        }
      }
    }

    // Capitalizar nombre
    productName = cleanLine
      .replace(/^[de\s]+/i, '') // quita "de " residual al principio
      .trim();

    if (!productName || productName.length < 2) continue;

    // Normalizar capitalización agradable
    productName = productName.charAt(0).toUpperCase() + productName.slice(1).toLowerCase();

    // Cruzar con productos existentes en el inventario de casa para enriquecer
    const prodLower = productName.toLowerCase();
    const matchedPantryProd = existingProducts.find((p) => {
      const pName = (p.name || '').toLowerCase();
      return pName.includes(prodLower) || prodLower.includes(pName);
    });

    // Inferencia de Departamento
    let department = 'Abarrotes';
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

    // Precio estimado en MXN
    const estimatedPriceMxn = matchedPantryProd?.price || (department.includes('Vinos') ? 850 : 45);
    const targetZone = matchedPantryProd?.zone || (department.includes('Vinos') ? 'Cava Subterránea' : 'Alacena Principal');

    parsedItems.push({
      id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: productName,
      quantity: quantity || 1,
      unit: matchedPantryProd?.unit || unit,
      department,
      store,
      estimatedPriceMxn,
      targetZone,
      checked: false,
      isImported: true,
      matchedInPantry: Boolean(matchedPantryProd),
    });
  }

  return parsedItems;
}
