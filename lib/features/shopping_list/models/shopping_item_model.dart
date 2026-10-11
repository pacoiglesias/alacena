class WebPriceOffer {
  final String vendor;
  final double price;
  final String? url;

  const WebPriceOffer({
    required this.vendor,
    required this.price,
    this.url,
  });
}

class ShoppingItem {
  final String id;
  final String tenantId;
  final String householdId;
  final String? itemId;
  final String name;
  final String category;
  final int neededQuantity;
  final String unit;
  final double? estimatedPrice;
  final bool isPurchased;
  final String source; // 'AI_AUTO_DETECT' | 'LOW_STOCK_RULE' | 'MANUAL'
  
  // Agente IA de Comparación Web
  final String? cheapestVendor;
  final double? cheapestPrice;
  final double? potentialSavings;
  final List<WebPriceOffer> webOffers;

  final DateTime createdAt;

  const ShoppingItem({
    required this.id,
    this.tenantId = 'tenant_default',
    required this.householdId,
    this.itemId,
    required this.name,
    required this.category,
    required this.neededQuantity,
    required this.unit,
    this.estimatedPrice,
    this.isPurchased = false,
    required this.source,
    this.cheapestVendor,
    this.cheapestPrice,
    this.potentialSavings,
    this.webOffers = const [],
    required this.createdAt,
  });

  ShoppingItem copyWith({
    bool? isPurchased,
    String? cheapestVendor,
    double? cheapestPrice,
    double? potentialSavings,
  }) {
    return ShoppingItem(
      id: id,
      tenantId: tenantId,
      householdId: householdId,
      itemId: itemId,
      name: name,
      category: category,
      neededQuantity: neededQuantity,
      unit: unit,
      estimatedPrice: estimatedPrice,
      isPurchased: isPurchased ?? this.isPurchased,
      source: source,
      cheapestVendor: cheapestVendor ?? this.cheapestVendor,
      cheapestPrice: cheapestPrice ?? this.cheapestPrice,
      potentialSavings: potentialSavings ?? this.potentialSavings,
      webOffers: webOffers,
      createdAt: createdAt,
    );
  }
}
