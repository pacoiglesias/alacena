class ShoppingItem {
  final String id;
  final String householdId;
  final String? itemId;
  final String name;
  final String category;
  final int neededQuantity;
  final String unit;
  final double? estimatedPrice;
  final bool isPurchased;
  final String source; // 'AI_AUTO_DETECT' | 'LOW_STOCK_RULE' | 'MANUAL'
  final DateTime createdAt;

  const ShoppingItem({
    required this.id,
    required this.householdId,
    this.itemId,
    required this.name,
    required this.category,
    required this.neededQuantity,
    required this.unit,
    this.estimatedPrice,
    this.isPurchased = false,
    required this.source,
    required this.createdAt,
  });

  ShoppingItem copyWith({
    bool? isPurchased,
  }) {
    return ShoppingItem(
      id: id,
      householdId: householdId,
      itemId: itemId,
      name: name,
      category: category,
      neededQuantity: neededQuantity,
      unit: unit,
      estimatedPrice: estimatedPrice,
      isPurchased: isPurchased ?? this.isPurchased,
      source: source,
      createdAt: createdAt,
    );
  }
}
