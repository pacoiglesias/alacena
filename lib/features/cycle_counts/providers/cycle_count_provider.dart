import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../models/cycle_count_model.dart';
import '../../inventory/providers/inventory_provider.dart';
import '../../inventory/models/inventory_adjustment_model.dart';
import '../../audit_trail/models/audit_log_model.dart';
import '../../audit_trail/providers/audit_trail_provider.dart';
import '../../auth/providers/auth_provider.dart';

class CycleCountNotifier extends Notifier<CycleCountSession?> {
  @override
  CycleCountSession? build() => null;

  /// Inicia una nueva sesión de conteo cíclico tomando los productos de la zona/categoría
  void startSession({
    required String workspaceId,
    required String householdId,
    required String zoneOrCategory,
  }) {
    final allItems = ref.read(inventoryListProvider);
    final targetItems = allItems.where((i) =>
        i.householdId == householdId &&
        (zoneOrCategory == 'TODAS' || i.zoneId == zoneOrCategory || i.category == zoneOrCategory || i.zoneName == zoneOrCategory)).toList();

    final sessionEntries = targetItems.map((item) {
      return CycleCountItemEntry(
        itemId: item.id,
        itemName: item.name,
        expectedQuantity: item.currentQuantity,
        countedQuantity: item.currentQuantity, // default inicial
        unitPrice: item.unitPrice,
        isVerified: false,
      );
    }).toList();

    final user = ref.read(authProvider);

    state = CycleCountSession(
      id: const Uuid().v4(),
      workspaceId: workspaceId,
      householdId: householdId,
      targetZoneOrCategory: zoneOrCategory,
      status: CycleCountStatus.inProgress,
      items: sessionEntries,
      conductedByUserId: user?.uid ?? 'admin',
      startedAt: DateTime.now(),
    );
  }

  /// Actualiza el conteo verificado de un ítem dentro de la sesión activa
  void recordCount(String itemId, int countedQty) {
    if (state == null) return;

    final updatedItems = state!.items.map((entry) {
      if (entry.itemId == itemId) {
        return entry.copyWith(
          countedQuantity: countedQty,
          isVerified: true,
        );
      }
      return entry;
    }).toList();

    state = state!.copyWith(items: updatedItems);
  }

  /// Reconciliación Automática: aplica los deltas al inventario real y sella el Audit Trail
  void reconcileSession() {
    if (state == null) return;

    final session = state!;
    final inventoryNotifier = ref.read(inventoryListProvider.notifier);
    final auditTrailNotifier = ref.read(auditTrailProvider.notifier);
    final user = ref.read(authProvider);

    for (final entry in session.items) {
      if (entry.isVerified && entry.variance != 0) {
        // 1. Ajustar stock en inventario
        inventoryNotifier.adjustStock(
          entry.itemId,
          entry.variance,
          scanMethod: 'CYCLE_COUNT_RECONCILIATION',
        );

        // 2. Sellar auditoría como CORRECCION_CONTEO
        final log = AuditLog(
          id: const Uuid().v4(),
          householdId: session.householdId,
          itemId: entry.itemId,
          itemName: entry.itemName,
          userId: user?.uid ?? 'admin',
          userEmail: user?.email ?? 'admin@alacena.cobertores.com',
          userRole: user?.role.name ?? 'admin',
          action: AdjustmentType.correccionConteo.code,
          previousQuantity: entry.expectedQuantity,
          newQuantity: entry.countedQuantity ?? entry.expectedQuantity,
          quantityDelta: entry.variance,
          unitPriceAtMoment: entry.unitPrice,
          economicValueDelta: entry.financialDiscrepancy,
          currency: 'MXN',
          scanMethod: 'CYCLE_COUNT_SESSION',
          timestamp: DateTime.now(),
        );

        auditTrailNotifier.addLog(log);
      }
    }

    state = session.copyWith(
      status: CycleCountStatus.reconciled,
      completedAt: DateTime.now(),
    );
  }

  void cancelSession() {
    state = null;
  }
}

final cycleCountProvider = NotifierProvider<CycleCountNotifier, CycleCountSession?>(() {
  return CycleCountNotifier();
});
