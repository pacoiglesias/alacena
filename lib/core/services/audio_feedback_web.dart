// ignore: avoid_web_libraries_in_flutter
import 'dart:html' as html;
import 'audio_feedback_stub.dart';

class AudioFeedbackPlatformWeb implements AudioFeedbackPlatform {
  bool _muted = false;

  @override
  bool get isMuted => _muted;

  @override
  void toggleMute() {
    _muted = !_muted;
    try {
      html.window.callMethod('setLuxurySoundMuted', [_muted]);
    } catch (_) {}
  }

  @override
  void playSound(String type) {
    if (_muted) return;
    try {
      html.window.callMethod('playLuxurySound', [type]);
    } catch (_) {}
  }
}

AudioFeedbackPlatform getAudioFeedbackPlatform() => AudioFeedbackPlatformWeb();
