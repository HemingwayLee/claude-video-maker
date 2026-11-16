import React from "react";
import { COLORS, INK } from "../theme";

// A sweet potato leaf cutting (地瓜葉枝條), drawn in the same soft sticker
// style as the man: gradients, thin dark outline. The cut end of the stem is
// at (0, 0) and the stem goes up (−y), `length` tall (380; 500 in a glass, so
// the leaves stay above the rim).
//
//   wilt  0 → 1  the stem bends over, leaves droop, shrink and turn yellow
//   roots 0 → 1  white roots grow out of the lower stem (in the water)
//   grow  0 → 1  the tip grows on and unfolds two new, pale leaves

let uid = 0;
const useUid = (p: string) => React.useMemo(() => `${p}${uid++}`, [p]);

const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};

// A heart-shaped leaf, base (where the stalk joins) at (0, 0), tip up. About 120 long.
const LEAF = "M0,-6 C-12,6 -52,8 -58,-28 C-62,-62 -32,-94 0,-124 C32,-94 62,-62 58,-28 C52,8 12,6 0,-6 Z";

export const Leaf: React.FC<{ fill: string; vein?: string }> = ({ fill, vein = COLORS.leafVein }) => (
  <g>
    <path d={LEAF} fill={fill} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    <path
      d="M0,-6 L0,-112 M0,-30 Q-26,-40 -44,-30 M0,-30 Q26,-40 44,-30 M0,-58 Q-22,-68 -36,-70 M0,-58 Q22,-68 36,-70 M0,-84 Q-12,-92 -20,-98 M0,-84 Q12,-92 20,-98"
      fill="none"
      stroke={vein}
      strokeWidth={3}
      strokeLinecap="round"
      opacity={0.8}
    />
    <ellipse cx={-26} cy={-62} rx={14} ry={24} fill="#fff" opacity={0.22} transform="rotate(20 -26 -62)" />
  </g>
);

type P = [number, number];
const bez = (p0: P, p1: P, p2: P, p3: P, t: number): P => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};

// Leaves along the stem: where (0–1 up the stem), which side, size.
const NODES = [
  { t: 0.52, side: -1, s: 0.95 },
  { t: 0.64, side: 1, s: 1 },
  { t: 0.76, side: -1, s: 0.95 },
  { t: 0.87, side: 1, s: 0.85 },
  { t: 1, side: 0, s: 0.75 },
];

// Roots: from three points low on the stem, three roots each. They spread
// sideways more than down, so they stay inside the glass.
const ROOT_NODES = [0.05, 0.13, 0.21];
const ROOTS = [
  { dx: -1, len: 1, bend: 18 },
  { dx: 1, len: 0.85, bend: -14 },
  { dx: -0.3, len: 0.7, bend: 10 },
];

export const Cutting: React.FC<{ wilt?: number; roots?: number; grow?: number; sway?: number; length?: number }> = ({
  wilt = 0,
  roots = 0,
  grow = 0,
  sway = 0,
  length: H = 380,
}) => {
  const id = useUid("ct");
  const p0: P = [0, 0];
  const p1: P = [6, -H * 0.35];
  const p2: P = [-8 + wilt * 70 + sway * 0.4, -H * 0.72];
  const p3: P = [wilt * 120 + sway, -H * (1 - 0.28 * wilt)];
  const stemPath = `M${p0} C${p1} ${p2} ${p3}`;

  const leafFill = mixHex(COLORS.leaf, COLORS.leafDry, wilt);
  const leafLight = mixHex(COLORS.leafLight, "#e8d88a", wilt);
  const leafDark = mixHex(COLORS.leafDark, COLORS.leafDryDark, wilt);
  const vein = mixHex(COLORS.leafVein, "#efe2a0", wilt);

  // new growth at the tip
  const tip = p3;
  const newTip: P = [tip[0] + 6 * grow, tip[1] - 90 * grow];

  return (
    <g>
      <defs>
        <radialGradient id={id} cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor={leafLight} />
          <stop offset="60%" stopColor={leafFill} />
          <stop offset="100%" stopColor={leafDark} />
        </radialGradient>
        <radialGradient id={`${id}n`} cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#d8f7a8" />
          <stop offset="100%" stopColor={COLORS.leafNew} />
        </radialGradient>
        <linearGradient id={`${id}s`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={COLORS.stemPurple} />
          <stop offset="45%" stopColor={COLORS.stem} />
        </linearGradient>
      </defs>

      {/* roots */}
      {roots > 0 &&
        ROOT_NODES.map((t, i) => {
          const [x, y] = bez(p0, p1, p2, p3, (t * 380) / H);
          return ROOTS.map((r, j) => {
            const k = Math.max(0, Math.min(1, roots * 1.4 - i * 0.2)) * r.len;
            if (k <= 0) return null;
            const L = 70 * k;
            const ex = x + r.dx * 95 * k;
            const ey = y + L;
            const d = `M${x},${y} Q${x + r.dx * 20 + r.bend},${y + L * 0.5} ${ex},${ey}`;
            return (
              <g key={`${i}-${j}`}>
                <path d={d} fill="none" stroke={COLORS.rootShade} strokeWidth={13} strokeLinecap="round" />
                <path d={d} fill="none" stroke={COLORS.root} strokeWidth={8} strokeLinecap="round" />
                {k > 0.5 &&
                  [0.45, 0.7].map((f) => {
                    const hx = x + (ex - x) * f + r.bend * 0.3;
                    const hy = y + L * f;
                    return (
                      <path key={f} d={`M${hx},${hy} l${r.dx * 4},${16}`} stroke={COLORS.root} strokeWidth={3} strokeLinecap="round" />
                    );
                  })}
              </g>
            );
          });
        })}

      {/* stem */}
      <path d={stemPath} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
      <path d={stemPath} fill="none" stroke={`url(#${id}s)`} strokeWidth={8} strokeLinecap="round" />
      {grow > 0 && (
        <>
          <path d={`M${tip} Q${tip[0] - 6},${tip[1] - 50 * grow} ${newTip}`} fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" />
          <path d={`M${tip} Q${tip[0] - 6},${tip[1] - 50 * grow} ${newTip}`} fill="none" stroke={COLORS.leafNew} strokeWidth={6} strokeLinecap="round" />
        </>
      )}

      {/* leaves on stalks */}
      {NODES.map((n, i) => {
        const [x, y] = bez(p0, p1, p2, p3, n.t);
        const side = n.side === 0 ? (wilt > 0 ? 1 : 0) : n.side;
        const a = side * (50 + wilt * 85) + (n.side === 0 ? -6 + wilt * 60 : 0) + sway * 0.05;
        const len = n.side === 0 ? 20 : 62;
        const rad = (a * Math.PI) / 180;
        const lx = x + Math.sin(rad) * len;
        const ly = y - Math.cos(rad) * len;
        return (
          <g key={i}>
            <path d={`M${x},${y} Q${x + Math.sin(rad) * len * 0.3},${y - len * 0.8} ${lx},${ly}`} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
            <path d={`M${x},${y} Q${x + Math.sin(rad) * len * 0.3},${y - len * 0.8} ${lx},${ly}`} fill="none" stroke={COLORS.stem} strokeWidth={4} strokeLinecap="round" />
            <g transform={`translate(${lx} ${ly}) rotate(${a + side * wilt * 30}) scale(${n.s * (1 - 0.18 * wilt)}, ${n.s * (1 - 0.3 * wilt)})`}>
              <Leaf fill={`url(#${id})`} vein={vein} />
            </g>
          </g>
        );
      })}

      {/* new leaves at the tip */}
      {grow > 0 &&
        [
          { a: -40, s: 0.55, at: 0.35 },
          { a: 25, s: 0.45, at: 0.65 },
        ].map((l, i) => {
          const k = Math.max(0, Math.min(1, (grow - l.at) / (1 - l.at)));
          if (k <= 0) return null;
          const base: P = bez(tip, [tip[0], tip[1] - 30], [newTip[0], newTip[1] + 30], newTip, i === 0 ? 0.55 : 1);
          return (
            <g key={i} transform={`translate(${base[0]} ${base[1]}) rotate(${l.a}) scale(${l.s * k})`}>
              <Leaf fill={`url(#${id}n)`} vein="#eaffc8" />
            </g>
          );
        })}

      {/* the clean cut at the bottom */}
      <ellipse cx={0} cy={0} rx={5} ry={3} fill="#cfe8a0" stroke={INK} strokeWidth={2} />
    </g>
  );
};
