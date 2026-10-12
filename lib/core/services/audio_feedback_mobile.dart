import 'package:flutter/services.dart';
import 'audio_feedback_stub.dart';

class AudioFeedbackPlatformMobile implements AudioFeedbackPlatform {
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
        SystemSound.play(SystemSoundType.click);
      } else if (type == 'warning') {
        HapticFeedback.heavyImpact();
        SystemSound.play(SystemSoundType.alert);
      } else {
        HapticFeedback.lightImpact();
        SystemSound.play(SystemSoundType.click);
      }
    } catch (_) {}
  }
}

AudioFeedbackPlatform getAudioFeedbackPlatform() => AudioFeedbackPlatformMobile();
