// Small images and the math that runs on them. Every number shown in the
// video is computed here, so the visuals are real convolutions.

export type Matrix = number[][];

// A 16×16 pixel-art cat. # = 0.9 (fur), + = 0.5 (nose), o = 0.1 (eyes).
const CAT_ART = [
  "................",
  ".##..........##.",
  ".###........###.",
  ".####......####.",
  ".##############.",
  ".##############.",
  ".###oo####oo###.",
  ".###oo####oo###.",
  ".##############.",
  ".######++######.",
  "..#####++#####..",
  "..###+####+###..",
  "...##########...",
  "....########....",
  "......####......",
  "................",
];
const PIXEL: Record<string, number> = { ".": 0, "#": 0.9, "+": 0.5, o: 0.1 };
export const CAT: Matrix = CAT_ART.map((row) => row.split("").map((ch) => PIXEL[ch]));

// 8×8 image with a white rectangle: the input of the convolution scene.
export const BOX: Matrix = Array.from({ length: 8 }, (_, r) =>
  Array.from({ length: 8 }, (_, c) => (r >= 1 && r <= 6 && c >= 2 && c <= 5 ? 1 : 0)),
);

export const KERNELS = {
  vertical: [
    [-1, 0, 1],
    [-1, 0, 1],
    [-1, 0, 1],
  ],
  horizontal: [
    [-1, -1, -1],
    [0, 0, 0],
    [1, 1, 1],
  ],
  diagonal: [
    [0, 1, 1],
    [-1, 0, 1],
    [-1, -1, 0],
  ],
};

// "Valid" 2-D convolution (strictly, cross-correlation, as in every DL library).
export const convolve = (img: Matrix, k: Matrix, stride = 1): Matrix => {
  const kh = k.length;
  const kw = k[0].length;
  const oh = Math.floor((img.length - kh) / stride) + 1;
  const ow = Math.floor((img[0].length - kw) / stride) + 1;
  return Array.from({ length: oh }, (_, r) =>
    Array.from({ length: ow }, (_, c) => {
      let sum = 0;
      for (let i = 0; i < kh; i++)
        for (let j = 0; j < kw; j++) sum += img[r * stride + i][c * stride + j] * k[i][j];
      return Math.round(sum * 100) / 100;
    }),
  );
};

export const relu = (m: Matrix): Matrix => m.map((row) => row.map((v) => Math.max(0, v)));

export const maxAbs = (m: Matrix) => Math.max(...m.flat().map(Math.abs));

// Pooling example.
export const POOL_IN: Matrix = [
  [1, 3, 2, 1],
  [4, 6, 0, 2],
  [0, 2, 8, 5],
  [1, 1, 3, 7],
];
