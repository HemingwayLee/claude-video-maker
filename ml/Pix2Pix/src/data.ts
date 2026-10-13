import trace from "./pix2pix-trace.json";

// ---- the real tiny Pix2Pix runs (scripts/train-pix2pix.mjs → pix2pix-trace.json)
//
// Images are stored as base64 bytes (0..255), channel-major: [channel][row][col].
// Inputs (outlines) have 1 channel, everything else 3 (RGB).

export type Mode = "l1" | "gan" | "both";
type Run = {
  mode: Mode;
  snapshots: { step: number; outputs: string[] }[];
  losses: { step: number; d: number | null; gan: number | null; l1: number }[];
  patches: { real: number[]; fake: number[] }[];
  patchesL1?: number[][];
  crisp: number[];
};
export const TRACE = trace as unknown as {
  settings: { SEED: number; STEPS: number; BATCH: number; LR: number; LAMBDA: number; NGF: number; NDF: number; size: number; patch: number };
  tests: { input: string; target: string; kind: number; phase: number }[];
  runs: Record<Mode, Run>;
  phases: string[];
};

export const SIZE = TRACE.settings.size; // 32
export const PATCH = TRACE.settings.patch; // 8×8 patch scores
export const STEPS = TRACE.settings.STEPS;

export type Img = { data: Uint8Array; channels: 1 | 3 };

const decodeCache = new Map<string, Uint8Array>();
export const decode = (b64: string): Uint8Array => {
  let v = decodeCache.get(b64);
  if (!v) {
    const bin = atob(b64);
    v = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    decodeCache.set(b64, v);
  }
  return v;
};

export const img = (b64: string, channels: 1 | 3 = 3): Img => ({ data: decode(b64), channels });

export const TEST_INPUTS = TRACE.tests.map((t) => img(t.input, 1));
export const TEST_TARGETS = TRACE.tests.map((t) => img(t.target));
export const PHASES = TRACE.phases.map((p) => img(p));

// Pixel-wise mean of several images (what an L2 loss would aim for; for a
// 50/50 pixel any value in between is just as good for L1).
export const average = (imgs: Img[]): Img => {
  const out = new Uint8Array(imgs[0].data.length);
  for (let i = 0; i < out.length; i++) out[i] = Math.round(imgs.reduce((s, m) => s + m.data[i], 0) / imgs.length);
  return { data: out, channels: imgs[0].channels };
};

// A run's output for test image `i` at a (fractional) training step:
// blends the two nearest snapshots so the video can play training smoothly.
export const outputAt = (mode: Mode, i: number, step: number): Img => {
  const snaps = TRACE.runs[mode].snapshots;
  let k = 0;
  while (k < snaps.length - 2 && snaps[k + 1].step <= step) k++;
  const a = snaps[k];
  const b = snaps[Math.min(k + 1, snaps.length - 1)];
  const t = b.step === a.step ? 0 : Math.max(0, Math.min(1, (step - a.step) / (b.step - a.step)));
  const da = decode(a.outputs[i]);
  if (t === 0) return { data: da, channels: 3 };
  const db = decode(b.outputs[i]);
  const out = new Uint8Array(da.length);
  for (let p = 0; p < out.length; p++) out[p] = Math.round(da[p] + (db[p] - da[p]) * t);
  return { data: out, channels: 3 };
};

export const finalOutput = (mode: Mode, i: number) => outputAt(mode, i, STEPS);

// RGB of one pixel (for the "one pixel" close-up).
export const pixel = (m: Img, row: number, col: number): [number, number, number] => {
  const p = row * SIZE + col;
  if (m.channels === 1) return [m.data[p], m.data[p], m.data[p]];
  const n = SIZE * SIZE;
  return [m.data[p], m.data[n + p], m.data[2 * n + p]];
};
