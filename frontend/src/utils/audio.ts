/**
 * Audio utility for kitchen queue notifications.
 * Uses Web Audio API for clean, synthesized chimes with zero external file dependencies,
 * and falls back to a generated valid WAV data URI.
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/**
 * Creates a valid, well-formed 8-bit mono PCM WAV data URI as fallback.
 */
function createFallbackWavUri(): string {
  const sampleRate = 8000;
  const duration = 0.35;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Uint8Array(44 + numSamples);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) buffer[offset + i] = str.charCodeAt(i);
  };
  const writeUint32 = (offset: number, val: number) => {
    buffer[offset] = val & 0xff;
    buffer[offset + 1] = (val >> 8) & 0xff;
    buffer[offset + 2] = (val >> 16) & 0xff;
    buffer[offset + 3] = (val >> 24) & 0xff;
  };
  const writeUint16 = (offset: number, val: number) => {
    buffer[offset] = val & 0xff;
    buffer[offset + 1] = (val >> 8) & 0xff;
  };

  writeString(0, 'RIFF');
  writeUint32(4, 36 + numSamples);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  writeUint32(16, 16);
  writeUint16(20, 1); // PCM
  writeUint16(22, 1); // mono
  writeUint32(24, sampleRate);
  writeUint32(28, sampleRate); // byte rate (sampleRate * 1 * 8 / 8)
  writeUint16(32, 1); // block align
  writeUint16(34, 8); // bits per sample
  writeString(36, 'data');
  writeUint32(40, numSamples);

  // Two-tone bell ding (659Hz then 880Hz) with exponential decay
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = t < 0.12 ? 659.25 : 880;
    const decay = Math.exp(-t * 7);
    const sample = Math.sin(2 * Math.PI * freq * t) * decay;
    buffer[44 + i] = Math.floor((sample + 1) * 127.5);
  }

  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

let cachedFallbackWav: string | null = null;

export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;

  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // Note 1: Warm chime bell (E5 - 659.25Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.35, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.55);

      // Note 2: Bright harmonic chime (A5 - 880Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.4, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.95);

      // Note 3: High overtone shimmer (E6 - 1318.5Hz)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(1318.5, now + 0.13);
      gain3.gain.setValueAtTime(0, now + 0.13);
      gain3.gain.linearRampToValueAtTime(0.15, now + 0.15);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.13);
      osc3.stop(now + 0.7);

      return;
    }
  } catch (err) {
    console.warn('Web Audio playback failed, falling back to audio element:', err);
  }

  // Fallback to HTML5 Audio element with valid generated WAV
  try {
    if (!cachedFallbackWav) {
      cachedFallbackWav = createFallbackWavUri();
    }
    const audio = new Audio(cachedFallbackWav);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {
    // Audio playback blocked
  }
}
