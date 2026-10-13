// Trains a real, tiny Pix2Pix and records how it learns.
//
//   npm run train            # → src/pix2pix-trace.json  (3 runs in parallel)
//
// The task: "outline → object". The input x is a 32×32 edge map (the
// outline of a circle or a square). The target y is the same shape,
// filled with its color and with dark horizontal stripes. The stripes'
// vertical position is RANDOM: the outline does not say where they are.
// That is the point. Many outputs are equally right, and that is exactly
// where an L1 loss gives up and averages them into a blur, while a GAN has to
// commit to one sharp answer (Isola et al. 2017, section 3.1 and figure 4).
//
// Three generators are trained from the same start on the same data:
//   l1    only the L1 loss                     |y - G(x)|
//   gan   only the conditional GAN loss        D(x, G(x)) should say "real"
//   both  the Pix2Pix objective                cGAN + λ·L1   (λ = 100)
//
// The networks follow the paper, scaled down:
//   G: a U-Net. Encoder 32→16→8→4→2 (4×4 convs, stride 2, leaky ReLU),
//      decoder 2→4→8→16→32 (4×4 transposed convs, ReLU), with skip
//      connections that concatenate each encoder layer onto the decoder
//      layer of the same size. Output: tanh, 3 channels (RGB).
//   D: a PatchGAN. Input: x and y stacked (4 channels). Two 4×4 stride-2
//      convs and one 3×3 conv → an 8×8 grid of real/fake scores, each one
//      looking at an 18×18 patch of the image.
// Both use Adam (lr 2e-4, β1 = 0.5) like the paper. Everything (convs,
// transposed convs, backprop, Adam) is written out below; there is no ML
// library. Everything is seeded: every run produces the same file.

import { fork } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---- settings ---------------------------------------------------------------

const env = (name, fallback) => Number(process.env[name] ?? fallback);
const SEED = env("SEED", 7);
const STEPS = env("STEPS", 3000);
const BATCH = env("BATCH", 8);
const LR = env("LR", 5e-4);
const LAMBDA = env("LAMBDA", 100); // weight of the L1 term in "both"
const NGF = env("NGF", 8); // generator width (channels of the first layer)
const NDF = env("NDF", 8); // discriminator width
const S = 32; // image size
const N_TEST = 4; // fixed test inputs that the video shows
const SNAPSHOTS = [0, 50, 100, 200, 300, 400, 600, 800, 1000, 1300, 1600, 2000, 2500, 3000].filter((s) => s <= STEPS);
const LOSS_EVERY = 25;
const OUT = process.env.OUT ?? join(root, "src/pix2pix-trace.json");

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

// ---- the data -----------------------------------------------------------------

// Colors in [-1, 1] (what tanh outputs).
const c = (r, g, b) => [r * 2 - 1, g * 2 - 1, b * 2 - 1];
const BG = c(0.93, 0.89, 0.8);
const BODY = [c(1.0, 0.55, 0.15), c(0.1, 0.62, 0.68)]; // circle: orange, square: teal
const STRIPE = [c(0.45, 0.12, 0.05), c(0.02, 0.18, 0.3)];
const PERIOD = 4; // stripes: 2 rows dark, 2 rows light

// One example: { x: 1×32×32 outline, y: 3×32×32 target, kind, phase }
export const makeExample = (rng, opts = {}) => {
  const kind = opts.kind ?? (rng.rand() < 0.5 ? 0 : 1);
  const r = opts.r ?? 7 + rng.rand() * 5; // half-size 7..12
  const cx = opts.cx ?? r + 1 + rng.rand() * (S - 2 * r - 2);
  const cy = opts.cy ?? r + 1 + rng.rand() * (S - 2 * r - 2);
  const phase = opts.phase ?? Math.floor(rng.rand() * PERIOD);
  const inside = (i, j) => {
    if (i < 0 || j < 0 || i >= S || j >= S) return false;
    const dx = j + 0.5 - cx;
    const dy = i + 0.5 - cy;
    return kind === 0 ? dx * dx + dy * dy <= r * r : Math.abs(dx) <= r * 0.85 && Math.abs(dy) <= r * 0.85;
  };
  const x = new Float32Array(S * S).fill(-1);
  const y = new Float32Array(3 * S * S);
  const interior = new Uint8Array(S * S); // inside the shape, not on the outline
  for (let i = 0; i < S; i++)
    for (let j = 0; j < S; j++) {
      const p = i * S + j;
      const ins = inside(i, j);
      const edge = ins && (!inside(i - 1, j) || !inside(i + 1, j) || !inside(i, j - 1) || !inside(i, j + 1));
      if (edge) x[p] = 1;
      if (ins && !edge) interior[p] = 1;
      const dark = ins && !edge && (i + phase) % PERIOD < 2;
      const col = !ins ? BG : edge ? STRIPE[kind] : dark ? STRIPE[kind] : BODY[kind];
      for (let ch = 0; ch < 3; ch++) y[ch * S * S + p] = col[ch];
    }
  return { x, y, kind, phase, interior };
};

// ---- layers with hand-written backprop ---------------------------------------
// Tensors are Float32Arrays in channel-major order: [channel][row][col].

const makeConv = (rng, cin, cout, k, stride, pad, transposed = false) => {
  const n = cin * cout * k * k;
  // He initialization. (The paper uses N(0, 0.02), which suits its big,
  // batch-normalized nets; these tiny ones without normalization need more.)
  const fanIn = transposed ? (cin * k * k) / (stride * stride) : cin * k * k;
  const W = new Float32Array(n).map(() => rng.randn() * Math.sqrt(2 / fanIn));
  const b = new Float32Array(cout);
  return { cin, cout, k, stride, pad, transposed, W, b, gW: new Float32Array(n), gb: new Float32Array(cout), m: [new Float32Array(n), new Float32Array(cout)], v: [new Float32Array(n), new Float32Array(cout)] };
};

// Regular convolution: W[cout][cin][k][k]. Input H×H → output Ho×Ho.
const convForward = (L, X, H) => {
  const { cin, cout, k, stride, pad, W, b } = L;
  const Ho = Math.floor((H + 2 * pad - k) / stride) + 1;
  const Y = new Float32Array(cout * Ho * Ho);
  for (let co = 0; co < cout; co++) {
    const yo = co * Ho * Ho;
    for (let oy = 0; oy < Ho; oy++)
      for (let ox = 0; ox < Ho; ox++) {
        let s = b[co];
        for (let ci = 0; ci < cin; ci++) {
          const wo = ((co * cin + ci) * k) * k;
          const xo = ci * H * H;
          for (let ky = 0; ky < k; ky++) {
            const iy = oy * stride - pad + ky;
            if (iy < 0 || iy >= H) continue;
            for (let kx = 0; kx < k; kx++) {
              const ix = ox * stride - pad + kx;
              if (ix < 0 || ix >= H) continue;
              s += W[wo + ky * k + kx] * X[xo + iy * H + ix];
            }
          }
        }
        Y[yo + oy * Ho + ox] = s;
      }
  }
  return { Y, Ho };
};

const convBackward = (L, X, H, dY, Ho, needDX = true) => {
  const { cin, cout, k, stride, pad, W, gW, gb } = L;
  const dX = needDX ? new Float32Array(cin * H * H) : null;
  for (let co = 0; co < cout; co++) {
    const yo = co * Ho * Ho;
    for (let oy = 0; oy < Ho; oy++)
      for (let ox = 0; ox < Ho; ox++) {
        const g = dY[yo + oy * Ho + ox];
        if (g === 0) continue;
        gb[co] += g;
        for (let ci = 0; ci < cin; ci++) {
          const wo = ((co * cin + ci) * k) * k;
          const xo = ci * H * H;
          for (let ky = 0; ky < k; ky++) {
            const iy = oy * stride - pad + ky;
            if (iy < 0 || iy >= H) continue;
            for (let kx = 0; kx < k; kx++) {
              const ix = ox * stride - pad + kx;
              if (ix < 0 || ix >= H) continue;
              gW[wo + ky * k + kx] += g * X[xo + iy * H + ix];
              if (dX) dX[xo + iy * H + ix] += g * W[wo + ky * k + kx];
            }
          }
        }
      }
  }
  return dX;
};

// Transposed convolution (k 4, stride 2, pad 1 doubles the size): W[cin][cout][k][k].
const convTForward = (L, X, H) => {
  const { cin, cout, k, stride, pad, W, b } = L;
  const Ho = (H - 1) * stride - 2 * pad + k;
  const Y = new Float32Array(cout * Ho * Ho);
  for (let co = 0; co < cout; co++) Y.fill(b[co], co * Ho * Ho, (co + 1) * Ho * Ho);
  for (let ci = 0; ci < cin; ci++)
    for (let iy = 0; iy < H; iy++)
      for (let ix = 0; ix < H; ix++) {
        const xv = X[ci * H * H + iy * H + ix];
        if (xv === 0) continue;
        for (let co = 0; co < cout; co++) {
          const wo = ((ci * cout + co) * k) * k;
          const yo = co * Ho * Ho;
          for (let ky = 0; ky < k; ky++) {
            const oy = iy * stride - pad + ky;
            if (oy < 0 || oy >= Ho) continue;
            for (let kx = 0; kx < k; kx++) {
              const ox = ix * stride - pad + kx;
              if (ox < 0 || ox >= Ho) continue;
              Y[yo + oy * Ho + ox] += xv * W[wo + ky * k + kx];
            }
          }
        }
      }
  return { Y, Ho };
};

const convTBackward = (L, X, H, dY, Ho) => {
  const { cin, cout, k, stride, pad, W, gW, gb } = L;
  const dX = new Float32Array(cin * H * H);
  for (let co = 0; co < cout; co++) {
    let s = 0;
    for (let p = co * Ho * Ho; p < (co + 1) * Ho * Ho; p++) s += dY[p];
    gb[co] += s;
  }
  for (let ci = 0; ci < cin; ci++)
    for (let iy = 0; iy < H; iy++)
      for (let ix = 0; ix < H; ix++) {
        const xi = ci * H * H + iy * H + ix;
        const xv = X[xi];
        let dx = 0;
        for (let co = 0; co < cout; co++) {
          const wo = ((ci * cout + co) * k) * k;
          const yo = co * Ho * Ho;
          for (let ky = 0; ky < k; ky++) {
            const oy = iy * stride - pad + ky;
            if (oy < 0 || oy >= Ho) continue;
            for (let kx = 0; kx < k; kx++) {
              const ox = ix * stride - pad + kx;
              if (ox < 0 || ox >= Ho) continue;
              const g = dY[yo + oy * Ho + ox];
              gW[wo + ky * k + kx] += g * xv;
              dx += g * W[wo + ky * k + kx];
            }
          }
        }
        dX[xi] = dx;
      }
  return dX;
};

const lrelu = (A) => A.map((v) => (v > 0 ? v : 0.2 * v));
const dlrelu = (A, d) => d.map((g, i) => (A[i] > 0 ? g : 0.2 * g)); // A = output
const relu = (A) => A.map((v) => (v > 0 ? v : 0));
const drelu = (A, d) => d.map((g, i) => (A[i] > 0 ? g : 0));
const cat = (a, b) => {
  const out = new Float32Array(a.length + b.length);
  out.set(a);
  out.set(b, a.length);
  return out;
};

// ---- the networks -----------------------------------------------------------

const makeG = (rng) => ({
  e1: makeConv(rng, 1, NGF, 4, 2, 1), // 32 → 16
  e2: makeConv(rng, NGF, NGF * 2, 4, 2, 1), // 16 → 8
  e3: makeConv(rng, NGF * 2, NGF * 4, 4, 2, 1), // 8 → 4
  e4: makeConv(rng, NGF * 4, NGF * 4, 4, 2, 1), // 4 → 2 (bottleneck)
  d1: makeConv(rng, NGF * 4, NGF * 4, 4, 2, 1, true), // 2 → 4, then + e3
  d2: makeConv(rng, NGF * 8, NGF * 2, 4, 2, 1, true), // 4 → 8, then + e2
  d3: makeConv(rng, NGF * 4, NGF, 4, 2, 1, true), // 8 → 16, then + e1
  d4: makeConv(rng, NGF * 2, 3, 4, 2, 1, true), // 16 → 32, RGB
});

const gForward = (G, x) => {
  const c = {};
  c.e1 = lrelu(convForward(G.e1, x, 32).Y);
  c.e2 = lrelu(convForward(G.e2, c.e1, 16).Y);
  c.e3 = lrelu(convForward(G.e3, c.e2, 8).Y);
  c.e4 = lrelu(convForward(G.e4, c.e3, 4).Y);
  c.d1 = relu(convTForward(G.d1, c.e4, 2).Y);
  c.u1 = cat(c.d1, c.e3); // skip connection
  c.d2 = relu(convTForward(G.d2, c.u1, 4).Y);
  c.u2 = cat(c.d2, c.e2);
  c.d3 = relu(convTForward(G.d3, c.u2, 8).Y);
  c.u3 = cat(c.d3, c.e1);
  c.out = convTForward(G.d4, c.u3, 16).Y.map(Math.tanh);
  return c;
};

const gBackward = (G, x, c, dOut) => {
  let d = dOut.map((g, i) => g * (1 - c.out[i] * c.out[i]));
  d = convTBackward(G.d4, c.u3, 16, d, 32);
  const nd3 = c.d3.length;
  let dE1 = d.subarray(nd3);
  d = convTBackward(G.d3, c.u2, 8, drelu(c.d3, d.subarray(0, nd3)), 16);
  const nd2 = c.d2.length;
  let dE2 = d.subarray(nd2);
  d = convTBackward(G.d2, c.u1, 4, drelu(c.d2, d.subarray(0, nd2)), 8);
  const nd1 = c.d1.length;
  let dE3 = d.subarray(nd1);
  d = convTBackward(G.d1, c.e4, 2, drelu(c.d1, d.subarray(0, nd1)), 4);
  d = convBackward(G.e4, c.e3, 4, dlrelu(c.e4, d), 2);
  dE3 = dE3.map((g, i) => g + d[i]);
  d = convBackward(G.e3, c.e2, 8, dlrelu(c.e3, dE3), 4);
  dE2 = dE2.map((g, i) => g + d[i]);
  d = convBackward(G.e2, c.e1, 16, dlrelu(c.e2, dE2), 8);
  dE1 = dE1.map((g, i) => g + d[i]);
  convBackward(G.e1, x, 32, dlrelu(c.e1, dE1), 16, false);
};

const makeD = (rng) => ({
  c1: makeConv(rng, 4, NDF, 4, 2, 1), // 32 → 16
  c2: makeConv(rng, NDF, NDF * 2, 4, 2, 1), // 16 → 8
  c3: makeConv(rng, NDF * 2, 1, 3, 1, 1), // 8 → 8 patch scores (logits)
});
export const PATCH = 8;

const dForward = (D, x, y) => {
  const c = { inp: cat(x, y) };
  c.c1 = lrelu(convForward(D.c1, c.inp, 32).Y);
  c.c2 = lrelu(convForward(D.c2, c.c1, 16).Y);
  c.logits = convForward(D.c3, c.c2, 8).Y;
  return c;
};

// Returns d(loss)/d(y) (the image part of the input) when needInput.
const dBackward = (D, c, dLogits, needInput) => {
  let d = convBackward(D.c3, c.c2, 8, dLogits, 8);
  d = convBackward(D.c2, c.c1, 16, dlrelu(c.c2, d), 8);
  d = convBackward(D.c1, c.inp, 32, dlrelu(c.c1, d), 16, needInput);
  return needInput ? d.subarray(S * S) : null;
};

const sigmoid = (z) => 1 / (1 + Math.exp(-z));
// Binary cross-entropy on logits, averaged over the patches.
const bce = (logits, target) => {
  let loss = 0;
  const grad = new Float32Array(logits.length);
  for (let i = 0; i < logits.length; i++) {
    const z = logits[i];
    loss += Math.max(z, 0) - z * target + Math.log1p(Math.exp(-Math.abs(z)));
    grad[i] = (sigmoid(z) - target) / logits.length;
  }
  return { loss: loss / logits.length, grad };
};

const layers = (net) => Object.values(net);
const zeroGrad = (net) => layers(net).forEach((L) => (L.gW.fill(0), L.gb.fill(0)));
const adamStep = (net, t, scale) => {
  const b1 = 0.5;
  const b2 = 0.999;
  const c1 = 1 - b1 ** t;
  const c2 = 1 - b2 ** t;
  for (const L of layers(net)) {
    [
      [L.W, L.gW, L.m[0], L.v[0]],
      [L.b, L.gb, L.m[1], L.v[1]],
    ].forEach(([P, g, m, v]) => {
      for (let i = 0; i < P.length; i++) {
        const gi = g[i] * scale;
        m[i] = b1 * m[i] + (1 - b1) * gi;
        v[i] = b2 * v[i] + (1 - b2) * gi * gi;
        P[i] -= (LR * (m[i] / c1)) / (Math.sqrt(v[i] / c2) + 1e-8);
      }
    });
  }
};

// ---- one training run -------------------------------------------------------

const toBytes = (img) => Buffer.from(Uint8Array.from(img, (v) => Math.round(Math.max(0, Math.min(1, (v + 1) / 2)) * 255))).toString("base64");

// The fixed test set: both shapes, different places and stripe positions.
const testSet = () => {
  const rng = makeRng(999);
  return [
    makeExample(rng, { kind: 0, r: 11, cx: 16, cy: 16, phase: 1 }),
    makeExample(rng, { kind: 1, r: 11, cx: 16, cy: 16, phase: 3 }),
    makeExample(rng, { kind: 0, r: 8, cx: 11, cy: 20, phase: 0 }),
    makeExample(rng, { kind: 1, r: 9, cx: 20, cy: 12, phase: 2 }),
  ];
};

const train = (mode) => {
  const initRng = makeRng(SEED); // same initial weights for every mode
  const G = makeG(initRng);
  const D = makeD(initRng);
  const dataRng = makeRng(SEED + 1); // same data stream for every mode
  const tests = testSet().slice(0, N_TEST);
  const useGan = mode !== "l1";
  const useL1 = mode !== "gan";
  const snapshots = [];
  const losses = [];
  const snap = (step) => snapshots.push({ step, outputs: tests.map((t) => toBytes(gForward(G, t.x).out)) });
  if (SNAPSHOTS.includes(0)) snap(0);
  let acc = { d: 0, gan: 0, l1: 0, n: 0 };
  const t0 = Date.now();
  for (let step = 1; step <= STEPS; step++) {
    const batch = Array.from({ length: BATCH }, () => makeExample(dataRng));
    const caches = batch.map((ex) => gForward(G, ex.x));
    // 1) discriminator: real pairs (x, y) → 1, fake pairs (x, G(x)) → 0
    if (useGan) {
      zeroGrad(D);
      batch.forEach((ex, i) => {
        const real = dForward(D, ex.x, ex.y);
        const lr = bce(real.logits, 1);
        dBackward(D, real, lr.grad, false);
        const fake = dForward(D, ex.x, caches[i].out);
        const lf = bce(fake.logits, 0);
        dBackward(D, fake, lf.grad, false);
        acc.d += (lr.loss + lf.loss) / 2;
      });
      adamStep(D, step, 0.5 / BATCH); // the paper halves D's loss
    }
    // 2) generator: fool D (non-saturating loss) + stay close to y in L1
    zeroGrad(G);
    batch.forEach((ex, i) => {
      const c = caches[i];
      const dOut = new Float32Array(c.out.length);
      if (useGan) {
        const fake = dForward(D, ex.x, c.out);
        const lg = bce(fake.logits, 1);
        const dImg = dBackward(D, fake, lg.grad, true);
        for (let p = 0; p < dOut.length; p++) dOut[p] += dImg[p];
        acc.gan += lg.loss;
      }
      let l1 = 0;
      for (let p = 0; p < dOut.length; p++) {
        const e = c.out[p] - ex.y[p];
        l1 += Math.abs(e);
        if (useL1) dOut[p] += ((useGan ? LAMBDA : 1) * Math.sign(e)) / dOut.length;
      }
      acc.l1 += l1 / dOut.length;
      gBackward(G, ex.x, c, dOut);
    });
    zeroGrad(D); // D's gradients from the G step are thrown away
    adamStep(G, step, 1 / BATCH);
    acc.n += BATCH;
    if (step % LOSS_EVERY === 0) {
      losses.push({ step, d: useGan ? acc.d / acc.n : null, gan: useGan ? acc.gan / acc.n : null, l1: acc.l1 / acc.n });
      acc = { d: 0, gan: 0, l1: 0, n: 0 };
    }
    if (SNAPSHOTS.includes(step)) snap(step);
    if (step % 250 === 0) {
      const last = losses[losses.length - 1];
      console.log(`[${mode.padEnd(4)}] step ${String(step).padStart(5)}  L1 ${last.l1.toFixed(3)}  D ${last.d?.toFixed(3) ?? "  -  "}  G_gan ${last.gan?.toFixed(3) ?? "  -  "}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
  }
  // What the trained PatchGAN thinks of real and generated pairs (8×8 grids).
  const patches = tests.map((t) => ({
    real: Array.from(dForward(D, t.x, t.y).logits, (z) => +sigmoid(z).toFixed(3)),
    fake: Array.from(dForward(D, t.x, gForward(G, t.x).out).logits, (z) => +sigmoid(z).toFixed(3)),
  }));
  // How striped are the outputs? Mean |row-to-row difference| inside the shapes,
  // as a share of the target's. 0 = flat/blurry, 1 = as crisp as the real thing.
  const crisp = tests.map((t) => {
    const out = gForward(G, t.x).out;
    let a = 0;
    let b = 0;
    for (let i = 1; i < S; i++)
      for (let j = 0; j < S; j++) {
        const p = i * S + j;
        if (!t.interior[p] || !t.interior[p - S]) continue; // only inside the shape
        a += Math.abs(out[p] - out[p - S]);
        b += Math.abs(t.y[p] - t.y[p - S]);
      }
    return +(a / b).toFixed(3);
  });
  const dWeights = Object.fromEntries(Object.entries(D).map(([k, L]) => [k, { W: Array.from(L.W), b: Array.from(L.b) }]));
  return { mode, snapshots, losses, patches, crisp, dWeights };
};

// ---- main: one child process per mode, in parallel ---------------------------

const MODES = ["l1", "gan", "both"];

if (process.argv[2] === "--gradcheck") {
  // Compares every layer's backprop gradient with a finite-difference
  // estimate, for G and for D (weights and D's input). Ratios should be ~1.
  const rng = makeRng(3);
  // 1) each primitive alone, with a linear loss (no activation kinks)
  for (const [name, L, H, fwd, bwd] of [
    ["conv", makeConv(rng, 3, 4, 4, 2, 1), 8, convForward, convBackward],
    ["conv3", makeConv(rng, 3, 2, 3, 1, 1), 8, convForward, convBackward],
    ["convT", makeConv(rng, 3, 4, 4, 2, 1, true), 4, convTForward, convTBackward],
  ]) {
    const X = new Float32Array(L.cin * H * H).map(() => rng.randn());
    const { Y, Ho } = fwd(L, X, H);
    const Rr = new Float32Array(Y.length).map(() => rng.randn());
    const f = () => fwd(L, X, H).Y.reduce((s, v, i) => s + v * Rr[i], 0);
    L.gW.fill(0);
    const dX = bwd(L, X, H, Rr, Ho);
    let we = 0;
    let xe = 0;
    for (let i = 0; i < L.W.length; i++) {
      const o = L.W[i];
      L.W[i] = o + 1e-2;
      const up = f();
      L.W[i] = o - 1e-2;
      const dn = f();
      L.W[i] = o;
      we = Math.max(we, Math.abs(L.gW[i] - (up - dn) / 2e-2));
    }
    for (let i = 0; i < X.length; i++) {
      const o = X[i];
      X[i] = o + 1e-2;
      const up = f();
      X[i] = o - 1e-2;
      const dn = f();
      X[i] = o;
      xe = Math.max(xe, Math.abs(dX[i] - (up - dn) / 2e-2));
    }
    console.log(`${name.padEnd(6)} max abs error: weights ${we.toExponential(1)}, input ${xe.toExponential(1)}`);
  }
  // 2) the whole networks (finite differences can cross ReLU kinks, so a
  //    few percent of error on some weights is normal here)
  const ex = makeExample(rng);
  const G = makeG(rng);
  const D = makeD(rng);
  const R = new Float32Array(3 * S * S).map(() => rng.randn());
  const Rd = new Float32Array(PATCH * PATCH).map(() => rng.randn());
  const lossG = () => gForward(G, ex.x).out.reduce((s, v, i) => s + v * R[i], 0);
  const lossD = (y) => dForward(D, ex.x, y).logits.reduce((s, v, i) => s + v * Rd[i], 0);
  const check = (name, L, f) => {
    let worst = 0;
    for (let t = 0; t < 6; t++) {
      const i = Math.floor(rng.rand() * L.W.length);
      const old = L.W[i];
      L.W[i] = old + 1e-2;
      const up = f();
      L.W[i] = old - 1e-2;
      const down = f();
      L.W[i] = old;
      const num = (up - down) / 2e-2;
      if (Math.abs(num) > 1e-3) worst = Math.max(worst, Math.abs(L.gW[i] / num - 1));
    }
    console.log(`${name.padEnd(6)} worst relative error ${worst.toFixed(4)}`);
  };
  zeroGrad(G);
  const c = gForward(G, ex.x);
  gBackward(G, ex.x, c, R);
  for (const k of Object.keys(G)) check(`G.${k}`, G[k], lossG);
  zeroGrad(D);
  const dc = dForward(D, ex.x, ex.y);
  const dIn = dBackward(D, dc, Rd, true);
  for (const k of Object.keys(D)) check(`D.${k}`, D[k], () => lossD(ex.y));
  const y2 = Float32Array.from(ex.y);
  let worst = 0;
  for (let t = 0; t < 6; t++) {
    const i = Math.floor(rng.rand() * y2.length);
    const old = y2[i];
    y2[i] = old + 1e-2;
    const up = lossD(y2);
    y2[i] = old - 1e-2;
    const down = lossD(y2);
    y2[i] = old;
    const num = (up - down) / 2e-2;
    if (Math.abs(num) > 1e-3) worst = Math.max(worst, Math.abs(dIn[i] / num - 1));
  }
  console.log(`D input worst relative error ${worst.toFixed(4)}`);
} else if (process.argv[2] === "--child") {
  const result = train(process.argv[3]);
  process.send(result, () => process.exit(0));
} else {
  console.log(`Training 3 tiny Pix2Pix models (${STEPS} steps, batch ${BATCH}) in parallel...`);
  const runs = await Promise.all(
    MODES.map(
      (mode) =>
        new Promise((resolve, reject) => {
          const child = fork(fileURLToPath(import.meta.url), ["--child", mode]);
          child.on("message", resolve);
          child.on("exit", (code) => code !== 0 && reject(new Error(`${mode} exited with ${code}`)));
        }),
    ),
  );
  const tests = testSet().slice(0, N_TEST);
  // Score the L1-only run's final (blurry) outputs with the discriminator
  // trained in the "both" run: what does a trained PatchGAN think of blur?
  const byMode = Object.fromEntries(runs.map((r) => [r.mode, r]));
  const D = makeD(makeRng(0));
  for (const [k, w] of Object.entries(byMode.both.dWeights)) (D[k].W.set(w.W), D[k].b.set(w.b));
  const l1Final = byMode.l1.snapshots[byMode.l1.snapshots.length - 1].outputs;
  const fromBytes = (b64) => Float32Array.from(Buffer.from(b64, "base64"), (v) => (v / 255) * 2 - 1);
  byMode.both.patchesL1 = tests.map((t, i) => Array.from(dForward(D, t.x, fromBytes(l1Final[i])).logits, (z) => +sigmoid(z).toFixed(3)));
  for (const r of runs) delete r.dWeights;
  const trace = {
    settings: { SEED, STEPS, BATCH, LR, LAMBDA, NGF, NDF, size: S, patch: PATCH },
    tests: tests.map((t) => ({ input: toBytes(t.x), target: toBytes(t.y), kind: t.kind, phase: t.phase })),
    runs: Object.fromEntries(runs.map((r) => [r.mode, r])),
  };
  // The video's "why L1 blurs" scene: the 4 possible stripe positions for one outline.
  const rng = makeRng(1);
  trace.phases = [0, 1, 2, 3].map((phase) => toBytes(makeExample(rng, { kind: 0, r: 11, cx: 16, cy: 16, phase }).y));
  writeFileSync(OUT, JSON.stringify(trace));
  console.log("\nHow crisp are the stripes on the test images? (1 = as crisp as the real target)");
  for (const r of runs) console.log(`  ${r.mode.padEnd(5)} ${r.crisp.join("  ")}   final L1 ${r.losses[r.losses.length - 1].l1.toFixed(3)}`);
  console.log(`\n→ ${OUT}`);
}
