/// Servicio de generación y análisis de Códigos QR bajo estándar Deep Link
/// Permite que cualquier cámara nativa (iOS/Android) o lector de hardware dirija
/// al producto exacto bajo el esquema URI alacena://item/{itemId}.
enum ScannedType {
  deepLinkItem,
  commercialEan,
  shortId,
  unknown,
}

class ScannedCodePayload {
  final ScannedType type;
  final String extractedValue;
  final String rawValue;

  const ScannedCodePayload({
    required this.type,
    required this.extractedValue,
    required this.rawValue,
  });

  bool get isDeepLink => type == ScannedType.deepLinkItem;
  bool get isEan => type == ScannedType.commercialEan;
  bool get isShortId => type == ScannedType.shortId;
}

class DeepLinkQrService {
  static const String uriScheme = 'alacena';
  static const String hostItem = 'item';

  /// Genera la cadena de Deep Link oficial que se codifica en la matriz del QR
  static String formatItemDeepLink(String itemId, {String? workspaceId}) {
    if (workspaceId != null && workspaceId.isNotEmpty) {
      return '$uriScheme://$hostItem/$itemId?workspace=$workspaceId';
    }
    return '$uriScheme://$hostItem/$itemId';
  }

  /// Analiza cualquier cadena escaneada (QR, Barras, Short ID o Deep Link)
  static ScannedCodePayload parse(String rawInput) {
    final clean = rawInput.trim();

    // 1. Detección de Deep Link: alacena://item/{itemId}
    if (clean.toLowerCase().startsWith('$uriScheme://')) {
      try {
        final uri = Uri.parse(clean);
        if (uri.host == hostItem && uri.pathSegments.isNotEmpty) {
          final itemId = uri.pathSegments.first;
          return ScannedCodePayload(
            type: ScannedType.deepLinkItem,
            extractedValue: itemId,
            rawValue: clean,
          );
        } else if (uri.pathSegments.isNotEmpty) {
          return ScannedCodePayload(
            type: ScannedType.deepLinkItem,
            extractedValue: uri.pathSegments.last,
            rawValue: clean,
          );
        }
      } catch (_) {}
    }

    // 2. Detección de Código de Barras Comercial (EAN-8, EAN-13, UPC-A de 8 a 14 dígitos)
    final digitsOnly = clean.replaceAll(RegExp(r'[^0-9]'), '');
    if (digitsOnly.length >= 8 && digitsOnly.length <= 14 && digitsOnly == clean) {
      return ScannedCodePayload(
        type: ScannedType.commercialEan,
        extractedValue: digitsOnly,
        rawValue: clean,
      );
    }

    // 3. Detección de Short ID alfanumérico (ej. ALC-7K9B, EXP-8812 o 4-8 caracteres alfanuméricos)
    if (clean.contains('-') || (clean.length >= 4 && clean.length <= 8 && RegExp(r'^[a-zA-Z0-9\-]+$').hasMatch(clean))) {
      return ScannedCodePayload(
        type: ScannedType.shortId,
        extractedValue: clean.toUpperCase(),
        rawValue: clean,
      );
    }

    // 4. Fallback genérico o QR anterior
    return ScannedCodePayload(
      type: ScannedType.unknown,
      extractedValue: clean,
      rawValue: clean,
    );
  }
}
