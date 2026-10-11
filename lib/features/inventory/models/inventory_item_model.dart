class InventoryItem {
  final String id;
  final String householdId;
  final String zoneId;
  final String zoneName;
  final String name;
  final String category;
  final String barcode;
  final String qrCode;
  final String? nfcTagId;
  final int currentQuantity;
  final int idealQuantity;
  final int minAlertQuantity;
  final String unit;
  final double unitPrice; // Protegido para rol Admin
  final String currency;
  final bool isHighValue;
  final bool isSensitive;
  final String? imageUrl;
  final DateTime updatedAt;

  const InventoryItem({
    required this.id,
    required this.householdId,
    required this.zoneId,
    required this.zoneName,
    required this.name,
    required this.category,
    required this.barcode,
    required this.qrCode,
    this.nfcTagId,
    required this.currentQuantity,
    required this.idealQuantity,
    required this.minAlertQuantity,
    required this.unit,
    required this.unitPrice,
    this.currency = 'MXN',
    this.isHighValue = false,
    this.isSensitive = false,
    this.imageUrl,
    required this.updatedAt,
  });

  String get stockStatus {
    if (currentQuantity <= 0) return 'OUT_OF_STOCK';
    if (currentQuantity <= minAlertQuantity) return 'LOW';
    return 'OPTIMAL';
  }

  InventoryItem copyWith({
    int? currentQuantity,
    DateTime? updatedAt,
  }) {
    return InventoryItem(
      id: id,
      householdId: householdId,
      zoneId: zoneId,
      zoneName: zoneName,
      name: name,
      category: category,
      barcode: barcode,
      qrCode: qrCode,
      nfcTagId: nfcTagId,
      currentQuantity: currentQuantity ?? this.currentQuantity,
      idealQuantity: idealQuantity,
      minAlertQuantity: minAlertQuantity,
      unit: unit,
      unitPrice: unitPrice,
      currency: currency,
      isHighValue: isHighValue,
      isSensitive: isSensitive,
      imageUrl: imageUrl,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
