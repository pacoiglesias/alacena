import 'package:flutter/foundation.dart';
import 'package:nfc_manager/nfc_manager.dart';

class NfcService {
  /// Verifica si el hardware NFC está disponible y encendido
  static Future<bool> isNfcAvailable() async {
    if (kIsWeb) return false;
    try {
      final availability = await NfcManager.instance.checkAvailability();
      return availability == NfcAvailability.enabled;
    } catch (_) {
      return false;
    }
  }

  /// Inicia sesión de escucha de Tags NFC con opciones requeridas
  static Future<void> startNfcReading({
    required Function(String tagId, String? payload) onTagScanned,
    required Function(String error) onError,
  }) async {
    final available = await isNfcAvailable();
    if (!available) {
      onError('NFC no disponible o apagado en este dispositivo');
      return;
    }

    try {
      NfcManager.instance.startSession(
        pollingOptions: {
          NfcPollingOption.iso14443,
          NfcPollingOption.iso15693,
        },
        onDiscovered: (NfcTag tag) async {
          final tagIdentifier = 'NFC_${DateTime.now().millisecondsSinceEpoch}';
          onTagScanned(tagIdentifier, null);
          NfcManager.instance.stopSession();
        },
      );
    } catch (e) {
      onError(e.toString());
    }
  }

  /// Detiene cualquier sesión activa de NFC
  static Future<void> stopNfcSession() async {
    if (kIsWeb) return;
    try {
      await NfcManager.instance.stopSession();
    } catch (_) {}
  }
}
