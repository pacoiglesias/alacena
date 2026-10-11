class AuditLog {
  final String id;
  final String tenantId;
  final String householdId;
  final String itemId;
  final String itemName;
  final String userId;
  final String userEmail;
  final String userRole;
  final String action; // 'SCAN_CONSUME' | 'SCAN_RESTOCK' | 'MANUAL_ADJUST' | 'AUTO_SEED'
  final int previousQuantity;
  final int newQuantity;
  final int quantityDelta;
  
  // Trazabilidad Económica
  final double unitPriceAtMoment;
  final double economicValueDelta; // quantityDelta * unitPriceAtMoment
  final String currency;

  final String scanMethod; // 'NFC' | 'QR' | 'EAN' | 'MANUAL' | 'AI_VISION'
  final DateTime timestamp;

  const AuditLog({
    required this.id,
    this.tenantId = 'tenant_default',
    required this.householdId,
    required this.itemId,
    required this.itemName,
    required this.userId,
    required this.userEmail,
    required this.userRole,
    required this.action,
    required this.previousQuantity,
    required this.newQuantity,
    required this.quantityDelta,
    this.unitPriceAtMoment = 0.0,
    this.economicValueDelta = 0.0,
    this.currency = 'MXN',
    required this.scanMethod,
    required this.timestamp,
  });
}
