class PriceRecord {
  final double price;
  final String place;
  final DateTime date;
  final String currency;

  const PriceRecord({
    required this.price,
    required this.place,
    required this.date,
    this.currency = 'MXN',
  });
}

class InventoryItem {
  final String id;
  final String tenantId;
  final String householdId;
  final String zoneId;
  final String zoneName;
  final String name;
  final String? brand;
  final String category;
  final String barcode; // EAN-13 o UPC comercial
  final String qrCode;  // QR Interno único
  final String? nfcTagId;
  final int currentQuantity;
  final int idealQuantity;
  final int minAlertQuantity;
  final String unit;
  
  // Finanzas e Inflación
  final double unitPrice; // Protegido para rol Admin
  final String currency;
  final String? lastPurchasePlace; // Costco, City Market, etc.
  final DateTime? lastPurchasedAt;
  final List<PriceRecord> priceHistory;

  // Seguridad y Zero-Waste
  final bool isHighValue;
  final bool isSensitive;
  final DateTime? expiryDate;
  final String? imageUrl;
  final DateTime updatedAt;

  const InventoryItem({
    required this.id,
    this.tenantId = 'tenant_default',
    required this.householdId,
    required this.zoneId,
    required this.zoneName,
    required this.name,
    this.brand,
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
    this.lastPurchasePlace,
    this.lastPurchasedAt,
    this.priceHistory = const [],
    this.isHighValue = false,
    this.isSensitive = false,
    this.expiryDate,
    this.imageUrl,
    required this.updatedAt,
  });

  String get stockStatus {
    if (currentQuantity <= 0) return 'OUT_OF_STOCK';
    if (currentQuantity <= minAlertQuantity) return 'LOW';
    return 'OPTIMAL';
  }

  double get totalInventoryValue => currentQuantity * unitPrice;

  bool get isExpiringSoon {
    if (expiryDate == null) return false;
    final diff = expiryDate!.difference(DateTime.now()).inDays;
    return diff >= 0 && diff <= 4;
  }

  InventoryItem copyWith({
    int? currentQuantity,
    double? unitPrice,
    String? lastPurchasePlace,
    DateTime? updatedAt,
  }) {
    return InventoryItem(
      id: id,
      tenantId: tenantId,
      householdId: householdId,
      zoneId: zoneId,
      zoneName: zoneName,
      name: name,
      brand: brand,
      category: category,
      barcode: barcode,
      qrCode: qrCode,
      nfcTagId: nfcTagId,
      currentQuantity: currentQuantity ?? this.currentQuantity,
      idealQuantity: idealQuantity,
      minAlertQuantity: minAlertQuantity,
      unit: unit,
      unitPrice: unitPrice ?? this.unitPrice,
      currency: currency,
      lastPurchasePlace: lastPurchasePlace ?? this.lastPurchasePlace,
      lastPurchasedAt: lastPurchasedAt,
      priceHistory: priceHistory,
      isHighValue: isHighValue,
      isSensitive: isSensitive,
      expiryDate: expiryDate,
      imageUrl: imageUrl,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
