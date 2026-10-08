// Trains a real, tiny GAN on 1-D data and records how it learns.
//
//   npm run train            # → src/gan-trace.json
//
// The "real data" is a mixture of two bell curves (two bumps). The generator
// turns a random number z into a number x; the discriminator turns a number
// x into the probability that it is real. Both are small neural networks
// (multi-layer perceptrons with leaky-ReLU), trained with backpropagation
// and Adam, written out by hand below so there is nothing hidden.
//
// The video's "A real GAN, learning" scene (src/scenes/Demo.tsx) draws the
// recorded snapshots: the real density, the generator's density, the
// discriminator's D(x) curve, the losses and the z → x mapping.
// Everything is seeded, so every run produces the same file (~10 s).

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---- settings ---------------------------------------------------------------

// Every setting can be overridden from the shell to experiment, e.g.
//   SEED=3 D_STEPS=1 npm run train
// (the video's "GAN in action" scene then shows the new run).
const env = (name, fallback) => Number(process.env[name] ?? fallback);
const SEED = env("SEED", 11);
const STEPS = env("STEPS", 3000); // training steps
const D_STEPS = env("D_STEPS", 3); // D updates per G update ("k" in the 2014 paper)
const BATCH = env("BATCH", 128);
const LR_D = env("LR_D", 1e-3);
const LR_G = env("LR_G", 5e-4);
const HIDDEN = env("HIDDEN", 24); // neurons per hidden layer, both networks
const SNAPSHOT_EVERY = 25;
const X_MIN = -5;
const X_MAX = 5;
const GRID = 161; // points where densities and D(x) are evaluated

// Real data: two bumps.
const MODES = [
  { mean: -2, std: 0.5, weight: 0.5 },
  { mean: 2, std: 0.5, weight: 0.5 },
];

// ---- random numbers ---------------------------------------------------------

let state = SEED >>> 0;
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
const sampleReal = () => {
  let u = rand();
  for (const m of MODES) {
    if (u < m.weight) return m.mean + m.std * randn();
    u -= m.weight;
  }
  return MODES[MODES.length - 1].mean;
};
const sampleZ = () => randn();

// ---- a tiny MLP with hand-written backprop ----------------------------------

const act = {
  tanh: { f: Math.tanh, df: (y) => 1 - y * y }, // df takes the output
  lrelu: { f: (x) => (x > 0 ? x : 0.2 * x), df: (y) => (y > 0 ? 1 : 0.2) },
};

const makeLayer = (nIn, nOut) => ({
  nIn,
  nOut,
  W: Array.from({ length: nOut * nIn }, () => randn() * Math.sqrt(1 / nIn)),
  b: new Array(nOut).fill(0),
});

// sizes = [1, 24, 24, 1]; hidden layers use `hidden`, the last is linear.
const makeMLP = (sizes, hidden) => {
  const layers = [];
  for (let i = 0; i + 1 < sizes.length; i++) layers.push(makeLayer(sizes[i], sizes[i + 1]));
  return { layers, hidden: act[hidden] };
};

// Returns every layer's output (needed for backprop); the last one is the output.
const forward = (net, x) => {
  const outs = [x];
  let a = x;
  net.layers.forEach((L, li) => {
    const last = li === net.layers.length - 1;
    const y = new Array(L.nOut);
    for (let o = 0; o < L.nOut; o++) {
      let s = L.b[o];
      for (let i = 0; i < L.nIn; i++) s += L.W[o * L.nIn + i] * a[i];
      y[o] = last ? s : net.hidden.f(s);
    }
    outs.push(y);
    a = y;
  });
  return outs;
};

// Adds this sample's gradients into `grads` (if given) and returns dLoss/dInput.
const backward = (net, outs, dOut, grads) => {
  let d = dOut;
  for (let li = net.layers.length - 1; li >= 0; li--) {
    const L = net.layers[li];
    const last = li === net.layers.length - 1;
    const y = outs[li + 1];
    const a = outs[li];
    const dz = d.map((g, o) => (last ? g : g * net.hidden.df(y[o])));
    const dIn = new Array(L.nIn).fill(0);
    for (let o = 0; o < L.nOut; o++) {
      if (grads) grads[li].b[o] += dz[o];
      for (let i = 0; i < L.nIn; i++) {
        if (grads) grads[li].W[o * L.nIn + i] += dz[o] * a[i];
        dIn[i] += dz[o] * L.W[o * L.nIn + i];
      }
    }
    d = dIn;
  }
  return d;
};

const zeroGrads = (net) => net.layers.map((L) => ({ W: new Array(L.W.length).fill(0), b: new Array(L.b.length).fill(0) }));

const makeAdam = (net, beta1 = 0.5, beta2 = 0.999) => {
  const m = zeroGrads(net);
  const v = zeroGrads(net);
  let t = 0;
  return (grads, scale, lr) => {
    t++;
    net.layers.forEach((L, li) => {
      for (const k of ["W", "b"]) {
        for (let i = 0; i < L[k].length; i++) {
          const g = grads[li][k][i] * scale;
          m[li][k][i] = beta1 * m[li][k][i] + (1 - beta1) * g;
          v[li][k][i] = beta2 * v[li][k][i] + (1 - beta2) * g * g;
          const mh = m[li][k][i] / (1 - beta1 ** t);
          const vh = v[li][k][i] / (1 - beta2 ** t);
          L[k][i] -= (lr * mh) / (Math.sqrt(vh) + 1e-8);
        }
      }
    });
  };
};

const sigmoid = (s) => 1 / (1 + Math.exp(-s));

// ---- the GAN ----------------------------------------------------------------

const G = makeMLP([1, HIDDEN, HIDDEN, 1], "lrelu"); // z → x
const D = makeMLP([1, HIDDEN, HIDDEN, 1], "lrelu"); // x → logit; D(x) = sigmoid(logit)
const stepD = makeAdam(D);
const stepG = makeAdam(G);
// Learning rates shrink linearly to 10% so the game settles instead of circling.
const decay = (step) => 1 - 0.9 * (step / STEPS);

const generate = (z) => forward(G, [z]);
const discriminate = (x) => forward(D, [x]);
const Dx = (x) => sigmoid(discriminate(x).at(-1)[0]);

// Fixed noise used to draw the generator's distribution in every snapshot.
const PROBE_Z = Array.from({ length: 6000 }, sampleZ);

const xs = Array.from({ length: GRID }, (_, i) => X_MIN + ((X_MAX - X_MIN) * i) / (GRID - 1));
const normal = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
const realDensity = xs.map((x) => MODES.reduce((p, m) => p + m.weight * normal(x, m.mean, m.std), 0));

// Smooth density of a set of samples (kernel density estimate).
const kde = (samples, bw = 0.15) => {
  const out = new Array(GRID).fill(0);
  const dx = (X_MAX - X_MIN) / (GRID - 1);
  for (const s of samples) {
    const lo = Math.max(0, Math.floor((s - 4 * bw - X_MIN) / dx));
    const hi = Math.min(GRID - 1, Math.ceil((s + 4 * bw - X_MIN) / dx));
    for (let i = lo; i <= hi; i++) out[i] += normal(xs[i], s, bw);
  }
  return out.map((v) => v / samples.length);
};

const round = (v, d = 4) => Number(v.toFixed(d));
const Z_LINE = Array.from({ length: 41 }, (_, i) => -3 + (6 * i) / 40); // for the z → x curve

const snapshot = (step, dLoss, gLoss) => {
  const fakes = PROBE_Z.map((z) => generate(z).at(-1)[0]);
  return {
    step,
    dLoss: round(dLoss),
    gLoss: round(gLoss),
    gen: kde(fakes).map((v) => round(v)),
    d: xs.map((x) => round(Dx(x))),
    map: Z_LINE.map((z) => round(generate(z).at(-1)[0], 3)),
  };
};

const snapshots = [];
let dLossAvg = Math.log(4);
let gLossAvg = Math.log(2);

for (let step = 0; step <= STEPS; step++) {
  if (step % SNAPSHOT_EVERY === 0) snapshots.push(snapshot(step, dLossAvg, gLossAvg));
  if (step === STEPS) break;

  // 1) Discriminator steps: real → label 1, fake → label 0. G is frozen.
  let dLoss = 0;
  for (let k = 0; k < D_STEPS; k++) {
    const gD = zeroGrads(D);
    dLoss = 0;
    for (let b = 0; b < BATCH; b++) {
      const real = sampleReal();
      let outs = discriminate(real);
      let p = sigmoid(outs.at(-1)[0]);
      dLoss += -Math.log(p + 1e-9);
      backward(D, outs, [p - 1], gD); // d(-log p)/dlogit = p - 1

      const fake = generate(sampleZ()).at(-1)[0];
      outs = discriminate(fake);
      p = sigmoid(outs.at(-1)[0]);
      dLoss += -Math.log(1 - p + 1e-9);
      backward(D, outs, [p], gD); // d(-log(1-p))/dlogit = p
    }
    stepD(gD, 1 / BATCH, LR_D * decay(step));
  }

  // 2) Generator step: make D say "real" (non-saturating loss -log D(G(z))).
  //    The gradient flows back through D (not updated) into G.
  const gG = zeroGrads(G);
  let gLoss = 0;
  for (let b = 0; b < BATCH; b++) {
    const gOuts = generate(sampleZ());
    const dOuts = discriminate(gOuts.at(-1)[0]);
    const p = sigmoid(dOuts.at(-1)[0]);
    gLoss += -Math.log(p + 1e-9);
    const dx = backward(D, dOuts, [p - 1], null); // dLoss/dx, D's weights untouched
    backward(G, gOuts, dx, gG);
  }
  stepG(gG, 1 / BATCH, LR_G * decay(step));

  dLossAvg = 0.9 * dLossAvg + 0.1 * (dLoss / BATCH);
  gLossAvg = 0.9 * gLossAvg + 0.1 * (gLoss / BATCH);
  if (step % 250 === 0) {
    console.log(`step ${String(step).padStart(5)}  D loss ${dLossAvg.toFixed(3)}  G loss ${gLossAvg.toFixed(3)}`);
  }
}

const trace = {
  _comment: "Generated by scripts/train-gan.mjs (npm run train). Do not edit by hand.",
  config: { seed: SEED, steps: STEPS, dSteps: D_STEPS, batch: BATCH, lrD: LR_D, lrG: LR_G, hidden: HIDDEN, modes: MODES },
  xMin: X_MIN,
  xMax: X_MAX,
  real: realDensity.map((v) => round(v)),
  zLine: Z_LINE.map((z) => round(z, 3)),
  snapshots,
};
writeFileSync(join(root, "src/gan-trace.json"), JSON.stringify(trace) + "\n");

const last = snapshots.at(-1);
const mid = Math.floor(GRID / 2);
console.log(`\n${snapshots.length} snapshots → src/gan-trace.json`);
console.log(`final D(x) at x=-2, 0, 2: ${last.d[Math.round((GRID - 1) * 0.3)]}, ${last.d[mid]}, ${last.d[Math.round((GRID - 1) * 0.7)]}`);
