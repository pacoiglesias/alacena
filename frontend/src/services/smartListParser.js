// Servicio de parseo inteligente de listas de compras y tickets de supermercado
// (Texto natural, WhatsApp, notas manuscritas y OCR de tickets España/México)
// Normaliza texto y genera partidas estructuradas con cantidades, unidades, precios reales y zonas.

export const UNIT_SYNONYMS = {
  kg: ['kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos'],
  g: ['g', 'gr', 'gramo', 'gramos'],
  litros: ['l', 'lt', 'lts', 'litro', 'litros', '1l', '1.5l', '2l'],
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
  'Frutas & Verduras': ['jitomate', 'tomate', 'cebolla', 'aguacate', 'limon', 'limón', 'manzana', 'platano', 'plátano', 'papa', 'cilantro', 'lechuga', 'zanahoria', 'calabaza', 'chile', 'serrano', 'jalapeño', 'fresa', 'uva', 'naranja', 'espinaca', 'apio', 'ajo', 'ajos', 'puerro', 'morrón', 'morron', 'laurel', 'champignon', 'champiñon', 'moras', 'mango', 'pepino', 'pera', 'melon', 'sandia', 'kiwi'],
  'Carnes & Proteínas': ['carne', 'pollo', 'res', 'pechuga', 'ribeye', 'arrachera', 'molida', 'salmon', 'salmón', 'atun', 'atún', 'pescado', 'camaron', 'camarón', 'tocino', 'jamon', 'jamón', 'lomo', 'costilla', 'chuleta', 'filete', 'chorizo', 'morcilla', 'compango', 'chistorra', 'panceta', 'merluza', 'bacalao', 'dorada', 'lubina', 'calamar', 'gambas', 'pavo', 'ternera', 'cerdo'],
  'Lácteos & Huevos': ['huevo', 'huevos', 'leche', 'queso', 'crema', 'mantequilla', 'yogurt', 'yoghurt', 'yogur', 'parmesano', 'manchego', 'gouda', 'oaxaca', 'mozzarella', 'nata', 'cuajada'],
  'Vinos & Licores': ['vino', 'tinto', 'blanco', 'cabernet', 'malbec', 'tequila', 'mezcal', 'ron', 'whisky', 'whiskey', 'gin', 'ginebra', 'cerveza', 'champagne', 'cava', 'prosecco', 'bodega', 'ribera', 'rioja', 'reserva', 'crianza'],
  'Aceites & Condimentos': ['aceite', 'oliva', 'sal', 'pimienta', 'vinagre', 'oregano', 'orégano', 'comino', 'canela', 'soya', 'mayonesa', 'mostaza', 'catsup', 'pimentón', 'pimenton', 'azafran', 'azafrán', 'curry'],
  'Abarrotes': ['arroz', 'frijol', 'frijoles', 'negritos', 'alubia', 'alubias', 'legumbres', 'pasta', 'harina', 'azucar', 'azúcar', 'cereal', 'avena', 'galletas', 'pan', 'cafe', 'café', 'te', 'té', 'miel', 'mermelada', 'lenteja', 'garbanzo', 'espagueti', 'macarrones'],
  'Limpieza & Hogar': ['jabon', 'jabón', 'detergente', 'suavizante', 'cloro', 'papel', 'higienico', 'higiénico', 'servilleta', 'servilletas', 'bolsas de basura', 'trapeador', 'escoba', 'fabuloso', 'pinol', 'lavatrastes', 'esponja', 'aluminio', 'kleenex', 'lavavajillas', 'lejia', 'fregasuelos'],
  'Bebidas & Refrescos': ['agua', 'refresco', 'coca', 'coca-cola', 'mineral', 'peñafiel', 'jugo', 'tehuacan', 'squirt', 'sprite', 'tonica', 'tónica', 'fanta', 'aquarius', 'gaseosa'],
};

export const STORE_KEYWORDS = {
  // España
  'Mercadona': ['mercadona', 'hacendado', 'deliplus', 'bosque verde', 'compy'],
  'Dia Supermercados': ['dia', 'supermercados dia', 'dia market', 'dia maxi'],
  'El Corte Inglés': ['corte ingles', 'hipercor', 'club del gourmet', 'supercor'],
  'Carrefour': ['carrefour', 'carrefour express', 'carrefour market', 'carrefour bio'],
  'Aldi España': ['aldi'],
  'Lidl España': ['lidl'],
  'Alcampo': ['alcampo', 'auchan'],
  'Pescadería del Barrio': ['pescaderia', 'pescadería', 'lonja', 'marisqueria'],

  // México
  'Costco': ['costco', 'kirkland', 'paquete grande', 'bulk', 'kilo y medio'],
  'City Market': ['city market', 'gourmet', 'prime', 'importado', 'reserva', 'prosciutto', 'parmigiano', 'trufa'],
  'Chedraui Selecto': ['chedraui', 'selecto', 'super'],
  'Walmart Express': ['walmart', 'express', 'superama'],
  'OXXO': ['oxxo', 'six', 'hielo'],
  'Soriana': ['soriana', 'hiper'],
  'Mercado Local': ['mercado', 'tianguis', 'recauderia', 'carniceria', 'polleria'],
};

// Frases de saludo o metadatos de tickets a ignorar
export const IGNORED_LINE_PATTERNS = [
  /^(hola|buen[ao]s|saludos|oiga|don|doña|buenas tardes|buenos días)/i,
  /^(esto falta|falta en la cocina|te paso la lista|lista del super|lista de compras|por favor|gracias|adjunto|saludos)/i,
  /^(cif|nif|rfc|factura|simplificada|ticket|caja|cajero|oper|tpv|terminal|folio|fecha|hora|tienda|sucursal|direcci[oó]n|calle|avda|c\/|tel|tel[eé]fono|atendido|atendi[oó])/i,
  /^(total|subtotal|sub-total|importe|base\s+imponible|cuota|tarjeta|visa|mastercard|efectivo|cambio|cambio\s+entregado|art[ií]culos|unidades|iva|iva\s*incluido)/i,
  /^(gracias\s+por\s+su\s+visita|devoluci[oó]n|conservar|atenci[oó]n|puntos|descuento|ahorro|promoci[oó]n|v[aá]lido|caducidad|le\s+atendi[oó])/i,
  /^(mercadona|carrefour|dia\s+supermercados|el\s+corte\s+ingl[eé]s|costco|chedraui|walmart|oxxo|soriana|alcampo|hipercor|supercor|lidl|aldi)(?:,?\s*(?:s\.?a\.?|s\.?l\.?|de\s+c\.?v\.?))?$/i,
  /^(descripci[oó]n|art[ií]culo|concepto|producto)\s+(cant|cantidad)?\s*(precio|pvp)?\s*(importe|total)?/i,
  /^(cant|cantidad)\s+(descripci[oó]n|art[ií]culo)\s*(precio|pvp)?\s*(importe|total)?/i,
  /^[🛒]\s*lista\s+de\s+compras/i,
  /^lista\s+de\s+compras/i,
  /^[-=*_~·\s]{3,}$/, // Separadores tipográficos
  /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/, // Solo fechas
  /^\d{1,2}:\d{2}(?::\d{2})?/, // Solo horas
];

// Detectar encabezados de categoría (ej: "🫘 Legumbres", "🥩 Carnes y Compango...")
export const CATEGORY_HEADER_REGEX = /^(?:🫘|🥩|🥬|🥫|🍚|🍷|☕|🧼|🧀|🍞)\s*([A-Za-zÁÉÍÓÚáéíóúñÑ\s\/\(\)]+)/i;

/**
 * Normaliza nombres en mayúsculas sostenidas de tickets (ej. "LECHE ENTERA HACENDADO 1L")
 * a formato legible Title Case ("Leche Entera Hacendado 1L") preservando unidades y siglas.
 */
export function formatProductName(rawName) {
  if (!rawName) return '';
  const trimmed = rawName.trim();
  
  // Si no está completamente en mayúsculas, respetar mayúsculas originales
  if (trimmed !== trimmed.toUpperCase() || trimmed.length <= 3) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  const preserveUpper = ['1L', '2L', '1KG', '2KG', '500G', '250G', '750ML', 'DO', 'DOC', 'AOP', 'BIO', 'ECO', 'AOVE', 'V.E.', 'XL', 'L'];
  const words = trimmed.toLowerCase().split(/\s+/);
  
  const formatted = words.map((w, idx) => {
    const upperW = w.toUpperCase();
    if (preserveUpper.includes(upperW)) return upperW;
    if (idx > 0 && ['de', 'del', 'con', 'en', 'al', 'y', 'e', 'o', 'la', 'el', 'los', 'las', 'd'].includes(w)) {
      return w;
    }
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Infiere la tienda dominante a partir del texto global
 */
export function detectStoreFromText(rawText) {
  if (!rawText) return null;
  const lower = rawText.toLowerCase();
  for (const [storeName, keywords] of Object.entries(STORE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return storeName;
    }
  }
  return null;
}

/**
 * Parsea texto crudo proveniente de:
 * 1. Tickets de compra de supermercado (con precios, importes, cantidades y descripciones)
 * 2. Mensajes de WhatsApp o notas informales
 * 3. Listas estructuradas o recetas
 */
export function parseRawShoppingText(rawText, existingProducts = []) {
  if (!rawText || typeof rawText !== 'string') return [];

  const detectedGlobalStore = detectStoreFromText(rawText);

  let lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 1 && lines[0].includes(',')) {
    lines = lines[0].split(',').map((l) => l.trim()).filter(Boolean);
  }

  const parsedItems = [];
  let currentDeptContext = null;

  for (let rawLine of lines) {
    let line = rawLine.trim();

    // 1. Filtrar saludos, metadatos y totales de tickets
    if (IGNORED_LINE_PATTERNS.some((pat) => pat.test(line))) {
      continue;
    }

    // 2. Detectar si la línea es un encabezado de sección con emoji
    const headerMatch = line.match(CATEGORY_HEADER_REGEX);
    if (headerMatch && !line.match(/^\d/) && !line.match(/^(?:un|una|\d+)/i)) {
      const headerTitle = headerMatch[1].toLowerCase();
      if (headerTitle.includes('legumbre') || headerTitle.includes('abarrote')) currentDeptContext = 'Abarrotes';
      else if (headerTitle.includes('carne') || headerTitle.includes('compango') || headerTitle.includes('pescad')) currentDeptContext = 'Carnes & Proteínas';
      else if (headerTitle.includes('verdura') || headerTitle.includes('fruta') || headerTitle.includes('aromatic')) currentDeptContext = 'Frutas & Verduras';
      else if (headerTitle.includes('especia') || headerTitle.includes('despensa') || headerTitle.includes('aceite')) currentDeptContext = 'Aceites & Condimentos';
      else if (headerTitle.includes('arroz') || headerTitle.includes('pasta')) currentDeptContext = 'Abarrotes';
      continue;
    }

    // 3. Limpiar viñetas tipográficas y enumeraciones al inicio
    let cleanLine = line
      .replace(/^[\s-*•·–—>~•✓✔#]+/, '')
      .replace(/^\d+[\.\)\-]+\s+/, '')
      .trim();

    if (!cleanLine || cleanLine.length < 2) continue;

    // Detectar si hay tienda explícita entre corchetes o paréntesis ej: "[Mercadona] Leche" o "[Costco]"
    let explicitStore = detectedGlobalStore;
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

    // Quitar códigos de barras / PLU numéricos largos al inicio (ej. "848000012345 1 LECHE")
    cleanLine = cleanLine.replace(/^\d{8,14}\s+/, '').trim();

    // 4. DETECCIÓN Y EXTRACCIÓN DE PRECIO DE TICKET AL FINAL DE LA LÍNEA
    // Soporta: "0,95", "4.50 €", "$ 28.50", "2,44 A", "9.60 EUR"
    let extractedTicketPrice = null;
    const priceEndMatch = cleanLine.match(/(?:[\$€]\s*)?(\d+[.,]\d{2})\s*(?:€|\$|EUR|MXN)?(?:\s+[A-Za-z])?$/i);
    if (priceEndMatch) {
      extractedTicketPrice = parseFloat(priceEndMatch[1].replace(',', '.'));
      cleanLine = cleanLine.slice(0, priceEndMatch.index).trim();

      // Si había un segundo precio previo (ej. Precio unitario seguido del importe total: "4,80 9,60")
      const unitPriceBeforeMatch = cleanLine.match(/(?:[\$€]\s*)?(\d+[.,]\d{2})\s*(?:€|\$)?$/i);
      if (unitPriceBeforeMatch) {
        cleanLine = cleanLine.slice(0, unitPriceBeforeMatch.index).trim();
      }
    }

    // Detectar expresiones coloquiales como "Un chorrito de...", "Un/Una..."
    cleanLine = cleanLine.replace(/^un\s+chorrito\s+de\s+/i, '1 chorrito ');
    cleanLine = cleanLine.replace(/^un[a]?\s+/i, '1 ');

    // 5. DETECCIÓN DE CANTIDAD Y UNIDAD
    let quantity = 1;
    let unit = 'piezas';

    // A. Fracciones (ej: "1/2 kg de queso")
    const fractionMatch = cleanLine.match(/^(\d+)\/(\d+)\s*/);
    if (fractionMatch) {
      quantity = parseFloat((parseInt(fractionMatch[1], 10) / parseInt(fractionMatch[2], 10)).toFixed(2));
      cleanLine = cleanLine.replace(fractionMatch[0], '').trim();
    } else {
      // B. Multiplicador tipo "2 x Leche" o "3 X Yogur"
      const multiplierMatch = cleanLine.match(/^(\d+)\s*[xX]\s*/);
      if (multiplierMatch) {
        quantity = parseFloat(multiplierMatch[1]);
        cleanLine = cleanLine.replace(multiplierMatch[0], '').trim();
      } else {
        // C. Número inicial (ej. "2 Leches", "1.5 kg", "1 LECHE ENTERA")
        const numberMatch = cleanLine.match(/^(\d+(?:[.,]\d+)?)\s*/);
        if (numberMatch) {
          quantity = parseFloat(numberMatch[1].replace(',', '.'));
          cleanLine = cleanLine.replace(numberMatch[0], '').trim();
        }
      }
    }

    // 6. Detectar unidad de medida después del número al inicio
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

    // 7. Detectar artículos pesados de ticket con peso en medio (ej: "PLATANO CANARIAS 1,250 kg")
    const weighedItemMatch = cleanLine.match(/(\d+[.,]\d{1,3})\s*(kg|kilos|g|gr)\b/i);
    if (weighedItemMatch) {
      quantity = parseFloat(weighedItemMatch[1].replace(',', '.'));
      unit = weighedItemMatch[2].toLowerCase().startsWith('g') ? 'gramos' : 'kg';
      cleanLine = cleanLine.replace(weighedItemMatch[0], '').trim();
    }

    // 8. Detectar unidad al final de la línea si no se encontró al inicio
    words = cleanLine.split(/\s+/);
    if (words.length >= 2) {
      const lastWordLower = words[words.length - 1].toLowerCase();
      const prevWordLower = (words[words.length - 2] || '').toLowerCase();
      const isClassOrSize = lastWordLower === 'l' && ['clase', 'talla', 'tamano', 'tamaño'].includes(prevWordLower);
      
      if (!isClassOrSize) {
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
    }

    // Quitar preposiciones residuales al principio ("de ", "del ")
    cleanLine = cleanLine.replace(/^(?:de|del|d)\s+/i, '').trim();

    // Si la línea quedó vacía o solo números/signos
    if (!cleanLine || cleanLine.length < 2 || /^[\d\W]+$/.test(cleanLine)) continue;

    // Normalizar tipografía del nombre del producto
    const productName = formatProductName(cleanLine);
    if (!productName || productName.length < 2) continue;

    // Cruzar con productos existentes en la despensa
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

    // Inferencia o asignación del precio
    let finalEstimatedPrice = extractedTicketPrice;
    if (finalEstimatedPrice === null || isNaN(finalEstimatedPrice)) {
      if (matchedPantryProd?.price || matchedPantryProd?.unitPriceMxn) {
        finalEstimatedPrice = matchedPantryProd.price || matchedPantryProd.unitPriceMxn;
      } else {
        // Precios referenciales según departamento si no venía en ticket
        finalEstimatedPrice = 45.0;
        if (department.includes('Carnes')) finalEstimatedPrice = 120.0;
        if (department.includes('Aceites') && prodLower.includes('oliva')) finalEstimatedPrice = 220.0;
        if (prodLower.includes('pimentón') || prodLower.includes('pimenton')) finalEstimatedPrice = 95.0;
        if (prodLower.includes('morcilla') || prodLower.includes('chorizo')) finalEstimatedPrice = 85.0;
        if (prodLower.includes('tocino')) finalEstimatedPrice = 55.0;
      }
    }

    // Asignación de Zona Destino
    const targetZone = matchedPantryProd?.zone || (
      department.includes('Carnes') ? 'Refrigerador' : 
      department.includes('Frutas') ? 'Alacena Fresca' : 
      department.includes('Lácteos') ? 'Refrigerador' :
      department.includes('Vinos') ? 'Cava Principal' :
      'Alacena Principal'
    );

    parsedItems.push({
      id: `shop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: productName,
      quantity,
      unit,
      department,
      store,
      estimatedPriceMxn: finalEstimatedPrice,
      realPrice: extractedTicketPrice,
      targetZone,
      matchedInPantry: Boolean(matchedPantryProd),
      checked: false,
    });
  }

  return parsedItems;
}
