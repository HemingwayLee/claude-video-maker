// Cuts the man's poses out of the sticker sheet in assets/ and saves each
// one as its own transparent PNG with a clean white sticker outline.
//
//   npm run papa
//
// Input:  assets/*.png         (the sticker sheets, copied from /tobeused/papa)
// Output: public/papa/<pose>.png
//         public/papa/poses.json   { "<pose>": [width, height], ... } (read by src/components/Papa.tsx)
//
// A pose is not taken as a plain crop, because sparkles, hearts and music
// notes sit right next to him:
//   1. crop a box around the pose (POSES below),
//   2. keep the largest blob of non-transparent pixels: the man,
//   3. fill the holes inside it,
//   4. upscale 2× and draw a new, even white outline around it.

import sharp from "sharp";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public/papa");

// The clean, transparent sheet: 5 columns × 3 rows. (The other sheet,
// ba9eb3c2…, has red and yellow blotches stuck to the figures.)
const SHEET = "assets/8c738fcc-c93d-403e-a2b0-82c9ca374b71.png";

// Pose name → crop box [x0, y0, x1, y1] in sheet pixels.
const POSES = {
  wave: [0, 0, 300, 365], // blue cap, waving
  thumbs: [305, 0, 610, 365], // grey cap, two thumbs up
  squat: [918, 0, 1225, 365], // navy shirt, squatting, hands on knees
  arms: [0, 365, 305, 690], // white cap, arms wide open, laughing
  scratch: [305, 365, 610, 690], // blue cap, hand on his cap: "hmm…"
  crossed: [612, 365, 918, 690], // grey cap, arms crossed
  please: [918, 365, 1225, 690], // white cap, palms together
  fist: [1225, 365, 1536, 690], // blue cap, fist up, one leg kicked back
  chin: [0, 690, 305, 1024], // grey cap, squatting, hand on chin
  walk: [305, 690, 612, 1024], // white cap, walking
  point: [918, 690, 1225, 1024], // grey cap, pointing at you, laughing
  cheer: [1225, 690, 1536, 1024], // white cap, both fists up
};

const SCALE = 2; // the poses are small (~250×330), the video is 1920×1080
const OUTLINE = 9; // white sticker outline, in output pixels

const isInk = (d, i) => d[i + 3] >= 128;

// Largest 4-connected blob where pred(i) is true. Returns a 0/1 mask.
const largestBlob = (W, H, pred) => {
  const lab = new Int32Array(W * H).fill(-1);
  let best = -1, bestN = 0;
  for (let s = 0; s < W * H; s++) {
    if (lab[s] !== -1 || !pred(s)) continue;
    const id = s; let n = 0; const st = [s]; lab[s] = id;
    while (st.length) {
      const p = st.pop(); n++;
      const x = p % W;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]) {
        if (q < 0 || q >= W * H || lab[q] !== -1 || !pred(q)) continue;
        lab[q] = id; st.push(q);
      }
    }
    if (n > bestN) { bestN = n; best = id; }
  }
  const mask = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) mask[i] = lab[i] === best ? 1 : 0;
  return mask;
};

// Everything not reachable from the border without crossing the mask is inside.
const fillHoles = (W, H, mask) => {
  const outside = new Uint8Array(W * H);
  const st = [];
  for (let x = 0; x < W; x++) st.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) st.push(y * W, y * W + W - 1);
  while (st.length) {
    const p = st.pop();
    if (outside[p] || mask[p]) continue;
    outside[p] = 1;
    const x = p % W;
    if (x > 0) st.push(p - 1);
    if (x < W - 1) st.push(p + 1);
    if (p >= W) st.push(p - W);
    if (p < W * (H - 1)) st.push(p + W);
  }
  for (let i = 0; i < W * H; i++) mask[i] = outside[i] ? 0 : 1;
};

// Grow the mask by r pixels (round brush), via a distance check on a box.
const dilate = (W, H, mask, r) => {
  const out = new Uint8Array(W * H);
  const offs = [];
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) offs.push([dx, dy]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!mask[y * W + x]) continue;
    // Only edge pixels need to stamp the brush.
    const edge = x === 0 || y === 0 || x === W - 1 || y === H - 1 ||
      !mask[y * W + x - 1] || !mask[y * W + x + 1] || !mask[(y - 1) * W + x] || !mask[(y + 1) * W + x];
    if (!edge) { out[y * W + x] = 1; continue; }
    for (const [dx, dy] of offs) {
      const X = x + dx, Y = y + dy;
      if (X >= 0 && Y >= 0 && X < W && Y < H) out[Y * W + X] = 1;
    }
  }
  return out;
};

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const sheet = SHEET;
const sizes = {};
for (const [name, [x0, y0, x1, y1]] of Object.entries(POSES)) {
  const w = x1 - x0, h = y1 - y0;
  const { data } = await sharp(join(root, sheet)).ensureAlpha()
    .extract({ left: x0, top: y0, width: w, height: h }).raw().toBuffer({ resolveWithObject: true });

  // 1–3: the man's silhouette at sheet resolution.
  const mask = largestBlob(w, h, (i) => isInk(data, i * 4));
  fillHoles(w, h, mask);
  const keep = dilate(w, h, mask, 1); // include the anti-aliased edge
  const cut = Buffer.from(data);
  for (let i = 0; i < w * h; i++) {
    if (!keep[i]) { cut[i * 4 + 3] = 0; continue; }
    // Opaque inside (no half-transparent spots on him).
    if (mask[i]) cut[i * 4 + 3] = 255;
  }

  // 4: upscale, then put it on a white sticker silhouette with a margin.
  const pad = OUTLINE + 4;
  const W = w * SCALE + pad * 2, H = h * SCALE + pad * 2;
  const big = await sharp(cut, { raw: { width: w, height: h, channels: 4 } })
    .resize(w * SCALE, h * SCALE, { kernel: "lanczos3" })
    .sharpen({ sigma: 0.8 })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw().toBuffer();
  const silhouette = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) silhouette[i] = big[i * 4 + 3] > 100 ? 1 : 0;
  const ring = dilate(W, H, silhouette, OUTLINE);
  const sticker = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) if (ring[i]) sticker.set([255, 255, 255, 255], i * 4);
  const white = await sharp(sticker, { raw: { width: W, height: H, channels: 4 } }).blur(0.8).png().toBuffer();

  // Trim to the sticker and save.
  const file = join(outDir, `${name}.png`);
  const info = await sharp(white)
    .composite([{ input: big, raw: { width: W, height: H, channels: 4 } }])
    .png().toBuffer()
    .then((buf) => sharp(buf).trim({ threshold: 1 }).png({ compressionLevel: 9 }).toFile(file));
  sizes[name] = [info.width, info.height];
  console.log(`${name.padEnd(8)} ${info.width}×${info.height}  ← [${x0},${y0},${x1},${y1}]`);
}

writeFileSync(join(outDir, "poses.json"), JSON.stringify(sizes, null, 2) + "\n");
