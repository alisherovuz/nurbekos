export type SoundName = 'startup' | 'open' | 'close' | 'click' | 'error' | 'notify' | 'send';

let ctx: AudioContext | null = null;
let enabled = false;

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(ac: AudioContext, freq: number, start: number, duration: number, type: OscillatorType = 'sine', volume = 0.08, endFreq?: number) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, ac.currentTime + start + duration);
  gain.gain.setValueAtTime(0.0001, ac.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(volume, ac.currentTime + start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration + 0.05);
}

/** Small synthesized UI sounds — no audio files to download. */
export function play(name: SoundName, force = false) {
  if (!enabled && !force) return;
  const ac = audio();
  if (!ac) return;
  switch (name) {
    case 'startup':
      [311.1, 466.2, 622.3, 932.3].forEach((f, i) => tone(ac, f, i * 0.12, 1.4 - i * 0.15, 'triangle', 0.05));
      tone(ac, 155.6, 0, 1.6, 'sine', 0.05);
      break;
    case 'open': tone(ac, 660, 0, 0.09, 'triangle', 0.045, 990); break;
    case 'close': tone(ac, 700, 0, 0.09, 'triangle', 0.04, 420); break;
    case 'click': tone(ac, 1800, 0, 0.025, 'square', 0.015); break;
    case 'error': tone(ac, 520, 0, 0.18, 'sine', 0.08); tone(ac, 390, 0.12, 0.3, 'sine', 0.08); break;
    case 'notify': tone(ac, 784, 0, 0.14, 'sine', 0.06); tone(ac, 1175, 0.11, 0.25, 'sine', 0.06); break;
    case 'send': tone(ac, 500, 0, 0.25, 'sine', 0.05, 1600); break;
  }
}
