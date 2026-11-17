// FriendlyTeaching.cl — Practice sound engine.
//
// Zero-asset sound effects, synthesised live with the Web Audio API so
// the app doesn't need to ship MP3 files or wait on a CDN. Each cue is
// a short chord of sine/triangle oscillators with an attack-decay
// envelope. Keeps the practice loop snappy and "arcade" without
// pulling 400kB of audio into the bundle.
//
// Browsers block audio until the user interacts with the page. Every
// playX() is guarded so a pre-interaction call is a silent no-op; once
// the student clicks Check or picks an option, the AudioContext is
// ready and every subsequent cue plays.

let ctx: AudioContext | null = null;
let muted = false;

type Osc = OscillatorType; // 'sine' | 'square' | 'triangle' | 'sawtooth'

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
  }
  if (ctx.state === 'suspended') {
    // Resume lazily — browsers allow this inside a user-gesture handler.
    ctx.resume().catch(() => undefined);
  }
  return ctx;
}

interface Tone {
  freq:    number;      // Hz
  startAt: number;      // seconds offset from now
  dur:     number;      // seconds
  gain:    number;      // peak amplitude (0..1)
  type?:   Osc;
}

function playTones(tones: Tone[]): void {
  if (muted) return;
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const master = ac.createGain();
  master.gain.value = 0.18; // overall volume cap
  master.connect(ac.destination);
  for (const t of tones) {
    const osc = ac.createOscillator();
    osc.type = t.type ?? 'triangle';
    osc.frequency.value = t.freq;
    const g = ac.createGain();
    // Attack-decay envelope — short attack, exp-ish decay. Keeps the
    // sound percussive instead of pad-y.
    const start = now + t.startAt;
    const peak = start + Math.min(0.015, t.dur * 0.15);
    const end  = start + t.dur;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(t.gain, peak);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(g).connect(master);
    osc.start(start);
    osc.stop(end + 0.02);
  }
}

// ── Public cue palette ───────────────────────────────────────

// A playful C-major arpeggio C5–E5–G5. Short, bright, celebratory.
export function playCorrect(): void {
  playTones([
    { freq: 523.25, startAt: 0.00, dur: 0.12, gain: 0.9, type: 'triangle' }, // C5
    { freq: 659.25, startAt: 0.08, dur: 0.14, gain: 0.9, type: 'triangle' }, // E5
    { freq: 783.99, startAt: 0.16, dur: 0.22, gain: 1.0, type: 'triangle' }, // G5
  ]);
}

// Soft dissonant two-note "nope". A4 + F4, minor second-ish.
export function playWrong(): void {
  playTones([
    { freq: 220.00, startAt: 0.00, dur: 0.16, gain: 0.9, type: 'sine' },     // A3
    { freq: 174.61, startAt: 0.08, dur: 0.22, gain: 0.9, type: 'sine' },     // F3
  ]);
}

// Big C-E-G-C fanfare for lesson completion.
export function playComplete(): void {
  playTones([
    { freq: 523.25, startAt: 0.00, dur: 0.16, gain: 1.0, type: 'triangle' },
    { freq: 659.25, startAt: 0.12, dur: 0.16, gain: 1.0, type: 'triangle' },
    { freq: 783.99, startAt: 0.24, dur: 0.16, gain: 1.0, type: 'triangle' },
    { freq: 1046.5, startAt: 0.36, dur: 0.40, gain: 1.0, type: 'triangle' },
  ]);
}

// Subtle tick for a button press / pick.
export function playTap(): void {
  playTones([
    { freq: 880, startAt: 0.00, dur: 0.05, gain: 0.5, type: 'sine' },
  ]);
}

// Rising "combo!" blip for consecutive correct answers.
export function playCombo(): void {
  playTones([
    { freq: 783.99, startAt: 0.00, dur: 0.08, gain: 0.8, type: 'triangle' },
    { freq: 987.77, startAt: 0.06, dur: 0.14, gain: 1.0, type: 'triangle' },
  ]);
}

// ── Mute control (persisted in localStorage) ─────────────────

const MUTE_KEY = 'ft-practice-muted';

export function isMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try { return window.localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
}

export function setMuted(v: boolean): void {
  muted = v;
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(MUTE_KEY, v ? '1' : '0'); } catch { /* ignore */ }
}

// Hydrate from storage on module load so initial calls respect the pref.
if (typeof window !== 'undefined') {
  muted = isMuted();
}
