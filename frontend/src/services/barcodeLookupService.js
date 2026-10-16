import { extractCodeFromScan } from '../utils/scanHelper';
import { findLearnedProduct } from './learningService';

// A code identifies a product, never its current shop price.
// Consult the household's own memory first; an unknown code stays unknown.
export async function lookupBarcode(rawBarcode) {
  const code = extractCodeFromScan(rawBarcode);
  if (!code) return null;
  const learned = findLearnedProduct(code);
  if (learned) return { ...learned, barcode: code, price: learned.unitPriceMxn || 0, source: 'MEMORIZED_HISTORY' };
  const fallback = { barcode: code, name: '', category: 'Abarrotes', unit: 'piezas', price: 0,
    zone: 'Alacena Principal', source: 'NEW_CODE', needsName: true };
  if (!/^\d{8,14}$/.test(code) || (typeof navigator !== 'undefined' && !navigator.onLine)) return fallback;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch('https://world.openfoodfacts.org/api/v2/product/' + code + '.json?fields=product_name,product_name_es,brands,categories,image_front_small_url', { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) return fallback;
    const data = await response.json();
    const product = data.product;
    const name = product?.product_name_es || product?.product_name;
    if (data.status !== 1 || !name?.trim()) return fallback;
    return { ...fallback, name: name.trim(), brand: product.brands || '',
      photo: product.image_front_small_url || null, source: 'INTERNET_OPENFOODFACTS', needsName: false };
  } catch { return fallback; }
  finally { clearTimeout(timeout); }
}
