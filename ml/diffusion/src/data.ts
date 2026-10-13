import { random } from "remotion";
import trace from "./diffusion-trace.json";

// ---- the recorded runs of scripts/train-diffusion.mjs → diffusion-trace.json
// Points are flat arrays [x0, y0, x1, y1, …]. Images are base64 bytes
// (0..255), channel-major [channel][row][col], 24×24 RGB.

type Snap = { t: number; points: number[] };
export const TRACE = trace as unknown as {
  settings: { SEED: number; STEPS: number; BATCH: number; LR: number; HIDDEN: number; EMA: number; T: number; betaStart: number; betaEnd: number; imageSize: number };
  alphaBar: number[];
  spiral: {
    losses: { step: number; loss: number }[];
    data: number[];
    grid: number[];
    field: { t: number; eps: number[] }[];
    ddpm: { snaps: Snap[]; trails: number[][]; distance: number };
    ddim: Record<string, { points: number[]; snaps: Snap[] | null; distance: number }>;
    dataDistance: number;
    noiseDistance: number;
  };
  shapes: {
    losses: { step: number; loss: number }[];
    data: number[];
    shapes: { name: string; cx: number; cy: number }[];
    runs: Record<string, { points: number[]; onShape: number }[]>;
  };
  icons: string[];
  images: { seed: number; frames: { t: number; xt: string; x0: string; weights: number[] }[] }[];
};

export const T = TRACE.settings.T;
export const ALPHA_BAR = TRACE.alphaBar;
export const RES = TRACE.settings.imageSize;
export const BETA = (t: number) => TRACE.settings.betaStart + ((TRACE.settings.betaEnd - TRACE.settings.betaStart) * t) / (T - 1);
// ᾱ at a (possibly fractional) step t in 0..T; t = 0 means "clean".
export const alphaBarAt = (t: number) => (t <= 0 ? 1 : ALPHA_BAR[Math.min(T - 1, Math.max(0, Math.round(t) - 1))]);

// Deterministic standard normal noise, one value per (seed, index).
export const gauss = (seed: string, i: number) => {
  const u = Math.max(random(`${seed}-u-${i}`), 1e-9);
  const v = random(`${seed}-v-${i}`);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// The forward process on any flat array of values in [-1, 1] (or points):
// x_t = √ᾱ_t · x_0 + √(1 − ᾱ_t) · ε, with a fixed ε per seed.
export const noisify = (x0: ArrayLike<number>, t: number, seed: string, noiseCache?: Float32Array) => {
  const a = Math.sqrt(alphaBarAt(t));
  const s = Math.sqrt(1 - alphaBarAt(t));
  const out = new Float32Array(x0.length);
  for (let i = 0; i < x0.length; i++) out[i] = a * x0[i] + s * (noiseCache ? noiseCache[i] : gauss(seed, i));
  return out;
};
export const noiseFor = (seed: string, n: number) => Float32Array.from({ length: n }, (_, i) => gauss(seed, i));

// ---- images
export type Img = { data: Uint8Array | Float32Array; float?: boolean }; // bytes 0..255, or floats in [-1, 1]

const cache = new Map<string, Uint8Array>();
export const decode = (b64: string): Uint8Array => {
  let v = cache.get(b64);
  if (!v) {
    const bin = atob(b64);
    v = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    cache.set(b64, v);
  }
  return v;
};
export const ICONS = TRACE.icons.map((b) => decode(b));
export const iconFloats = (i: number) => Float32Array.from(ICONS[i], (v) => (v / 255) * 2 - 1);

// Frame k of an image-sampling run (see runImages in the training script).
export const imageFrames = (seed: number) => TRACE.images[seed].frames;
// Blend two byte images (for smooth playback between recorded frames).
export const blendBytes = (a: Uint8Array, b: Uint8Array, t: number): Img => {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = Math.round(a[i] + (b[i] - a[i]) * t);
  return { data: out };
};
// The sampling run at progress p in [0, 1] (0 = pure noise, 1 = done).
export const imageAt = (seed: number, p: number, which: "xt" | "x0"): Img => {
  const fr = imageFrames(seed);
  const f = Math.max(0, Math.min(1, p)) * (fr.length - 1);
  const k = Math.min(fr.length - 2, Math.floor(f));
  return blendBytes(decode(fr[k][which]), decode(fr[k + 1][which]), f - k);
};
