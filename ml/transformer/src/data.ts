import { random } from "remotion";

// Everything the scenes compute. The attention, softmax, masking and
// positional-encoding numbers on screen are calculated here, not typed in.

export type Matrix = number[][];

// ---- small linear algebra ----------------------------------------------------

export const matmul = (a: Matrix, b: Matrix): Matrix => a.map((row) => b[0].map((_, j) => row.reduce((s, v, k) => s + v * b[k][j], 0)));
export const transpose = (m: Matrix): Matrix => m[0].map((_, j) => m.map((row) => row[j]));
export const scale = (m: Matrix, s: number): Matrix => m.map((row) => row.map((v) => v * s));
export const softmax = (row: number[]) => {
  const max = Math.max(...row.filter((v) => Number.isFinite(v)));
  const e = row.map((v) => (Number.isFinite(v) ? Math.exp(v - max) : 0));
  const sum = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / sum);
};
export const softmaxRows = (m: Matrix): Matrix => m.map(softmax);

// Standard-normal numbers, the same on every render for the same seed.
export const gaussian = (seed: string, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const u = Math.max(1e-6, random(`${seed}-u-${i}`));
    const v = random(`${seed}-v-${i}`);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  });

// ---- tokens and embeddings ---------------------------------------------------

export const IT_SENTENCE = ["The", "animal", "didn't", "cross", "the", "street", "because", "it", "was", "too", "tired"];
export const IT_INDEX = 7;

// Illustrative attention of "it" (a trained model learns weights like these;
// see the README). Two versions: ending in "tired" and ending in "wide".
const itWeights = (target: number, second: number) => {
  const raw = IT_SENTENCE.map((_, i) => (i === target ? 3.2 : i === second ? 1.4 : i === IT_INDEX ? 1.1 : 0.2 + 0.4 * random(`it-${i}`)));
  return softmax(raw);
};
export const IT_TIRED = itWeights(1, 5); // → "animal"
export const IT_WIDE = itWeights(5, 1); // → "street"

export const TOKEN_SENTENCE = ["The", "cat", "sat", "on", "the", "mat", "."];
// Example IDs, in the style of a real tokenizer's vocabulary.
export const TOKEN_IDS = [464, 3797, 3332, 319, 262, 2603, 13];
export const EMBED_DIM_SHOWN = 8;
export const embedding = (token: string) => gaussian(`emb-${token.toLowerCase()}`, EMBED_DIM_SHOWN);

// ---- positional encoding (sinusoidal, as in the original paper) --------------
// PE(pos, 2i) = sin(pos / 10000^(2i/d)),  PE(pos, 2i+1) = cos(pos / 10000^(2i/d))

export const positionalEncoding = (pos: number, i: number, d: number) => {
  const angle = pos / Math.pow(10000, (2 * Math.floor(i / 2)) / d);
  return i % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
};

// ---- attention, step by step -------------------------------------------------
// Four tokens, d_k = 4. Q, K and V are hand-picked small numbers so the
// pattern is easy to read; every number derived from them is computed.

export const MATH_TOKENS = ["the", "cat", "sat", "down"];
export const Q: Matrix = [
  [1.2, 0.1, 0.3, 0.0],
  [0.2, 1.0, 1.1, 0.0],
  [1.4, 0.3, 0.0, 0.2],
  [0.0, 1.1, 0.8, 0.6],
];
export const K: Matrix = [
  [0.3, 0.2, 0.1, 0.9],
  [1.6, 0.2, 0.4, 0.0],
  [0.1, 1.4, 1.2, 0.3],
  [0.0, 0.3, 0.2, 1.2],
];
export const V: Matrix = [
  [0.1, 0.0, 0.2, 0.9],
  [1.0, 0.2, 0.0, 0.3],
  [0.0, 1.1, 0.4, 0.1],
  [0.3, 0.1, 1.0, 0.2],
];
export const D_K = 4;
export const SCORES = matmul(Q, transpose(K)); // step 1
export const SCALED = scale(SCORES, 1 / Math.sqrt(D_K)); // step 2
export const WEIGHTS = softmaxRows(SCALED); // step 3
export const OUTPUT = matmul(WEIGHTS, V); // step 4

// ---- multi-head attention: three typical head patterns (illustrative) -------

export const HEAD_TOKENS = ["The", "cat", "saw", "a", "mouse", "and", "chased", "it"];
const pattern = (target: (i: number) => number) =>
  HEAD_TOKENS.map((_, i) => softmax(HEAD_TOKENS.map((_, j) => (j === target(i) ? 3 : 0.3 * random(`head-${i}-${j}`)))));
export const HEADS = [
  { name: "previous word", m: pattern((i) => Math.max(0, i - 1)) },
  { name: "pronoun → noun", m: pattern((i) => (i === 7 ? 4 : i)) },
  { name: "verb → object", m: pattern((i) => (i === 2 ? 4 : i === 6 ? 7 : i)) },
];

// ---- causal mask -------------------------------------------------------------

export const GEN_TOKENS = ["The", "cat", "sat", "on", "the"];
export const GEN_SCORES: Matrix = GEN_TOKENS.map((_, i) => GEN_TOKENS.map((_, j) => Number((1.5 * gaussian(`mask-${i}`, 5)[j]).toFixed(1))));
export const MASKED = GEN_SCORES.map((row, i) => row.map((v, j) => (j > i ? -Infinity : v)));
export const MASKED_WEIGHTS = softmaxRows(MASKED);

// Next-token scores for "The cat sat on the …" (example numbers; the softmax is real).
export const NEXT = [
  { token: "mat", logit: 3.1 },
  { token: "floor", logit: 2.4 },
  { token: "sofa", logit: 2.1 },
  { token: "roof", logit: 1.3 },
  { token: "table", logit: 1.1 },
  { token: "dog", logit: 0.2 },
];
export const NEXT_P = softmax(NEXT.map((n) => n.logit));
