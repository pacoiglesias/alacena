import 'package:cloud_firestore/cloud_firestore.dart';
import '../../hardware/services/deep_link_qr_service.dart';

/// Servicio de Inicialización Rápida (Botón Mágico "Cargar Datos Demo")
/// Sube a Firestore 10 productos reales en Pesos Mexicanos (MXN) con Deep Links alacena://item/123
/// y genera registros inmutables en el Audit Trail para validación inmediata sin teclear.
class DemoDataSeeder {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  static Future<void> seedDemoData({
    String workspaceId = 'casa-principal-saas',
    String householdId = 'residencia-lomas',
  }) async {
    final batch = _firestore.batch();
    final now = DateTime.now();

    // 10 Productos representativos de la despensa mexicana de alto valor
    final demoCatalog = [
      {
        'id': 'pantry_leche_01',
        'shortId': 'ALC-LCH1',
        'name': 'Leche Entera 1L',
        'brand': 'Lala 100 Sin Lactosa',
        'category': 'Lácteos & Refrigerador',
        'zoneId': 'refrigerador',
        'zoneName': 'Cuarto Frío / Cavas',
        'barcode': '7501020512345',
        'currentQuantity': 6,
        'idealQuantity': 12,
        'minAlertQuantity': 3,
        'unit': 'litros',
        'unitPrice': 38.50, // MXN
        'currency': 'MXN',
        'isHighValue': false,
        'expiryDate': now.add(const Duration(days: 6)),
      },
      {
        'id': 'pantry_arroz_02',
        'shortId': 'ALC-ARRZ',
        'name': 'Arroz Grano Largo Super Extra',
        'brand': 'Verde Valle',
        'category': 'Granos & Abarrotes',
        'zoneId': 'alacena-1',
        'zoneName': 'Alacena Principal',
        'barcode': '7501011115689',
        'currentQuantity': 4,
        'idealQuantity': 8,
        'minAlertQuantity': 2,
        'unit': 'bolsa 1kg',
        'unitPrice': 42.00, // MXN
        'currency': 'MXN',
        'isHighValue': false,
        'expiryDate': now.add(const Duration(days: 360)),
      },
      {
        'id': 'pantry_aceite_03',
        'shortId': 'ALC-OLIV',
        'name': 'Aceite de Oliva Extra Virgen 500ml',
        'brand': 'Oro Bailén Reserva',
        'category': 'Aceites & Gourmet',
        'zoneId': 'alacena-1',
        'zoneName': 'Alacena Principal',
        'barcode': '8410001234567',
        'currentQuantity': 3,
        'idealQuantity': 6,
        'minAlertQuantity': 2,
        'unit': 'botella 500ml',
        'unitPrice': 485.00, // MXN
        'currency': 'MXN',
        'isHighValue': true,
        'expiryDate': now.add(const Duration(days: 180)),
      },
      {
        'id': 'cava_vega_04',
        'shortId': 'ALC-VEGA',
        'name': 'Vino Tinto Vega Sicilia Único 2010',
        'brand': 'Bodegas Vega Sicilia',
        'category': 'Cava de Vinos',
        'zoneId': 'cava',
        'zoneName': 'Cava Subterránea',
        'barcode': '8414444000123',
        'currentQuantity': 4,
        'idealQuantity': 12,
        'minAlertQuantity': 3,
        'unit': 'botella 750ml',
        'unitPrice': 11800.00, // MXN
        'currency': 'MXN',
        'isHighValue': true,
        'expiryDate': now.add(const Duration(days: 1800)),
      },
      {
        'id': 'cava_matarromera_05',
        'shortId': 'ALC-MATR',
        'name': 'Vino Tinto Matarromera Crianza',
        'brand': 'Bodegas Matarromera',
        'category': 'Cava de Vinos',
        'zoneId': 'cava',
        'zoneName': 'Cava Subterránea',
        'barcode': '8420000112233',
        'currentQuantity': 8,
        'idealQuantity': 18,
        'minAlertQuantity': 4,
        'unit': 'botella 750ml',
        'unitPrice': 850.00, // MXN
        'currency': 'MXN',
        'isHighValue': false,
        'expiryDate': now.add(const Duration(days: 900)),
      },
      {
        'id': 'pantry_queso_06',
        'shortId': 'ALC-PRMG',
        'name': 'Queso Parmigiano Reggiano DOP 24 Meses',
        'brand': 'Zanetti',
        'category': 'Lácteos & Gourmet',
        'zoneId': 'refrigerador',
        'zoneName': 'Cuarto Frío / Cavas',
        'barcode': '8001234567890',
        'currentQuantity': 2,
        'idealQuantity': 5,
        'minAlertQuantity': 1,
        'unit': 'cuña 500g',
        'unitPrice': 620.00, // MXN
        'currency': 'MXN',
        'isHighValue': true,
        'expiryDate': now.add(const Duration(days: 4)), // Por caducar (Zero-Waste)
      },
      {
        'id': 'pantry_jabon_07',
        'shortId': 'ALC-JABN',
        'name': 'Detergente Líquido Ropa Delicada 3L',
        'brand': 'Woolite Bebé',
        'category': 'Insumos & Limpieza',
        'zoneId': 'alacena-1',
        'zoneName': 'Alacena Principal',
        'barcode': '7501001122889',
        'currentQuantity': 2,
        'idealQuantity': 4,
        'minAlertQuantity': 1,
        'unit': 'botella 3L',
        'unitPrice': 245.00, // MXN
        'currency': 'MXN',
        'isHighValue': false,
        'expiryDate': now.add(const Duration(days: 720)),
      },
      {
        'id': 'pantry_cafe_08',
        'shortId': 'ALC-CAFE',
        'name': 'Café de Grano Geisha Chiapas Especialidad',
        'brand': 'Finca Santa Fe',
        'category': 'Cafetería & Despensa',
        'zoneId': 'alacena-1',
        'zoneName': 'Alacena Principal',
        'barcode': '7501009988771',
        'currentQuantity': 1, // Stock bajo
        'idealQuantity': 4,
        'minAlertQuantity': 2,
        'unit': 'bolsa 500g',
        'unitPrice': 580.00, // MXN
        'currency': 'MXN',
        'isHighValue': false,
        'expiryDate': now.add(const Duration(days: 90)),
      },
      {
        'id': 'pantry_jamon_09',
        'shortId': 'ALC-JMON',
        'name': 'Jamón Ibérico 100% Bellota 5 Jotas',
        'brand': 'Cinco Jotas',
        'category': 'Charcutería & Gourmet',
        'zoneId': 'refrigerador',
        'zoneName': 'Cuarto Frío / Cavas',
        'barcode': '8410500112233',
        'currentQuantity': 3,
        'idealQuantity': 6,
        'minAlertQuantity': 2,
        'unit': 'sobre 80g',
        'unitPrice': 690.00, // MXN
        'currency': 'MXN',
        'isHighValue': true,
        'expiryDate': now.add(const Duration(days: 2)), // Muy próximo a caducar
      },
      {
        'id': 'pantry_agua_10',
        'shortId': 'ALC-AGUA',
        'name': 'Agua Mineral de Manantial 750ml (Caja 12)',
        'brand': 'San Pellegrino',
        'category': 'Bebidas & Bodega',
        'zoneId': 'alacena-1',
        'zoneName': 'Alacena Principal',
        'barcode': '8002270012345',
        'currentQuantity': 5,
        'idealQuantity': 10,
        'minAlertQuantity': 3,
        'unit': 'caja 12 pzas',
        'unitPrice': 540.00, // MXN
        'currency': 'MXN',
        'isHighValue': false,
        'expiryDate': now.add(const Duration(days: 365)),
      },
    ];

    // Subir cada producto con aislamiento Multi-Tenant y separación de precios
    for (final item in demoCatalog) {
      final itemId = item['id'] as String;
      final deepLink = DeepLinkQrService.formatItemDeepLink(itemId, workspaceId: workspaceId);

      // 1. Documento Operativo de Inventario (Accesible por Admin y Servicio)
      final itemRef = _firestore
          .collection('workspaces')
          .doc(workspaceId)
          .collection('households')
          .doc(householdId)
          .collection('items')
          .doc(itemId);

      batch.set(itemRef, {
        'id': itemId,
        'shortId': item['shortId'],
        'workspaceId': workspaceId,
        'householdId': householdId,
        'zoneId': item['zoneId'],
        'zoneName': item['zoneName'],
        'name': item['name'],
        'brand': item['brand'],
        'category': item['category'],
        'barcode': item['barcode'],
        'qrCode': deepLink,
        'previousQrCodes': <String>[],
        'requiresMetadataUpdate': false,
        'currentQuantity': item['currentQuantity'],
        'idealQuantity': item['idealQuantity'],
        'minAlertQuantity': item['minAlertQuantity'],
        'unit': item['unit'],
        'isHighValue': item['isHighValue'],
        'expiryDate': item['expiryDate'],
        'updatedAt': FieldValue.serverTimestamp(),
      });

      // 2. Subdocumento Financiero Privado (Restringido EXCLUSIVAMENTE a Admin en firestore.rules)
      final pricingRef = itemRef.collection('private_financial').doc('pricing');
      final unitPrice = (item['unitPrice'] as num).toDouble();
      final currentQty = item['currentQuantity'] as int;

      batch.set(pricingRef, {
        'unitPrice': unitPrice,
        'currency': 'MXN',
        'totalInventoryValue': unitPrice * currentQty,
        'lastPurchasePlace': 'City Market / Costco',
        'lastPurchasedAt': now.subtract(const Duration(days: 3)),
        'priceHistory': [
          {
            'price': unitPrice * 0.94,
            'place': 'City Market',
            'date': now.subtract(const Duration(days: 35)),
            'currency': 'MXN',
          },
          {
            'price': unitPrice,
            'place': 'City Market',
            'date': now.subtract(const Duration(days: 3)),
            'currency': 'MXN',
          },
        ],
      });

      // 3. Registro inicial en el Audit Trail Inalterable (Append-Only)
      final auditRef = _firestore
          .collection('workspaces')
          .doc(workspaceId)
          .collection('households')
          .doc(householdId)
          .collection('audit_trail')
          .doc();

      batch.set(auditRef, {
        'id': auditRef.id,
        'workspaceId': workspaceId,
        'householdId': householdId,
        'itemId': itemId,
        'itemName': item['name'],
        'userId': 'admin-master',
        'userEmail': 'admin@alacena.cobertores.com',
        'userRole': 'admin',
        'action': 'CREATE_ITEM',
        'previousQuantity': 0,
        'newQuantity': currentQty,
        'quantityDelta': currentQty,
        'unitPriceAtMoment': unitPrice,
        'economicValueDelta': unitPrice * currentQty,
        'currency': 'MXN',
        'scanMethod': 'DATA_SEEDER_WIZARD',
        'timestamp': FieldValue.serverTimestamp(),
      });
    }

    // 4. Crear 2 sugerencias activas en Live Shopping List
    final shoppingRef = _firestore
        .collection('workspaces')
        .doc(workspaceId)
        .collection('households')
        .doc(householdId)
        .collection('shopping_list')
        .doc('shop_cafe_seed');

    batch.set(shoppingRef, {
      'id': 'shop_cafe_seed',
      'workspaceId': workspaceId,
      'householdId': householdId,
      'itemId': 'pantry_cafe_08',
      'name': 'Café de Grano Geisha Chiapas Especialidad',
      'category': 'Cafetería & Despensa',
      'neededQuantity': 3,
      'unit': 'bolsa 500g',
      'estimatedPrice': 580.00,
      'currency': 'MXN',
      'isPurchased': false,
      'isLocked': false,
      'lockedBy': null,
      'source': 'LOW_STOCK_RULE',
      'createdAt': FieldValue.serverTimestamp(),
    });

    await batch.commit();
  }
}
