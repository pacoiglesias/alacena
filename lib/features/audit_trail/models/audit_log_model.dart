class AuditLog {
  final String id;
  final String householdId;
  final String itemId;
  final String itemName;
  final String userId;
  final String userEmail;
  final String userRole;
  final String action; // 'SCAN_CONSUME' | 'SCAN_RESTOCK' | 'MANUAL_ADJUST'
  final int previousQuantity;
  final int newQuantity;
  final int quantityDelta;
  final String scanMethod; // 'NFC' | 'QR' | 'MANUAL' | 'AI_VISION'
  final DateTime timestamp;

  const AuditLog({
    required this.id,
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
    required this.scanMethod,
    required this.timestamp,
  });
}
