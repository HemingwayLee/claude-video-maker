// Geometry of the banana plant, in "world" coordinates: the 1080×1920
// frame when the camera is not zoomed (see components/World.tsx).
//
//              leaves
//                │
//   trunk ───► crown ──► stalk arches over ──► RACHIS_X
//                                              │  hand 0  (梳)
//                                              │  ...
//                                              │  hand 5  (last hand)
//                                              ┼  CUT_Y   ← cut here
//                                              │  empty hands (空梳)
//                                              │  flower nodes (花指)
//                                              ▼  banana flower (香蕉花)
//
// `g` (growth, 0 → 1) fattens the bananas and stretches the stalk below
// the last hand, which is where the empty hands and finger flowers appear.

export const GROUND_Y = 1640;
export const TRUNK_X = 335;
export const CROWN_Y = 600;
export const RACHIS_X = 650;

export const HAND_COUNT = 6;
export const HAND_Y = Array.from({ length: HAND_COUNT }, (_, i) => 700 + i * 58);
export const LAST_HAND_Y = HAND_Y[HAND_COUNT - 1];
export const CUT_Y = LAST_HAND_Y + 34;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// Length of the bare stalk between the last hand and the flower.
export const lowerStalkLength = (g: number) => mix(110, 360, g);
// Where the banana flower hangs (its top).
export const budTop = (g: number) => LAST_HAND_Y + lowerStalkLength(g);
// The flower shrinks a little as the stalk grows (it uses up its bracts).
export const budScale = (g: number) => mix(1, 0.78, g);
export const BUD_LENGTH = 210; // at scale 1
export const budCenter = (g: number) => budTop(g) + (BUD_LENGTH * budScale(g)) / 2;

// Nodes on the lower stalk, as a fraction of its length.
// "empty": a hand with no real bananas (空梳); "finger": withered flowers that
// never set fruit (不結果的花指). They become visible as the stalk grows.
export const NODES: { f: number; kind: "empty" | "finger"; side: number }[] = [
  { f: 0.16, kind: "empty", side: 1 },
  { f: 0.32, kind: "empty", side: -1 },
  { f: 0.5, kind: "finger", side: 1 },
  { f: 0.64, kind: "finger", side: -1 },
  { f: 0.78, kind: "finger", side: 1 },
];
export const nodeY = (f: number, g: number) => LAST_HAND_Y + 18 + (lowerStalkLength(g) - 18) * f;

// One banana ("根") as a quadratic curve: base on the stalk → tip pointing up.
export type Finger = { d: string; thick: number; tip: [number, number]; back: boolean };

export const handFingers = (h: number, g: number): Finger[] => {
  const s = 1 - h * 0.06; // the top hands are the biggest
  const len = (64 + 40 * g) * s;
  const thick = (14 + 8 * g) * s;
  const y = HAND_Y[h];
  const out: Finger[] = [];
  const row = (js: number[], back: boolean) => {
    for (const j of js) {
      const bx = RACHIS_X + j * 9 * s;
      const by = y + 4 + (back ? -6 : 0);
      const cx = RACHIS_X + j * 32 * s * (1 + 0.15 * g);
      const cy = y + 8;
      const tx = RACHIS_X + j * 40 * s * (1 + 0.2 * g);
      const ty = y - len * (back ? 0.92 : 0.8) + Math.abs(j) * 7;
      out.push({ d: `M ${bx} ${by} Q ${cx} ${cy} ${tx} ${ty}`, thick, tip: [tx, ty], back });
    }
  };
  // Back row first, then the front row from the outside in.
  row([-2.5, 2.5, -1.5, 1.5, -0.5, 0.5], true);
  row([-3, 3, -2, 2, -1, 1, 0], false);
  return out;
};

// A banana leaf: a midrib from `base` through `ctrl` to `tip`, a blade on
// both sides, and a few tears on one side (real banana leaves shred in the wind).
export type LeafDef = { ctrl: [number, number]; tip: [number, number]; width: number; old?: boolean };

export const LEAVES_BACK: LeafDef[] = [
  { ctrl: [260, 250], tip: [110, 170], width: 78 },
  { ctrl: [360, 190], tip: [430, 80], width: 80 },
  { ctrl: [490, 250], tip: [660, 190], width: 78 },
];
export const LEAVES_FRONT: LeafDef[] = [
  { ctrl: [190, 390], tip: [10, 470], width: 76 },
  { ctrl: [250, 540], tip: [100, 760], width: 62, old: true },
  { ctrl: [540, 410], tip: [800, 470], width: 70 },
];

const quad = (p0: number[], p1: number[], p2: number[], t: number) => {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ];
};

export const leafShape = (base: [number, number], leaf: LeafDef, sway: number) => {
  const tip: [number, number] = [leaf.tip[0], leaf.tip[1] + sway];
  const n = 26;
  const left: number[][] = [];
  const right: number[][] = [];
  const rib: number[][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = quad(base, leaf.ctrl, tip, t);
    const q = quad(base, leaf.ctrl, tip, Math.min(1, t + 0.01));
    const p0 = quad(base, leaf.ctrl, tip, Math.max(0, t - 0.01));
    const dx = q[0] - p0[0];
    const dy = q[1] - p0[1];
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l;
    const ny = dx / l;
    const w = leaf.width * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08)), 0.6) * (t < 0.08 ? t / 0.08 : 1);
    // Tears: every few samples the outer edge dips in toward the midrib.
    const tear = i > 4 && i < n - 2 && i % 4 === 0 ? 0.55 : 1;
    left.push([p[0] + nx * w * tear, p[1] + ny * w * tear]);
    right.push([p[0] - nx * w * 0.85, p[1] - ny * w * 0.85]);
    rib.push(p);
  }
  const pts = (a: number[][]) => a.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ");
  return {
    upper: `M ${pts(left)} L ${pts([...rib].reverse())} Z`,
    lower: `M ${pts(rib)} L ${pts([...right].reverse())} Z`,
    outline: `M ${pts(left)} L ${pts([...right].reverse())} Z`,
    rib: `M ${pts(rib)}`,
  };
};
