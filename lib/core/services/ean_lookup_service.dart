import 'package:dio/dio.dart';

class EanProductResult {
  final String barcode;
  final String name;
  final String brand;
  final String? imageUrl;
  final String category;
  final String packageQuantity;
  final double estimatedPrice;

  const EanProductResult({
    required this.barcode,
    required this.name,
    required this.brand,
    this.imageUrl,
    this.category = 'Abarrotes',
    this.packageQuantity = '1 pza',
    this.estimatedPrice = 0.0,
  });
}

/// Servicio $0 Costo para resolución global de Códigos de Barras comerciales (EAN-13 / UPC)
/// Consulta OpenFoodFacts API (Pública y Gratuita) con caché en memoria.
class EanLookupService {
  static final Dio _dio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 4),
      receiveTimeout: const Duration(seconds: 4),
      headers: {
        'User-Agent': 'AlacenaApp/1.0 (admin@alacena.cobertores.com)',
      },
    ),
  );

  // Caché en memoria para evitar llamadas redundantes de red ($0 costo de datos)
  static final Map<String, EanProductResult> _localEanCache = {};

  static Future<EanProductResult?> lookupBarcode(String barcode) async {
    final cleanCode = barcode.trim().replaceAll(RegExp(r'[^0-9]'), '');
    if (cleanCode.length < 8) return null;

    if (_localEanCache.containsKey(cleanCode)) {
      return _localEanCache[cleanCode];
    }

    try {
      final url = 'https://world.openfoodfacts.org/api/v2/product/$cleanCode.json';
      final response = await _dio.get(url);

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        final status = data['status'];

        if (status == 1 && data['product'] != null) {
          final p = data['product'] as Map<String, dynamic>;
          final name = p['product_name_es'] ??
              p['product_name'] ??
              p['generic_name_es'] ??
              p['generic_name'] ??
              'Producto $cleanCode';
          final brand = p['brands'] ?? 'Marca Estándar';
          final imageUrl = p['image_front_small_url'] ?? p['image_url'];
          final quantity = p['quantity'] ?? '1 pza';

          final result = EanProductResult(
            barcode: cleanCode,
            name: name.toString(),
            brand: brand.toString(),
            imageUrl: imageUrl?.toString(),
            packageQuantity: quantity.toString(),
            category: _inferCategory(p),
            estimatedPrice: 45.0,
          );

          _localEanCache[cleanCode] = result;
          return result;
        }
      }
    } catch (_) {
      // Si falla la red o no existe en la base global, retornar fallback
    }

    // Fallback simulado para productos de despensa mexicana común si no hay internet
    final mockFallback = _getMockFallback(cleanCode);
    if (mockFallback != null) {
      _localEanCache[cleanCode] = mockFallback;
      return mockFallback;
    }

    return null;
  }

  static String _inferCategory(Map<String, dynamic> p) {
    final cats = (p['categories_tags'] as List?)?.join(' ').toLowerCase() ?? '';
    if (cats.contains('wine') || cats.contains('vino') || cats.contains('alcohol')) return 'Vinos';
    if (cats.contains('dairy') || cats.contains('lacteo') || cats.contains('cheese')) return 'Lácteos';
    if (cats.contains('meat') || cats.contains('carne') || cats.contains('jamon')) return 'Carnes';
    if (cats.contains('beverage') || cats.contains('bebida') || cats.contains('juice')) return 'Bebidas';
    return 'Abarrotes';
  }

  static EanProductResult? _getMockFallback(String code) {
    final mockCatalog = {
      '7501000111203': const EanProductResult(
        barcode: '7501000111203',
        name: 'Leche Entera 1L',
        brand: 'Lala',
        category: 'Lácteos',
        packageQuantity: '1 Litro',
        estimatedPrice: 28.50,
      ),
      '7501011115689': const EanProductResult(
        barcode: '7501011115689',
        name: 'Arroz Grano Largo 1kg',
        brand: 'Verde Valle',
        category: 'Abarrotes',
        packageQuantity: '1 Kg',
        estimatedPrice: 38.00,
      ),
      '8410013000017': const EanProductResult(
        barcode: '8410013000017',
        name: 'Aceite de Oliva Extra Virgen 500ml',
        brand: 'Carbonell',
        category: 'Aceites',
        packageQuantity: '500 ml',
        estimatedPrice: 195.00,
      ),
    };
    return mockCatalog[code];
  }
}
