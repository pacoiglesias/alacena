// Web Audio API Synthesizer - 0 External Dependencies, 0 Audio Assets, Zero Latency

class LuxuryAudioService {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('alacena_sound_muted') === 'true';
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('alacena_sound_muted', this.muted);
    if (!this.muted) {
      this.click();
    }
    return this.muted;
  }

  click() {
    if (this.muted) return;
    try {
      const ctx = this.init();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.032);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.032);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  success() {
    if (this.muted) return;
    try {
      const ctx = this.init();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Arpegio mayor refinado (E5 -> G#5 -> B5)
      const freqs = [659.25, 830.61, 987.77];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.055);

        gain.gain.setValueAtTime(0.09, now + idx * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.055 + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.055);
        osc.stop(now + idx * 0.055 + 0.28);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  warning() {
    if (this.muted) return;
    try {
      const ctx = this.init();
      if (!ctx) return;
      const now = ctx.currentTime;
      [440, 554.37].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.24);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  cook() {
    if (this.muted) return;
    try {
      const ctx = this.init();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Doble campana de servicio de alta cocina
      [523.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.14, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  delete() {
    if (this.muted) return;
    try {
      const ctx = this.init();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }
}

export const audio = new LuxuryAudioService();
