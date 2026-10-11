enum CycleCountStatus {
  pending,
  inProgress,
  reconciled,
}

class CycleCountItemEntry {
  final String itemId;
  final String itemName;
  final int expectedQuantity;
  final int? countedQuantity;
  final double unitPrice;
  final bool isVerified;

  const CycleCountItemEntry({
    required this.itemId,
    required this.itemName,
    required this.expectedQuantity,
    this.countedQuantity,
    required this.unitPrice,
    this.isVerified = false,
  });

  int get variance => (countedQuantity ?? expectedQuantity) - expectedQuantity;
  double get financialDiscrepancy => variance * unitPrice;

  CycleCountItemEntry copyWith({
    int? countedQuantity,
    bool? isVerified,
  }) {
    return CycleCountItemEntry(
      itemId: itemId,
      itemName: itemName,
      expectedQuantity: expectedQuantity,
      countedQuantity: countedQuantity ?? this.countedQuantity,
      unitPrice: unitPrice,
      isVerified: isVerified ?? this.isVerified,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'itemId': itemId,
      'itemName': itemName,
      'expectedQuantity': expectedQuantity,
      'countedQuantity': countedQuantity,
      'unitPrice': unitPrice,
      'isVerified': isVerified,
      'variance': variance,
      'financialDiscrepancy': financialDiscrepancy,
    };
  }

  factory CycleCountItemEntry.fromMap(Map<String, dynamic> map) {
    return CycleCountItemEntry(
      itemId: map['itemId'] ?? '',
      itemName: map['itemName'] ?? '',
      expectedQuantity: map['expectedQuantity'] ?? 0,
      countedQuantity: map['countedQuantity'],
      unitPrice: (map['unitPrice'] as num?)?.toDouble() ?? 0.0,
      isVerified: map['isVerified'] ?? false,
    );
  }
}

class CycleCountSession {
  final String id;
  final String workspaceId;
  final String householdId;
  final String targetZoneOrCategory;
  final CycleCountStatus status;
  final List<CycleCountItemEntry> items;
  final String conductedByUserId;
  final DateTime startedAt;
  final DateTime? completedAt;

  const CycleCountSession({
    required this.id,
    required this.workspaceId,
    required this.householdId,
    required this.targetZoneOrCategory,
    required this.status,
    required this.items,
    required this.conductedByUserId,
    required this.startedAt,
    this.completedAt,
  });

  int get totalItems => items.length;
  int get verifiedItems => items.where((i) => i.isVerified).length;
  double get progressPercentage => totalItems > 0 ? (verifiedItems / totalItems) : 0.0;

  int get totalDiscrepancyCount => items.fold(0, (sum, i) => sum + i.variance.abs());
  double get totalFinancialVariance => items.fold(0.0, (sum, i) => sum + i.financialDiscrepancy);

  /// Precisión de inventario: % de artículos con coincidencia exacta (conteo == esperado)
  double get inventoryAccuracyPercentage {
    if (verifiedItems == 0) return 100.0;
    final exactMatches = items.where((i) => i.isVerified && i.variance == 0).length;
    return (exactMatches / verifiedItems) * 100.0;
  }

  CycleCountSession copyWith({
    CycleCountStatus? status,
    List<CycleCountItemEntry>? items,
    DateTime? completedAt,
  }) {
    return CycleCountSession(
      id: id,
      workspaceId: workspaceId,
      householdId: householdId,
      targetZoneOrCategory: targetZoneOrCategory,
      status: status ?? this.status,
      items: items ?? this.items,
      conductedByUserId: conductedByUserId,
      startedAt: startedAt,
      completedAt: completedAt ?? this.completedAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'workspaceId': workspaceId,
      'householdId': householdId,
      'targetZoneOrCategory': targetZoneOrCategory,
      'status': status.name,
      'items': items.map((i) => i.toMap()).toList(),
      'conductedByUserId': conductedByUserId,
      'startedAt': startedAt.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
      'accuracyPercentage': inventoryAccuracyPercentage,
      'totalFinancialVariance': totalFinancialVariance,
    };
  }

  factory CycleCountSession.fromMap(Map<String, dynamic> map) {
    return CycleCountSession(
      id: map['id'] ?? '',
      workspaceId: map['workspaceId'] ?? '',
      householdId: map['householdId'] ?? '',
      targetZoneOrCategory: map['targetZoneOrCategory'] ?? 'General',
      status: CycleCountStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => CycleCountStatus.pending,
      ),
      items: (map['items'] as List<dynamic>? ?? [])
          .map((i) => CycleCountItemEntry.fromMap(i as Map<String, dynamic>))
          .toList(),
      conductedByUserId: map['conductedByUserId'] ?? '',
      startedAt: map['startedAt'] != null ? DateTime.parse(map['startedAt']) : DateTime.now(),
      completedAt: map['completedAt'] != null ? DateTime.parse(map['completedAt']) : null,
    );
  }
}
