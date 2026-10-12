// Servicio de Catálogos Dinámicos y Opciones Desplegables del Hogar
// Persistencia en LocalStorage con respaldo y sincronización

export const DEFAULT_STORES = [
  { id: 'store-1', name: 'Costco Wholesale', category: 'Club de Precios', icon: '🛒', isDefault: true },
  { id: 'store-2', name: 'City Market', category: 'Gourmet & Cortes', icon: '🏪', isDefault: false },
  { id: 'store-3', name: "Sam's Club", category: 'Club de Precios', icon: '🏬', isDefault: false },
  { id: 'store-4', name: 'Chedraui Selecto', category: 'Supermercado Premium', icon: '🛍️', isDefault: false },
  { id: 'store-5', name: 'La Comer', category: 'Supermercado', icon: '🛒', isDefault: false },
  { id: 'store-6', name: 'Walmart Express', category: 'Supermercado Rápido', icon: '🏪', isDefault: false },
  { id: 'store-7', name: 'Central de Abastos / Mercado Local', category: 'Perecederos & Frescos', icon: '🥬', isDefault: false },
  { id: 'store-8', name: 'Carnicería & Pescadería Local', category: 'Proteínas Frescas', icon: '🥩', isDefault: false },
  { id: 'store-9', name: 'Panadería Artesanal & Tostador Local', category: 'Especialidades', icon: '🥖', isDefault: false },
  { id: 'store-10', name: 'Vinoteca / Cava Especializada', category: 'Vinos & Licores', icon: '🍷', isDefault: false },
];

export const DEFAULT_STAFF = [
  { id: 'staff-1', name: 'María (Jefa de Cocina)', role: 'Cocinera Mayor', icon: '👩‍🍳', isDefault: true },
  { id: 'staff-2', name: 'Chef Carlos (Parrilla & Cava)', role: 'Sommelier & Parrilla', icon: '👨‍🍳', isDefault: false },
  { id: 'staff-3', name: 'Lupita (Servicio & Despensa)', role: 'Ama de Llaves', icon: '🧹', isDefault: false },
  { id: 'staff-4', name: 'Chofer / Comprador', role: 'Abastecimiento Externo', icon: '🚗', isDefault: false },
  { id: 'staff-5', name: 'Paco I. (Administrador General)', role: 'Patrón / Titular', icon: '👑', isDefault: false },
];

export const DEFAULT_CATEGORIES = [
  'Abarrotes',
  'Carnes & Proteínas',
  'Pescados & Mariscos',
  'Lácteos & Quesos',
  'Vinos & Licores',
  'Bebidas Calientes',
  'Frutas & Verduras',
  'Especias & Panadería',
  'Limpieza & Hogar',
  'Cuidado Personal',
];

export const DEFAULT_UNITS = [
  { id: 'kg', label: 'Kilogramos (kg)', short: 'kg' },
  { id: 'g', label: 'Gramos (g)', short: 'g' },
  { id: 'litros', label: 'Litros (L)', short: 'L' },
  { id: 'ml', label: 'Mililitros (ml)', short: 'ml' },
  { id: 'piezas', label: 'Piezas (pza)', short: 'pza' },
  { id: 'botellas', label: 'Botellas', short: 'bot' },
  { id: 'paquetes', label: 'Paquetes', short: 'paq' },
  { id: 'sobres', label: 'Sobres', short: 'sobre' },
  { id: 'latas', label: 'Latas', short: 'lata' },
  { id: 'cajas', label: 'Cajas', short: 'caja' },
];

const STORAGE_KEY = 'alacena_system_catalogs_v1';

export function getCatalogs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        stores: parsed.stores || DEFAULT_STORES,
        staff: parsed.staff || DEFAULT_STAFF,
        categories: parsed.categories || DEFAULT_CATEGORIES,
        units: parsed.units || DEFAULT_UNITS,
      };
    }
  } catch (e) {
    console.error('Error al leer catálogos de localStorage:', e);
  }
  return {
    stores: DEFAULT_STORES,
    staff: DEFAULT_STAFF,
    categories: DEFAULT_CATEGORIES,
    units: DEFAULT_UNITS,
  };
}

export function saveCatalogs(catalogs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(catalogs));
    window.dispatchEvent(new CustomEvent('alacena_catalogs_updated', { detail: catalogs }));
    return true;
  } catch (e) {
    console.error('Error al guardar catálogos en localStorage:', e);
    return false;
  }
}

export function addCustomStore(name, category = 'Supermercado', icon = '🏪') {
  if (!name || !name.trim()) return null;
  const catalogs = getCatalogs();
  const trimmed = name.trim();
  const existing = catalogs.stores.find((s) => s.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing;

  const newStore = {
    id: `store-${Date.now()}`,
    name: trimmed,
    category,
    icon,
    isDefault: false,
  };
  catalogs.stores.push(newStore);
  saveCatalogs(catalogs);
  return newStore;
}

export function addCustomStaff(name, role = 'Personal de Servicio', icon = '👤') {
  if (!name || !name.trim()) return null;
  const catalogs = getCatalogs();
  const trimmed = name.trim();
  const existing = catalogs.staff.find((s) => s.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing;

  const newPerson = {
    id: `staff-${Date.now()}`,
    name: trimmed,
    role,
    icon,
    isDefault: false,
  };
  catalogs.staff.push(newPerson);
  saveCatalogs(catalogs);
  return newPerson;
}
