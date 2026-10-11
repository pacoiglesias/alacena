import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../models/inventory_item_model.dart';
import '../data/starter_pantry_catalog.dart';
import '../../households/providers/household_provider.dart';
import '../../audit_trail/models/audit_log_model.dart';
import '../../audit_trail/providers/audit_trail_provider.dart';
import '../../auth/providers/auth_provider.dart';

class InventoryNotifier extends Notifier<List<InventoryItem>> {
  @override
  List<InventoryItem> build() {
    return [
      InventoryItem(
        id: 'item_01',
        householdId: 'casa-principal',
        zoneId: 'cava',
        zoneName: 'Cava Subterránea',
        name: 'Vino Vega Sicilia Único 2010',
        category: 'Vinos & Cava',
        barcode: '8414444000123',
        qrCode: 'ALACENA:casa-principal:cava:item_01',
        nfcTagId: '04:5A:2F:B2:89:12:80',
        currentQuantity: 5,
        idealQuantity: 12,
        minAlertQuantity: 3,
        unit: 'botella',
        unitPrice: 8500.00,
        isHighValue: true,
        isSensitive: true,
        updatedAt: DateTime.now(),
      ),
      InventoryItem(
        id: 'item_02',
        householdId: 'casa-principal',
        zoneId: 'alacena-1',
        zoneName: 'Alacena Principal',
        name: 'Aceite de Oliva Extra Virgen Oro Bailén',
        category: 'Despensa Gourmet',
        barcode: '8410001234567',
        qrCode: 'ALACENA:casa-principal:alacena-1:item_02',
        currentQuantity: 3,
        idealQuantity: 8,
        minAlertQuantity: 2,
        unit: 'botella 500ml',
        unitPrice: 480.00,
        updatedAt: DateTime.now(),
      ),
      InventoryItem(
        id: 'item_03',
        householdId: 'casa-principal',
        zoneId: 'refrigerador',
        zoneName: 'Cuarto Frío / Cavas',
        name: 'Queso Parmigiano Reggiano 24 Meses DOP',
        category: 'Lácteos & Quesos',
        barcode: '8001234567890',
        qrCode: 'ALACENA:casa-principal:refrigerador:item_03',
        currentQuantity: 1,
        idealQuantity: 4,
        minAlertQuantity: 1, // Stock bajo
        unit: 'pieza 1kg',
        unitPrice: 950.00,
        updatedAt: DateTime.now(),
      ),
      InventoryItem(
        id: 'item_04',
        householdId: 'casa-principal',
        zoneId: 'alacena-1',
        zoneName: 'Alacena Principal',
        name: 'Café de Grano Geisha Especialidad',
        category: 'Café & Té',
        barcode: '7501234567891',
        qrCode: 'ALACENA:casa-principal:alacena-1:item_04',
        currentQuantity: 0, // Agotado
        idealQuantity: 5,
        minAlertQuantity: 2,
        unit: 'bolsa 500g',
        unitPrice: 650.00,
        updatedAt: DateTime.now(),
      ),
      InventoryItem(
        id: 'item_05',
        householdId: 'casa-valle',
        zoneId: 'cava-valle',
        zoneName: 'Cava Piedra',
        name: 'Mezcal Ojo de Tigre Reposado',
        category: 'Destilados',
        barcode: '7509876543210',
        qrCode: 'ALACENA:casa-valle:cava-valle:item_05',
        currentQuantity: 4,
        idealQuantity: 6,
        minAlertQuantity: 2,
        unit: 'botella 750ml',
        unitPrice: 620.00,
        updatedAt: DateTime.now(),
      ),
    ];
  }

  /// Descontar o reabastecer stock con registro automatico en Audit Trail
  bool adjustStock(String itemId, int delta, {required String scanMethod}) {
    final index = state.indexWhere((i) => i.id == itemId);
    if (index == -1) return false;

    final item = state[index];
    final newQty = item.currentQuantity + delta;
    if (newQty < 0) return false; // Evita stock negativo

    final updatedItem = item.copyWith(
      currentQuantity: newQty,
      updatedAt: DateTime.now(),
    );

    state = [
      for (int i = 0; i < state.length; i++)
        if (i == index) updatedItem else state[i],
    ];

    // Registrar en Audit Trail inalterable
    final user = ref.read(authProvider);
    final auditLog = AuditLog(
      id: const Uuid().v4(),
      householdId: item.householdId,
      itemId: item.id,
      itemName: item.name,
      userId: user?.uid ?? 'anonimo',
      userEmail: user?.email ?? 'anonimo',
      userRole: user?.role.name ?? 'service',
      action: delta < 0 ? 'SCAN_CONSUME' : 'SCAN_RESTOCK',
      previousQuantity: item.currentQuantity,
      newQuantity: newQty,
      quantityDelta: delta,
      unitPriceAtMoment: item.unitPrice,
      economicValueDelta: delta * item.unitPrice,
      currency: item.currency,
      scanMethod: scanMethod,
      timestamp: DateTime.now(),
    );

    ref.read(auditTrailProvider.notifier).addLog(auditLog);
    return true;
  }

  /// Autorellenar con productos típicos de alacena y cava de forma automática
  void populateStarterPack(String householdId) {
    final starterItems = StarterPantryCatalog.getStarterItems(householdId);
    final otherItems = state.where((i) => i.householdId != householdId).toList();
    state = [...otherItems, ...starterItems];

    final user = ref.read(authProvider);
    ref.read(auditTrailProvider.notifier).addLog(
      AuditLog(
        id: const Uuid().v4(),
        householdId: householdId,
        itemId: 'batch_seed',
        itemName: 'Autorelleno Inteligente (${starterItems.length} artículos)',
        userId: user?.uid ?? 'admin',
        userEmail: user?.email ?? 'admin',
        userRole: user?.role.name ?? 'admin',
        action: 'CREATE_ITEM',
        previousQuantity: 0,
        newQuantity: starterItems.length,
        quantityDelta: starterItems.length,
        scanMethod: 'AUTO_SEED',
        timestamp: DateTime.now(),
      ),
    );
  }

  /// Agregar un artículo nuevo al inventario con registro en Audit Trail
  void addItem(InventoryItem newItem) {
    state = [newItem, ...state];
    final user = ref.read(authProvider);
    ref.read(auditTrailProvider.notifier).addLog(
      AuditLog(
        id: const Uuid().v4(),
        householdId: newItem.householdId,
        itemId: newItem.id,
        itemName: newItem.name,
        userId: user?.uid ?? 'admin',
        userEmail: user?.email ?? 'admin@alacena.cobertores.com',
        userRole: user?.role.name ?? 'admin',
        action: 'CREATE_ITEM',
        previousQuantity: 0,
        newQuantity: newItem.currentQuantity,
        quantityDelta: newItem.currentQuantity,
        unitPriceAtMoment: newItem.unitPrice,
        economicValueDelta: newItem.currentQuantity * newItem.unitPrice,
        currency: newItem.currency,
        scanMethod: 'EAN_GLOBAL_LOOKUP',
        timestamp: DateTime.now(),
      ),
    );
  }

  /// Flujo "Replace Tag": Asigna un QR nuevo ("Blank Tag") a un producto existente cuyo QR original se dañó
  /// Invalida el anterior pero mantiene intacto el Audit Trail y trazabilidad histórica.
  bool replaceTag(String itemId, String newQrCode) {
    final index = state.indexWhere((i) => i.id == itemId);
    if (index == -1) return false;

    final item = state[index];
    final updatedItem = item.copyWith(
      qrCode: newQrCode,
      previousQrCodes: [...item.previousQrCodes, item.qrCode],
      updatedAt: DateTime.now(),
    );

    state = [
      for (int i = 0; i < state.length; i++)
        if (i == index) updatedItem else state[i],
    ];

    final user = ref.read(authProvider);
    ref.read(auditTrailProvider.notifier).addLog(
      AuditLog(
        id: const Uuid().v4(),
        householdId: item.householdId,
        itemId: item.id,
        itemName: item.name,
        userId: user?.uid ?? 'admin',
        userEmail: user?.email ?? 'admin@alacena.cobertores.com',
        userRole: user?.role.name ?? 'admin',
        action: 'REPLACE_TAG',
        previousQuantity: item.currentQuantity,
        newQuantity: item.currentQuantity,
        quantityDelta: 0,
        unitPriceAtMoment: item.unitPrice,
        economicValueDelta: 0,
        currency: item.currency,
        scanMethod: 'TAG_REPLACEMENT',
        timestamp: DateTime.now(),
      ),
    );
    return true;
  }

  /// Procesa una lista de códigos escaneados en Modo Continuo (Batch/Rapid Scan)
  int batchAdjustStock(List<String> codes, {int delta = 1, required String scanMethod}) {
    int processedCount = 0;
    for (final code in codes) {
      final clean = code.trim();
      final index = state.indexWhere((i) =>
          i.qrCode == clean ||
          i.barcode == clean ||
          i.id == clean ||
          i.effectiveShortId == clean.toUpperCase() ||
          clean.contains(i.id));

      if (index != -1) {
        adjustStock(state[index].id, delta, scanMethod: scanMethod);
        processedCount++;
      }
    }
    return processedCount;
  }
}

final inventoryListProvider = NotifierProvider<InventoryNotifier, List<InventoryItem>>(() {
  return InventoryNotifier();
});

class SearchQueryNotifier extends Notifier<String> {
  @override
  String build() => '';

  void setQuery(String query) => state = query;
}

final searchQueryProvider = NotifierProvider<SearchQueryNotifier, String>(() {
  return SearchQueryNotifier();
});

final filteredInventoryProvider = Provider<List<InventoryItem>>((ref) {
  final items = ref.watch(inventoryListProvider);
  final household = ref.watch(selectedHouseholdProvider);
  final selectedZone = ref.watch(selectedZoneProvider);
  final query = ref.watch(searchQueryProvider).toLowerCase();

  return items.where((item) {
    if (item.householdId != household.id) return false;
    if (selectedZone != 'all' && item.zoneId != selectedZone) return false;
    if (query.isNotEmpty) {
      final matchName = item.name.toLowerCase().contains(query);
      final matchCat = item.category.toLowerCase().contains(query);
      final matchZone = item.zoneName.toLowerCase().contains(query);
      if (!matchName && !matchCat && !matchZone) return false;
    }
    return true;
  }).toList();
});
