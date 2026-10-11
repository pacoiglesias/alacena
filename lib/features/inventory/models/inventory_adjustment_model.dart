enum AdjustmentType {
  perdida,
  merma,
  rotura,
  consumoNoRegistrado,
  correccionConteo,
  transferencia,
}

extension AdjustmentTypeExtension on AdjustmentType {
  String get code {
    switch (this) {
      case AdjustmentType.perdida:
        return 'PERDIDA';
      case AdjustmentType.merma:
        return 'MERMA';
      case AdjustmentType.rotura:
        return 'ROTURA';
      case AdjustmentType.consumoNoRegistrado:
        return 'CONSUMO_NO_REGISTRADO';
      case AdjustmentType.correccionConteo:
        return 'CORRECCION_CONTEO';
      case AdjustmentType.transferencia:
        return 'TRANSFERENCIA';
    }
  }

  String get label {
    switch (this) {
      case AdjustmentType.perdida:
        return 'Pérdida / Extravío';
      case AdjustmentType.merma:
        return 'Merma / Caducidad';
      case AdjustmentType.rotura:
        return 'Rotura / Daño Físico';
      case AdjustmentType.consumoNoRegistrado:
        return 'Consumo no registrado';
      case AdjustmentType.correccionConteo:
        return 'Corrección por Conteo';
      case AdjustmentType.transferencia:
        return 'Transferencia de Ubicación';
    }
  }
}

class InventoryAdjustment {
  final String id;
  final String workspaceId;
  final String householdId;
  final String itemId;
  final String itemName;
  final AdjustmentType type;
  final int previousQuantity;
  final int newQuantity;
  final int quantityDelta;
  final double unitPriceAtMoment;
  final double economicValueDelta;
  final String currency;
  final String reasonNote;
  final String? evidencePhotoUrl;
  final String adjustedByUserId;
  final String adjustedByUserEmail;
  final DateTime timestamp;

  const InventoryAdjustment({
    required this.id,
    required this.workspaceId,
    required this.householdId,
    required this.itemId,
    required this.itemName,
    required this.type,
    required this.previousQuantity,
    required this.newQuantity,
    required this.quantityDelta,
    required this.unitPriceAtMoment,
    required this.economicValueDelta,
    this.currency = 'MXN',
    required this.reasonNote,
    this.evidencePhotoUrl,
    required this.adjustedByUserId,
    required this.adjustedByUserEmail,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'workspaceId': workspaceId,
      'householdId': householdId,
      'itemId': itemId,
      'itemName': itemName,
      'type': type.code,
      'previousQuantity': previousQuantity,
      'newQuantity': newQuantity,
      'quantityDelta': quantityDelta,
      'unitPriceAtMoment': unitPriceAtMoment,
      'economicValueDelta': economicValueDelta,
      'currency': currency,
      'reasonNote': reasonNote,
      'evidencePhotoUrl': evidencePhotoUrl,
      'adjustedByUserId': adjustedByUserId,
      'adjustedByUserEmail': adjustedByUserEmail,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  factory InventoryAdjustment.fromMap(Map<String, dynamic> map) {
    AdjustmentType parsedType = AdjustmentType.correccionConteo;
    final code = map['type'] as String? ?? '';
    for (final t in AdjustmentType.values) {
      if (t.code == code) {
        parsedType = t;
        break;
      }
    }

    return InventoryAdjustment(
      id: map['id'] ?? '',
      workspaceId: map['workspaceId'] ?? '',
      householdId: map['householdId'] ?? '',
      itemId: map['itemId'] ?? '',
      itemName: map['itemName'] ?? '',
      type: parsedType,
      previousQuantity: map['previousQuantity'] ?? 0,
      newQuantity: map['newQuantity'] ?? 0,
      quantityDelta: map['quantityDelta'] ?? 0,
      unitPriceAtMoment: (map['unitPriceAtMoment'] as num?)?.toDouble() ?? 0.0,
      economicValueDelta: (map['economicValueDelta'] as num?)?.toDouble() ?? 0.0,
      currency: map['currency'] ?? 'MXN',
      reasonNote: map['reasonNote'] ?? '',
      evidencePhotoUrl: map['evidencePhotoUrl'],
      adjustedByUserId: map['adjustedByUserId'] ?? '',
      adjustedByUserEmail: map['adjustedByUserEmail'] ?? '',
      timestamp: map['timestamp'] != null ? DateTime.parse(map['timestamp']) : DateTime.now(),
    );
  }
}
