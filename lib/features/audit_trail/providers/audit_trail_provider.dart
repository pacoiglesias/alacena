import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/audit_log_model.dart';

class AuditTrailNotifier extends Notifier<List<AuditLog>> {
  @override
  List<AuditLog> build() {
    return [
      AuditLog(
        id: 'log_01',
        householdId: 'casa-principal',
        itemId: 'item_01',
        itemName: 'Vino Vega Sicilia Único 2010',
        userId: 'admin_demo_01',
        userEmail: 'paco@cobertores.com',
        userRole: 'admin',
        action: 'SCAN_CONSUME',
        previousQuantity: 6,
        newQuantity: 5,
        quantityDelta: -1,
        scanMethod: 'NFC',
        timestamp: DateTime.now().subtract(const Duration(minutes: 42)),
      ),
      AuditLog(
        id: 'log_02',
        householdId: 'casa-principal',
        itemId: 'item_02',
        itemName: 'Aceite de Oliva Virgen Extra Oro Bailén 500ml',
        userId: 'service_staff_03',
        userEmail: 'cocina@cobertores.com',
        userRole: 'service',
        action: 'SCAN_CONSUME',
        previousQuantity: 4,
        newQuantity: 3,
        quantityDelta: -1,
        scanMethod: 'QR',
        timestamp: DateTime.now().subtract(const Duration(hours: 3)),
      ),
    ];
  }

  void addLog(AuditLog log) {
    // Append-only (el nuevo evento va al inicio para la vista de timeline)
    state = [log, ...state];
  }
}

final auditTrailProvider = NotifierProvider<AuditTrailNotifier, List<AuditLog>>(() {
  return AuditTrailNotifier();
});
