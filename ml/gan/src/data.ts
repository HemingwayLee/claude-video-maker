import { random } from "remotion";
import trace from "./gan-trace.json";

// ---- the real 1-D GAN run (scripts/train-gan.mjs → gan-trace.json) ---------

export type Snapshot = {
  step: number;
  dLoss: number; // discriminator loss (smoothed)
  gLoss: number; // generator loss (smoothed)
  gen: number[]; // generator's density on the x grid
  d: number[]; // D(x) on the x grid
  map: number[]; // G(z) for z in ZLINE
};

export const TRACE = trace as {
  config: { seed: number; steps: number; dSteps: number; batch: number; hidden: number };
  xMin: number;
  xMax: number;
  real: number[];
  zLine: number[];
  snapshots: Snapshot[];
};
export const SNAPS = TRACE.snapshots;
export const REAL = TRACE.real;
export const XS = REAL.map((_, i) => TRACE.xMin + ((TRACE.xMax - TRACE.xMin) * i) / (REAL.length - 1));
export const FINAL = SNAPS[SNAPS.length - 1];

const mixArr = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);

// The run at a fractional snapshot index: blends neighbouring snapshots so
// the animation is smooth.
export const snapshotAt = (pos: number): Snapshot => {
  const p = Math.max(0, Math.min(SNAPS.length - 1, pos));
  const i = Math.min(SNAPS.length - 2, Math.floor(p));
  const t = p - i;
  const a = SNAPS[i];
  const b = SNAPS[i + 1];
  return {
    step: Math.round(a.step + (b.step - a.step) * t),
    dLoss: a.dLoss + (b.dLoss - a.dLoss) * t,
    gLoss: a.gLoss + (b.gLoss - a.gLoss) * t,
    gen: mixArr(a.gen, b.gen, t),
    d: mixArr(a.d, b.d, t),
    map: mixArr(a.map, b.map, t),
  };
};

// Index of the first snapshot at or after a training step.
export const snapIndex = (step: number) => SNAPS.findIndex((s) => s.step >= step);

// ---- noise -----------------------------------------------------------------

// Standard-normal numbers, the same on every render for the same seed.
export const gaussian = (seed: string | number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const u = Math.max(1e-6, random(`${seed}-u-${i}`));
    const v = random(`${seed}-v-${i}`);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  });

export const mixZ = (a: number[], b: number[], t: number) => mixArr(a, b, t);

// ---- the stylized "generator" used for the face pictures --------------------
//
// A latent vector z (8 numbers) decides how a face looks. This stands in for
// a trained image GAN, which would be far too big to run inside the video;
// what it shows is real, though: nearby z's give similar faces, and moving z
// smoothly morphs the face.

export type FaceParams = {
  skin: number; // 0..1 along a skin-tone ramp
  hair: number; // 0..1 along a hair-color ramp
  hairLen: number; // 0 = short, 1 = long
  width: number; // face width factor
  eyeSize: number;
  eyeGap: number;
  smile: number; // -1 frown .. 1 smile
  glasses: number; // 0..1 (opacity)
  brow: number; // -1..1 tilt
};

const sig = (v: number) => 1 / (1 + Math.exp(-v));

export const faceFromZ = (z: number[]): FaceParams => ({
  skin: sig(1.4 * z[0]),
  hair: sig(1.4 * z[1]),
  hairLen: sig(2 * z[2]),
  width: 0.86 + 0.16 * sig(1.5 * z[3]),
  eyeSize: 0.75 + 0.5 * sig(1.5 * z[4]),
  eyeGap: 0.85 + 0.3 * sig(1.5 * z[5]),
  smile: Math.tanh(1.2 * z[6] + 0.5),
  glasses: Math.max(0, Math.min(1, (z[7] - 0.6) * 2.5)),
  brow: Math.tanh(0.8 * (z[4] - z[6])),
});

// Latent vectors for the faces that appear in the video.
export const FACE_Z = Array.from({ length: 12 }, (_, i) => gaussian(`face-${i}`, 8));
