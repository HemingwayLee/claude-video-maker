// Trains two real, tiny diffusion models (DDPM) and records what they do.
//
//   npm run train            # → src/diffusion-trace.json  (2 models in parallel)
//
// 1. "spiral": an unconditional model of 2-D points on a spiral.
// 2. "shapes": a class-conditional model of 3 shapes (ring, square, triangle),
//    trained with label dropout so it also works unconditionally. This is
//    what classifier-free guidance needs.
//
// Both follow Ho et al. 2020 (DDPM): T = 1000 steps, a linear β schedule
// from 1e-4 to 0.02, and a network ε_θ(x_t, t) trained with
//   loss = ‖ε − ε_θ(√ᾱ_t·x_0 + √(1−ᾱ_t)·ε, t)‖²
// The network is a small MLP (SiLU, 3 hidden layers) that gets x_t, a
// sinusoidal embedding of t, and (for "shapes") a one-hot class label. It is
// trained with Adam, and sampled with the EMA of its weights, as in the
// paper. Backprop is written out below: there is no ML library.
//
// 3. "images": sampling 48×48 pictures with the IDEAL denoiser for a set of
//    six pictures. With a finite training set, the best possible estimate
//    of the clean image, E[x_0 | x_t], has a closed form: a weighted average
//    of the training images. No network is trained for this part; it shows
//    what a perfect noise predictor would do, in image space.
//
// Everything is seeded: every run produces the same file.

import { fork } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---- settings ---------------------------------------------------------------

const env = (name, fallback) => Number(process.env[name] ?? fallback);
const SEED = env("SEED", 11);
const STEPS = env("STEPS", 12000); // training steps
const BATCH = env("BATCH", 256);
const LR = env("LR", 1e-3); // Adam, cosine-decayed to 10 %
const HIDDEN = env("HIDDEN", 96);
const EMA = env("EMA", 0.995);
const N_SAMPLES = env("SAMPLES", 1500); // points per sampling run
const P_UNCOND = 0.15; // label dropout for classifier-free guidance
const OUT = process.env.OUT ?? join(root, "src/diffusion-trace.json");

// The noise schedule (DDPM).
const T = 1000;
const BETA = Float64Array.from({ length: T }, (_, i) => 1e-4 + ((0.02 - 1e-4) * i) / (T - 1));
const ALPHA = BETA.map((b) => 1 - b);
const ALPHA_BAR = new Float64Array(T);
ALPHA.reduce((p, a, i) => (ALPHA_BAR[i] = p * a), 1);

// ---- random numbers ---------------------------------------------------------

const makeRng = (seed) => {
  let state = seed >>> 0;
  const rand = () => {
    // mulberry32
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const randn = () => {
    const u = Math.max(rand(), 1e-12);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  };
  return { rand, randn };
};

// ---- the 2-D data -------------------------------------------------------------

const spiralPoint = (rng) => {
  const s = 1.5 * Math.PI * (1 + 2 * rng.rand());
  return [(s * Math.cos(s)) / 5 + 0.04 * rng.randn(), (s * Math.sin(s)) / 5 + 0.04 * rng.randn()];
};

export const SHAPES = [
  { name: "ring", cx: -2.2, cy: 0 },
  { name: "square", cx: 0, cy: 0 },
  { name: "triangle", cx: 2.2, cy: -0.1 },
];
// A point on the outline of shape c, given u in [0, 1).
const shapeOutline = (c, u) => {
  const { cx, cy } = SHAPES[c];
  if (c === 0) return [cx + 0.8 * Math.cos(2 * Math.PI * u), cy + 0.8 * Math.sin(2 * Math.PI * u)];
  const corners =
    c === 1
      ? [[-0.75, -0.75], [0.75, -0.75], [0.75, 0.75], [-0.75, 0.75]]
      : [0, 1, 2].map((k) => [0.95 * Math.cos(Math.PI / 2 + (2 * Math.PI * k) / 3), 0.95 * Math.sin(Math.PI / 2 + (2 * Math.PI * k) / 3)]);
  const n = corners.length;
  const f = u * n;
  const k = Math.floor(f) % n;
  const a = corners[k];
  const b = corners[(k + 1) % n];
  const r = f - Math.floor(f);
  return [cx + a[0] + (b[0] - a[0]) * r, cy + a[1] + (b[1] - a[1]) * r];
};
const shapePoint = (rng, c) => {
  const [x, y] = shapeOutline(c, rng.rand());
  return [x + 0.03 * rng.randn(), y + 0.03 * rng.randn()];
};

// ---- a small MLP with hand-written backprop ------------------------------------

const TEMB = 32; // sinusoidal time-embedding size
const timeEmbedding = (t, out, off) => {
  for (let k = 0; k < TEMB / 2; k++) {
    const f = t / Math.pow(10000, k / (TEMB / 2));
    out[off + k] = Math.sin(f);
    out[off + TEMB / 2 + k] = Math.cos(f);
  }
};

const silu = (z) => z / (1 + Math.exp(-z));
const dsilu = (z) => {
  const s = 1 / (1 + Math.exp(-z));
  return s * (1 + z * (1 - s));
};

const makeNet = (rng, nIn) => {
  const sizes = [nIn, HIDDEN, HIDDEN, HIDDEN, 2];
  const layers = [];
  for (let l = 0; l < sizes.length - 1; l++) {
    const [i, o] = [sizes[l], sizes[l + 1]];
    const W = Float64Array.from({ length: o * i }, () => rng.randn() * Math.sqrt((l === sizes.length - 2 ? 0.1 : 2) / i));
    layers.push({ i, o, W, b: new Float64Array(o), gW: new Float64Array(o * i), gb: new Float64Array(o), mW: new Float64Array(o * i), vW: new Float64Array(o * i), mb: new Float64Array(o), vb: new Float64Array(o) });
  }
  return { nIn, layers };
};

// X: n × nIn (row-major). Returns the output (n × 2) and the cache for backprop.
const forward = (net, X, n) => {
  const cache = [];
  let A = X;
  net.layers.forEach((L, li) => {
    const Z = new Float64Array(n * L.o);
    for (let r = 0; r < n; r++)
      for (let o = 0; o < L.o; o++) {
        let s = L.b[o];
        const wo = o * L.i;
        const ao = r * L.i;
        for (let i = 0; i < L.i; i++) s += L.W[wo + i] * A[ao + i];
        Z[r * L.o + o] = s;
      }
    const last = li === net.layers.length - 1;
    cache.push({ A, Z });
    A = last ? Z : Z.map(silu);
  });
  return { out: A, cache };
};

const backward = (net, cache, dOut, n) => {
  let d = dOut;
  for (let li = net.layers.length - 1; li >= 0; li--) {
    const L = net.layers[li];
    const { A, Z } = cache[li];
    const dZ = li === net.layers.length - 1 ? d : d.map((g, k) => g * dsilu(Z[k]));
    const dA = li > 0 ? new Float64Array(n * L.i) : null;
    for (let r = 0; r < n; r++)
      for (let o = 0; o < L.o; o++) {
        const g = dZ[r * L.o + o];
        L.gb[o] += g;
        const wo = o * L.i;
        const ao = r * L.i;
        for (let i = 0; i < L.i; i++) {
          L.gW[wo + i] += g * A[ao + i];
          if (dA) dA[ao + i] += g * L.W[wo + i];
        }
      }
    d = dA;
  }
};

const adam = (net, step, lr) => {
  const b1 = 0.9;
  const b2 = 0.999;
  const c1 = 1 - b1 ** step;
  const c2 = 1 - b2 ** step;
  for (const L of net.layers)
    for (const [P, g, m, v] of [
      [L.W, L.gW, L.mW, L.vW],
      [L.b, L.gb, L.mb, L.vb],
    ]) {
      for (let k = 0; k < P.length; k++) {
        m[k] = b1 * m[k] + (1 - b1) * g[k];
        v[k] = b2 * v[k] + (1 - b2) * g[k] * g[k];
        P[k] -= (lr * (m[k] / c1)) / (Math.sqrt(v[k] / c2) + 1e-8);
      }
      g.fill(0);
    }
};

const copyWeights = (net) => ({ nIn: net.nIn, layers: net.layers.map((L) => ({ ...L, W: Float64Array.from(L.W), b: Float64Array.from(L.b) })) });
const emaUpdate = (ema, net) =>
  ema.layers.forEach((E, li) => {
    const L = net.layers[li];
    for (let k = 0; k < E.W.length; k++) E.W[k] = EMA * E.W[k] + (1 - EMA) * L.W[k];
    for (let k = 0; k < E.b.length; k++) E.b[k] = EMA * E.b[k] + (1 - EMA) * L.b[k];
  });

// Network input for a batch: [x, y, time embedding, (one-hot label)].
const NCLS = SHAPES.length + 1; // + "no label" for classifier-free guidance
const makeInput = (xs, ts, labels) => {
  const n = ts.length;
  const nIn = 2 + TEMB + (labels ? NCLS : 0);
  const X = new Float64Array(n * nIn);
  for (let r = 0; r < n; r++) {
    X[r * nIn] = xs[2 * r];
    X[r * nIn + 1] = xs[2 * r + 1];
    timeEmbedding(ts[r], X, r * nIn + 2);
    if (labels) X[r * nIn + 2 + TEMB + labels[r]] = 1;
  }
  return X;
};

// ε_θ(x_t, t[, label]) for a batch of points that all share t.
const predictNoise = (net, xs, t, label) => {
  const n = xs.length / 2;
  const ts = new Array(n).fill(t);
  const labels = label === undefined ? null : new Array(n).fill(label);
  return forward(net, makeInput(xs, ts, labels), n).out;
};

// ---- training -------------------------------------------------------------------

const train = (kind) => {
  const rng = makeRng(SEED + (kind === "shapes" ? 100 : 0));
  const conditional = kind === "shapes";
  const net = makeNet(rng, 2 + TEMB + (conditional ? NCLS : 0));
  const ema = copyWeights(net);
  const losses = [];
  let acc = 0;
  let accN = 0;
  const t0 = Date.now();
  for (let step = 1; step <= STEPS; step++) {
    // 1) a batch of clean points, a random time step and random noise each
    const xs = new Float64Array(2 * BATCH);
    const eps = new Float64Array(2 * BATCH);
    const ts = new Array(BATCH);
    const labels = conditional ? new Array(BATCH) : null;
    for (let r = 0; r < BATCH; r++) {
      const c = conditional ? Math.floor(rng.rand() * SHAPES.length) : 0;
      const [x0, y0] = conditional ? shapePoint(rng, c) : spiralPoint(rng);
      const t = Math.floor(rng.rand() * T);
      const a = Math.sqrt(ALPHA_BAR[t]);
      const s = Math.sqrt(1 - ALPHA_BAR[t]);
      eps[2 * r] = rng.randn();
      eps[2 * r + 1] = rng.randn();
      // 2) jump straight to x_t: √ᾱ·x_0 + √(1−ᾱ)·ε
      xs[2 * r] = a * x0 + s * eps[2 * r];
      xs[2 * r + 1] = a * y0 + s * eps[2 * r + 1];
      ts[r] = t;
      if (labels) labels[r] = rng.rand() < P_UNCOND ? SHAPES.length : c; // sometimes: "no label"
    }
    // 3) predict the noise; loss = mean squared error
    const { out, cache } = forward(net, makeInput(xs, ts, labels), BATCH);
    const dOut = new Float64Array(out.length);
    let loss = 0;
    for (let k = 0; k < out.length; k++) {
      const e = out[k] - eps[k];
      loss += e * e;
      dOut[k] = (2 * e) / out.length;
    }
    backward(net, cache, dOut, BATCH);
    const lr = LR * (0.1 + 0.9 * 0.5 * (1 + Math.cos((Math.PI * step) / STEPS)));
    adam(net, step, lr);
    emaUpdate(ema, net);
    acc += loss / out.length;
    accN++;
    if (step % 50 === 0) {
      losses.push({ step, loss: +(acc / accN).toFixed(4) });
      acc = 0;
      accN = 0;
    }
    if (step % 1000 === 0) console.log(`[${kind}] step ${String(step).padStart(6)}  loss ${losses[losses.length - 1].loss.toFixed(4)}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  return { net: ema, losses, rng };
};

// ---- sampling ---------------------------------------------------------------------

const round = (a) => Array.from(a, (v) => Math.round(v * 1000) / 1000);
const noisePoints = (rng, n) => Float64Array.from({ length: 2 * n }, () => rng.randn());

// DDPM (ancestral) sampling, all T steps. `eps(xs, t)` predicts the noise.
const sampleDDPM = (rng, n, eps, record = {}) => {
  let xs = noisePoints(rng, n);
  const snaps = [];
  const trails = record.trails ? Array.from({ length: record.trails }, () => []) : null;
  for (let t = T - 1; t >= 0; t--) {
    if (record.every && (t + 1) % record.every === 0) snaps.push({ t: t + 1, points: round(xs) });
    if (trails && t % 10 === 9) trails.forEach((tr, k) => tr.push(+xs[2 * k].toFixed(3), +xs[2 * k + 1].toFixed(3)));
    const e = eps(xs, t);
    const c1 = 1 / Math.sqrt(ALPHA[t]);
    const c2 = BETA[t] / Math.sqrt(1 - ALPHA_BAR[t]);
    const sigma = t > 0 ? Math.sqrt(BETA[t]) : 0;
    xs = xs.map((x, k) => c1 * (x - c2 * e[k]) + sigma * rng.randn());
  }
  if (record.every) snaps.push({ t: 0, points: round(xs) });
  if (trails) trails.forEach((tr, k) => tr.push(+xs[2 * k].toFixed(3), +xs[2 * k + 1].toFixed(3)));
  return { points: xs, snaps, trails };
};

// DDIM (η = 0, deterministic) with `S` evenly spaced steps.
const sampleDDIM = (rng, n, eps, S, record = false) => {
  let xs = noisePoints(rng, n);
  const ts = Array.from({ length: S }, (_, k) => Math.round(((T - 1) * (S - 1 - k)) / Math.max(1, S - 1)));
  const snaps = record ? [{ t: T, points: round(xs) }] : null;
  ts.forEach((t, k) => {
    const prev = k + 1 < S ? ALPHA_BAR[ts[k + 1]] : 1;
    const e = eps(xs, t);
    const a = Math.sqrt(ALPHA_BAR[t]);
    const s = Math.sqrt(1 - ALPHA_BAR[t]);
    xs = xs.map((x, i) => {
      const x0 = (x - s * e[i]) / a; // the network's guess of the clean point
      return Math.sqrt(prev) * x0 + Math.sqrt(1 - prev) * e[i];
    });
    if (record) snaps.push({ t: k + 1 < S ? ts[k + 1] : 0, points: round(xs) });
  });
  return { points: xs, snaps };
};

// How far are generated points from the true shape? (mean distance to the
// nearest of 4,000 points along the clean curve; 0 = exactly on it)
const curveSpiral = Array.from({ length: 4000 }, (_, k) => {
  const s = 1.5 * Math.PI * (1 + (2 * k) / 3999);
  return [(s * Math.cos(s)) / 5, (s * Math.sin(s)) / 5];
});
const curveShape = (c) => Array.from({ length: 1500 }, (_, k) => shapeOutline(c, k / 1500));
const meanDistance = (xs, curve) => {
  let sum = 0;
  for (let i = 0; i < xs.length; i += 2) {
    let best = Infinity;
    for (const [cx, cy] of curve) best = Math.min(best, (xs[i] - cx) ** 2 + (xs[i + 1] - cy) ** 2);
    sum += Math.sqrt(best);
  }
  return +(sum / (xs.length / 2)).toFixed(3);
};
// Share of points within 0.25 of shape c's outline.
const onShape = (xs, c) => {
  const curve = curveShape(c);
  let hit = 0;
  for (let i = 0; i < xs.length; i += 2) {
    let best = Infinity;
    for (const [cx, cy] of curve) best = Math.min(best, (xs[i] - cx) ** 2 + (xs[i + 1] - cy) ** 2);
    if (best < 0.25 * 0.25) hit++;
  }
  return +(hit / (xs.length / 2)).toFixed(3);
};

const runSpiral = () => {
  const { net, losses, rng } = train("spiral");
  const eps = (xs, t) => predictNoise(net, xs, t);
  const data = [];
  const dataRng = makeRng(SEED + 7);
  for (let k = 0; k < N_SAMPLES; k++) data.push(...spiralPoint(dataRng));
  // The learned denoising direction (−ε̂) on a grid, at a few noise levels.
  const G = 19;
  const grid = [];
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) grid.push(-3 + (6 * i) / (G - 1), -3 + (6 * j) / (G - 1));
  const field = [999, 500, 200, 50, 5].map((t) => ({ t, eps: round(eps(Float64Array.from(grid), t)) }));
  console.log("[spiral] sampling (DDPM, 1000 steps)…");
  const ddpm = sampleDDPM(makeRng(SEED + 1), N_SAMPLES, eps, { every: 50, trails: 60 });
  const ddim = Object.fromEntries([50, 10, 3].map((S) => [S, sampleDDIM(makeRng(SEED + 2), N_SAMPLES, eps, S, S <= 10)]));
  return {
    kind: "spiral",
    losses,
    data: round(data),
    grid: round(grid),
    field,
    ddpm: { snaps: ddpm.snaps, trails: ddpm.trails, distance: meanDistance(ddpm.points, curveSpiral) },
    ddim: Object.fromEntries(Object.entries(ddim).map(([S, r]) => [S, { points: round(r.points), snaps: r.snaps, distance: meanDistance(r.points, curveSpiral) }])),
    dataDistance: meanDistance(Float64Array.from(data), curveSpiral),
    noiseDistance: meanDistance(noisePoints(makeRng(5), N_SAMPLES), curveSpiral),
  };
};

const runShapes = () => {
  const { net, losses } = train("shapes");
  const NULL = SHAPES.length;
  // Classifier-free guidance: ε = ε(x, ∅) + w·(ε(x, c) − ε(x, ∅)).
  const guided = (c, w) => (xs, t) => {
    const eu = predictNoise(net, xs, t, NULL);
    if (w === 0) return eu;
    const ec = predictNoise(net, xs, t, c);
    return eu.map((u, k) => u + w * (ec[k] - u));
  };
  const n = 600;
  const data = [];
  const dataRng = makeRng(SEED + 8);
  for (let k = 0; k < n; k++) data.push(...shapePoint(dataRng, k % SHAPES.length));
  console.log("[shapes] sampling with guidance…");
  const runs = {};
  for (const w of [0, 1, 3]) {
    runs[w] = SHAPES.map((_, c) => {
      const pts = sampleDDIM(makeRng(SEED + 3 + c), n, guided(c, w), 100).points;
      return { points: round(pts), onShape: onShape(pts, c) };
    });
  }
  return { kind: "shapes", losses, data: round(data), shapes: SHAPES, runs };
};

// ---- images with the ideal denoiser -----------------------------------------------

const S = 48;
const ICONS = (() => {
  const draw = (fn) => {
    const img = new Float64Array(3 * S * S);
    for (let i = 0; i < S; i++)
      for (let j = 0; j < S; j++) {
        const acc = [0, 0, 0];
        for (let a = 0; a < 3; a++)
          for (let b = 0; b < 3; b++) {
            const c = fn((j + (b + 0.5) / 3) / S, (i + (a + 0.5) / 3) / S);
            for (let k = 0; k < 3; k++) acc[k] += c[k] / 9;
          }
        for (let k = 0; k < 3; k++) img[k * S * S + i * S + j] = acc[k] * 2 - 1;
      }
    return img;
  };
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const inPoly = (x, y, pts) => {
    let inside = false;
    for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
      const [xa, ya] = pts[a];
      const [xb, yb] = pts[b];
      if (ya > y !== yb > y && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) inside = !inside;
    }
    return inside;
  };
  const star = Array.from({ length: 10 }, (_, k) => {
    const r = k % 2 ? 0.17 : 0.4;
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    return [0.5 + r * Math.cos(a), 0.53 + r * Math.sin(a)];
  });
  return [
    // smiley
    draw((x, y) => {
      const d = Math.hypot(x - 0.5, y - 0.5);
      if (d < 0.38) {
        if (Math.hypot(x - 0.37, y - 0.4) < 0.055 || Math.hypot(x - 0.63, y - 0.4) < 0.055) return hex("#3b2414");
        const m = Math.hypot(x - 0.5, y - 0.5);
        if (y > 0.55 && m > 0.17 && m < 0.24) return hex("#3b2414");
        return hex("#ffd23f");
      }
      return hex("#5fb8ff");
    }),
    // heart
    draw((x, y) => {
      const u = (x - 0.5) * 2.6;
      const v = (0.55 - y) * 2.6;
      return (u * u + v * v - 1) ** 3 - u * u * v ** 3 <= 0 ? hex("#e63946") : hex("#ffd6e0");
    }),
    // star
    draw((x, y) => (inPoly(x, y, star) ? hex("#ffd166") : hex("#1d3557"))),
    // moon
    draw((x, y) => {
      if (Math.hypot(x - 0.45, y - 0.5) < 0.3 && Math.hypot(x - 0.58, y - 0.42) > 0.25) return hex("#f1faee");
      if (Math.hypot(x - 0.8, y - 0.2) < 0.03 || Math.hypot(x - 0.75, y - 0.75) < 0.025) return hex("#f1faee");
      return hex("#14213d");
    }),
    // tree
    draw((x, y) => {
      if (inPoly(x, y, [[0.5, 0.12], [0.8, 0.7], [0.2, 0.7]])) return hex("#2d6a4f");
      if (x > 0.44 && x < 0.56 && y >= 0.7 && y < 0.88) return hex("#7f5539");
      return y > 0.88 ? hex("#95d5b2") : hex("#d8f3dc");
    }),
    // house
    draw((x, y) => {
      if (inPoly(x, y, [[0.5, 0.15], [0.85, 0.45], [0.15, 0.45]])) return hex("#d62828");
      if (x > 0.44 && x < 0.56 && y > 0.62 && y < 0.85) return hex("#6d4c41");
      if (x > 0.22 && x < 0.78 && y >= 0.45 && y < 0.85) return hex("#f4e1c1");
      return y >= 0.85 ? hex("#52b788") : hex("#a8dadc");
    }),
  ];
})();

const toBytes = (img) => Buffer.from(Uint8Array.from(img, (v) => Math.round(Math.max(0, Math.min(1, (v + 1) / 2)) * 255))).toString("base64");

// E[x_0 | x_t] for the training set ICONS: softmax-weighted average.
const idealX0 = (xt, t) => {
  const a = Math.sqrt(ALPHA_BAR[t]);
  const v = 1 - ALPHA_BAR[t];
  const logw = ICONS.map((img) => {
    let d = 0;
    for (let k = 0; k < img.length; k++) d += (xt[k] - a * img[k]) ** 2;
    return -d / (2 * v);
  });
  const m = Math.max(...logw);
  const w = logw.map((l) => Math.exp(l - m));
  const z = w.reduce((s, x) => s + x, 0);
  const x0 = new Float64Array(xt.length);
  ICONS.forEach((img, i) => {
    for (let k = 0; k < img.length; k++) x0[k] += (w[i] / z) * img[k];
  });
  return { x0, weights: w.map((x) => +(x / z).toFixed(3)) };
};

const runImages = () => {
  // Try seeds in order and keep the first four runs that end on four
  // different pictures, so the video shows variety.
  const runs = [];
  const seen = new Set();
  for (let seed = 1; runs.length < 4 && seed <= 40; seed++) {
    const run = sampleOne(seed);
    const last = run.frames[run.frames.length - 2].weights;
    const pick = last.indexOf(Math.max(...last));
    if (!seen.has(pick)) (seen.add(pick), runs.push(run));
  }
  return runs;
};

const sampleOne = (seed) => {
  const SNAP = [999, 950, 900, 850, 800, 750, 700, 650, 600, 550, 500, 450, 400, 350, 300, 250, 200, 150, 100, 50, 0];
  {
    const rng = makeRng(SEED * 31 + seed);
    let x = Float64Array.from({ length: 3 * S * S }, () => rng.randn());
    const frames = [];
    for (let t = T - 1; t >= 0; t--) {
      const { x0, weights } = idealX0(x, t);
      if (SNAP.includes(t)) frames.push({ t, xt: toBytes(x), x0: toBytes(x0), weights });
      const e = x.map((v, k) => (v - Math.sqrt(ALPHA_BAR[t]) * x0[k]) / Math.sqrt(1 - ALPHA_BAR[t]));
      const c1 = 1 / Math.sqrt(ALPHA[t]);
      const c2 = BETA[t] / Math.sqrt(1 - ALPHA_BAR[t]);
      const sigma = t > 0 ? Math.sqrt(BETA[t]) : 0;
      x = x.map((v, k) => c1 * (v - c2 * e[k]) + sigma * rng.randn());
    }
    frames.push({ t: -1, xt: toBytes(x), x0: toBytes(x), weights: [] });
    return { seed, frames };
  }
};

// ---- main: one child process per model, in parallel ---------------------------------

if (process.argv[2] === "--child") {
  const result = process.argv[3] === "spiral" ? runSpiral() : runShapes();
  process.send(result, () => process.exit(0));
} else {
  console.log(`Training 2 tiny diffusion models (${STEPS} steps, batch ${BATCH}) in parallel…`);
  const [spiral, shapes] = await Promise.all(
    ["spiral", "shapes"].map(
      (kind) =>
        new Promise((resolve, reject) => {
          const child = fork(fileURLToPath(import.meta.url), ["--child", kind]);
          child.on("message", resolve);
          child.on("exit", (code) => code !== 0 && reject(new Error(`${kind} exited with ${code}`)));
        }),
    ),
  );
  console.log("[images] sampling with the ideal denoiser…");
  const images = runImages();
  const trace = {
    settings: { SEED, STEPS, BATCH, LR, HIDDEN, EMA, T, betaStart: 1e-4, betaEnd: 0.02, imageSize: S },
    alphaBar: Array.from(ALPHA_BAR, (v) => +v.toPrecision(6)),
    spiral,
    shapes,
    icons: ICONS.map(toBytes),
    images,
  };
  writeFileSync(OUT, JSON.stringify(trace));
  console.log("\nSpiral: mean distance of points to the true spiral (lower = better)");
  console.log(`  real data        ${spiral.dataDistance}`);
  console.log(`  pure noise       ${spiral.noiseDistance}`);
  console.log(`  DDPM, 1000 steps ${spiral.ddpm.distance}`);
  for (const S2 of [50, 10, 3]) console.log(`  DDIM, ${String(S2).padEnd(4)} steps ${spiral.ddim[S2].distance}`);
  console.log("\nShapes: share of samples on the requested shape (ring / square / triangle)");
  for (const w of [0, 1, 3]) console.log(`  guidance w = ${w}   ${shapes.runs[w].map((r) => r.onShape).join(" / ")}`);
  console.log("\nImages: final weights on the 6 training pictures, per seed");
  for (const im of images) console.log(`  seed ${im.seed}: ${im.frames[im.frames.length - 2].weights.join(" ")}`);
  console.log(`\n→ ${OUT}`);
}
