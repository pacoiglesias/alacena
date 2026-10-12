import 'audio_feedback_stub.dart'
    if (dart.library.html) 'audio_feedback_web.dart'
    if (dart.library.io) 'audio_feedback_mobile.dart';

/// Servicio de Retroalimentación Sonora y Sensorial de Lujo
/// Proporciona micro-sonidos mecánicos y chimes armónicos instantáneos (Web Audio API)
/// y respuesta háptica en dispositivos móviles.
class AudioFeedbackService {
  static final AudioFeedbackPlatform _platform = getAudioFeedbackPlatform();

  static bool get isMuted => _platform.isMuted;

  static void toggleMute() {
    _platform.toggleMute();
  }

  /// Clic sutil de titanio para botones e interacciones táctiles
  static void click() {
    _platform.playSound('click');
  }

  /// Chime armónico de éxito (triada mayor) al guardar, crear o actualizar
  static void success() {
    _platform.playSound('success');
  }

  /// Tono cálido de advertencia o stock bajo
  static void warning() {
    _platform.playSound('warning');
  }

  /// Doble gong armónico para la preparación de recetas en cocina
  static void cook() {
    _platform.playSound('cook');
  }

  /// Clic grave de eliminación o descarte
  static void delete() {
    _platform.playSound('delete');
  }
}
