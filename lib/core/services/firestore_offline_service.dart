import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

class FirestoreOfflineService {
  /// Inicializa la persistencia de datos local offline para sótanos y cavas sin cobertura
  static Future<void> initializeOfflinePersistence() async {
    try {
      FirebaseFirestore.instance.settings = const Settings(
        persistenceEnabled: true,
        cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
      );
      debugPrint('[FirestoreOfflineService] Caché offline ilimitada activada con éxito.');
    } catch (e) {
      debugPrint('[FirestoreOfflineService] Error al inicializar persistencia offline: $e');
    }
  }

  /// Forzar sincronización o alternar modo de conexión
  static Future<void> disableNetwork() async {
    await FirebaseFirestore.instance.disableNetwork();
  }

  static Future<void> enableNetwork() async {
    await FirebaseFirestore.instance.enableNetwork();
  }
}
