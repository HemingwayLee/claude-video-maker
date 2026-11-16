// Synthesizes the 15-second backing track → public/music.wav
// 128 BPM × 32 beats = exactly 15 s. No samples, no dependencies: every
// drum and synth is generated from sine waves and noise below.
//
// Sections (beats):  0–7 intro groove · 8–15 + clap & hook · 16–23 full
//                    24–31 double-time finale. Risers lead into 8, 16, 24.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const BPM = 128;
const SR = 44100;
const DUR = 15;
const N = SR * DUR;
const BEAT = 60 / BPM;
const L = new Float32Array(N);
const R = new Float32Array(N);

// deterministic noise
let seed = 1234567;
const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296) * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function add(t0, len, fn, gain = 1, pan = 0) {
  const s0 = Math.floor(t0 * SR);
  const n = Math.floor(len * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n; i++) {
    const idx = s0 + i;
    if (idx < 0 || idx >= N) continue;
    const v = fn(i / SR, i);
    L[idx] += v * gl;
    R[idx] += v * gr;
  }
}

// band-limited saw from a few harmonics (keeps it smooth, no aliasing)
const saw = (f, t, h = 8) => {
  let v = 0;
  for (let k = 1; k <= h; k++) {
    if (f * k > 9000) break;
    v += Math.sin(2 * Math.PI * f * k * t) / k;
  }
  return v * 0.6;
};

const kick = (t0) =>
  add(t0, 0.35, (t) => {
    const ph = 2 * Math.PI * (45 * t + (110 / 28) * (1 - Math.exp(-t * 28)));
    return Math.sin(ph) * Math.exp(-t * 7) + (t < 0.004 ? rnd() * 0.4 : 0);
  }, 0.95);

const clap = (t0) => {
  let prev = 0;
  add(t0, 0.25, (t) => {
    const env = [0, 0.011, 0.022].reduce((a, d) => a + (t >= d ? Math.exp(-(t - d) * 60) : 0), 0) * 0.5 +
      Math.exp(-t * 14) * 0.6;
    const n = rnd();
    const hp = n - prev; prev = n;
    return hp * env * 0.5;
  }, 0.55);
};

const hat = (t0, open = false, pan = 0.25) => {
  let prev = 0;
  add(t0, open ? 0.18 : 0.05, (t) => {
    const n = rnd();
    const hp = n - prev; prev = n;
    return hp * Math.exp(-t * (open ? 22 : 80));
  }, 0.22, pan);
};

const crash = (t0) => {
  let prev = 0;
  add(t0, 1.6, (t) => {
    const n = rnd();
    const hp = n - prev; prev = n;
    return hp * Math.exp(-t * 2.6);
  }, 0.18, -0.2);
};

const riser = (t0, len) =>
  add(t0, len, (t) => {
    const p = t / len;
    const f = 300 + 2600 * p * p;
    return (rnd() * 0.5 + Math.sin(2 * Math.PI * f * t) * 0.3) * p * p;
  }, 0.22);

const bassNote = (t0, m, len) =>
  add(t0, len, (t) => {
    const f = mtof(m);
    const env = Math.min(1, t * 200) * Math.exp(-t * 3);
    return (saw(f, t, 5) * 0.7 + Math.sin(2 * Math.PI * f * t) * 0.6) * env;
  }, 0.42);

const pluck = (t0, notes, gain = 0.16) =>
  notes.forEach((m, i) =>
    add(t0, 0.32, (t) => {
      const f = mtof(m);
      const env = Math.min(1, t * 300) * Math.exp(-t * 11);
      return (saw(f * 1.004, t, 6) + saw(f * 0.996, t, 6)) * 0.5 * env;
    }, gain, (i - 1) * 0.35),
  );

const lead = (t0, m, len) =>
  add(t0, len, (t) => {
    const f = mtof(m) * (1 + 0.004 * Math.sin(2 * Math.PI * 5.5 * t));
    const env = Math.min(1, t * 120) * Math.exp(-t * 4);
    // soft square: odd harmonics
    let v = 0;
    for (let k = 1; k <= 7; k += 2) v += Math.sin(2 * Math.PI * f * k * t) / k;
    return v * env;
  }, 0.13, 0.1);

// Am – F – C – G, one chord per bar
const CHORDS = [
  { root: 45, tri: [69, 72, 76] },
  { root: 41, tri: [65, 69, 72] },
  { root: 48, tri: [67, 72, 76] },
  { root: 43, tri: [67, 71, 74] },
];
// hook: (beat offset in bar, midi, length in beats)
const HOOK = [
  [[0, 76, 0.5], [0.5, 79, 0.5], [1.5, 81, 0.5], [2.5, 79, 0.5], [3, 76, 0.75]],
  [[0, 77, 0.5], [0.5, 76, 0.5], [1.5, 72, 0.75], [3, 74, 0.5], [3.5, 76, 0.5]],
  [[0, 79, 0.5], [0.5, 81, 0.5], [1, 84, 0.75], [2, 81, 0.5], [3, 79, 0.75]],
  [[0, 79, 0.5], [0.5, 77, 0.5], [1, 76, 0.5], [2, 74, 0.5], [3, 71, 0.75]],
];

const b2t = (b) => b * BEAT;
for (let bar = 0; bar < 8; bar++) {
  const c = CHORDS[bar % 4];
  for (let bt = 0; bt < 4; bt++) {
    const beat = bar * 4 + bt;
    const t = b2t(beat);
    kick(t);
    if (beat >= 8 && (bt === 1 || bt === 3)) clap(t);
    // hats: off-beats, then 16ths in the finale
    hat(t + BEAT / 2, beat % 2 === 1, 0.3);
    if (beat >= 16) hat(t + BEAT / 4, false, -0.3);
    if (beat >= 24) hat(t + (3 * BEAT) / 4, false, -0.3);
    // bass on the off-beat (classic pumping house bass)
    bassNote(t + BEAT / 2, c.root + (bt === 3 && bar % 2 ? 7 : 0), BEAT / 2);
    if (beat >= 16) bassNote(t, c.root, BEAT / 3);
    // chord stabs on the "and"
    pluck(t + BEAT / 2, c.tri, beat >= 16 ? 0.17 : 0.13);
    if (beat >= 24) pluck(t + (3 * BEAT) / 4, c.tri, 0.08);
  }
  if (bar >= 2) for (const [o, m, len] of HOOK[bar % 4]) lead(b2t(bar * 4 + o), m + (bar >= 6 ? 12 : 0), b2t(len));
}
[0, 8, 16, 24].forEach((b) => crash(b2t(b)));
riser(b2t(6), b2t(2));
riser(b2t(14), b2t(2));
riser(b2t(22), b2t(2));

// sidechain pump: duck everything except the kick a bit after each beat
// (approximate: apply a gentle duck to the whole mix, kick survives by being loudest)
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const ph = (t % BEAT) / BEAT;
  const duck = 0.72 + 0.28 * Math.min(1, ph * 3.2);
  L[i] *= duck;
  R[i] *= duck;
}

// normalize, soft-clip, fade the last 150 ms
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const g = 1.25 / peak;
const out = Buffer.alloc(44 + N * 4);
out.write("RIFF", 0); out.writeUInt32LE(36 + N * 4, 4); out.write("WAVE", 8);
out.write("fmt ", 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34);
out.write("data", 36); out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const fade = Math.min(1, (N - i) / (SR * 0.15));
  const l = Math.tanh(L[i] * g) * 0.92 * fade;
  const r = Math.tanh(R[i] * g) * 0.92 * fade;
  out.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
  out.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
}
const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(here, "..", "public"), { recursive: true });
writeFileSync(join(here, "..", "public", "music.wav"), out);
console.log(`wrote public/music.wav (${DUR}s @ ${BPM} BPM)`);
