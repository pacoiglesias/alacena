import 'package:flutter/services.dart';

abstract class AudioFeedbackPlatform {
  bool get isMuted;
  void toggleMute();
  void playSound(String type);
}

class AudioFeedbackPlatformStub implements AudioFeedbackPlatform {
  bool _muted = false;

  @override
  bool get isMuted => _muted;

  @override
  void toggleMute() {
    _muted = !_muted;
  }

  @override
  void playSound(String type) {
    if (_muted) return;
    try {
      if (type == 'success' || type == 'cook') {
        HapticFeedback.mediumImpact();
      } else if (type == 'warning') {
        HapticFeedback.heavyImpact();
      } else {
        HapticFeedback.lightImpact();
      }
    } catch (_) {}
  }
}

AudioFeedbackPlatform getAudioFeedbackPlatform() => AudioFeedbackPlatformStub();
