import React from "react";
import { COLORS, INK } from "../theme";

// The goji plant (枸杞): a small shrub with thin, arching, pale branches,
// narrow leaves in little bunches, small purple flowers, and long oval red
// berries hanging under the branches.

// Deterministic pseudo-random numbers (same video on every render).
const rand = (i: number) => {
  const x = Math.sin(i * 91.7 + 17.3) * 43758.5453;
  return x - Math.floor(x);
};

// One goji berry, hanging from its stalk at (x, y). Long axis points down.
export const Berry: React.FC<{ x: number; y: number; size: number; rot?: number; color?: string; shade?: string; stroke?: number }> = ({
  x,
  y,
  size,
  rot = 0,
  color = COLORS.berry,
  shade = COLORS.berryShade,
  stroke,
}) => {
  const w = size * 0.42;
  const h = size;
  const sw = stroke ?? Math.max(2, size * 0.09);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M 0 ${-size * 0.18} L 0 ${h * 0.12}`} stroke={COLORS.calyx} strokeWidth={sw} strokeLinecap="round" />
      <ellipse cx={0} cy={h * 0.62} rx={w} ry={h * 0.5} fill={color} stroke={INK} strokeWidth={sw} />
      <path d={`M ${w * 0.35} ${h * 0.3} Q ${w * 0.95} ${h * 0.62} ${w * 0.3} ${h * 1.02}`} stroke={shade} strokeWidth={w * 0.45} fill="none" strokeLinecap="round" />
      <ellipse cx={-w * 0.38} cy={h * 0.45} rx={w * 0.2} ry={h * 0.16} fill={COLORS.berryShine} />
      <path d={`M ${-w * 0.7} ${h * 0.2} L 0 ${h * 0.08} L ${w * 0.7} ${h * 0.2} L 0 ${h * 0.26} Z`} fill={COLORS.calyx} stroke={INK} strokeWidth={sw * 0.7} strokeLinejoin="round" />
    </g>
  );
};

const Leaf: React.FC<{ x: number; y: number; len: number; rot: number }> = ({ x, y, len, rot }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path
      d={`M 0 0 Q ${len * 0.5} ${-len * 0.2} ${len} 0 Q ${len * 0.5} ${len * 0.2} 0 0 Z`}
      fill={COLORS.leaf}
      stroke={INK}
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <path d={`M ${len * 0.1} 0 L ${len * 0.85} 0`} stroke={COLORS.leafShade} strokeWidth={2.5} />
  </g>
);

const Flower: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[0, 72, 144, 216, 288].map((a) => (
      <ellipse key={a} cx={0} cy={-9} rx={6} ry={10} transform={`rotate(${a})`} fill={COLORS.flower} stroke={INK} strokeWidth={2.5} />
    ))}
    <circle r={5} fill="#ffe27a" stroke={INK} strokeWidth={2} />
  </g>
);

// A cubic Bézier branch, evaluated at s ∈ [0, 1].
type Pt = [number, number];
const bez = (p: Pt[], s: number): Pt => {
  const u = 1 - s;
  const a = u * u * u;
  const b = 3 * u * u * s;
  const c = 3 * u * s * s;
  const d = s * s * s;
  return [a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0], a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1]];
};

// Branches: [end x, height, droop]. Base of the shrub is (0, 0).
const BRANCHES: [number, number, number][] = [
  [-330, 300, 120],
  [-210, 420, 150],
  [-90, 470, 120],
  [60, 480, 130],
  [190, 430, 150],
  [320, 320, 130],
  [-40, 330, 60],
  [140, 340, 70],
];

export type GojiBushProps = {
  frame: number;
  grow?: number; // 0 → 1: branches grow out of the ground
  leaves?: number; // 0 → 1
  flowers?: number; // 0 → 1
  berries?: number; // 0 → 1: berries appear one after another
  maxBerries?: number; // how many berry spots to use (fewer = a poor harvest)
  wobble?: number; // extra shaking, e.g. when things go wrong
};

// The shrub, drawn with its base at (0, 0), about 700 px wide and 500 px tall.
export const GojiBush: React.FC<GojiBushProps> = ({ frame, grow = 1, leaves = 1, flowers = 0, berries = 1, maxBerries = 99, wobble = 0 }) => {
  const sway = Math.sin(frame / 22) * 2 + Math.sin(frame / 2.3) * wobble * 4;
  const steps = 24;
  let berryIndex = 0;
  return (
    <g>
      <ellipse cx={0} cy={6} rx={260} ry={26} fill="#000" opacity={0.15} />
      {/* mound of soil */}
      <path d="M -170 8 Q 0 -60 170 8 Z" fill={COLORS.soil} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {BRANCHES.map(([ex, h, droop], bi) => {
        const swayB = sway * (0.6 + rand(bi) * 0.8);
        const pts: Pt[] = [
          [0, -20],
          [ex * 0.15, -h * 0.9],
          [ex * 0.75 + swayB * 4, -h * 1.05],
          [ex + swayB * 6, -h + droop],
        ];
        const visible = Math.max(0, Math.min(1, grow * 1.3 - bi * 0.04));
        if (visible <= 0) return null;
        const n = Math.max(2, Math.round(steps * visible));
        const line = Array.from({ length: n + 1 }, (_, i) => bez(pts, (i / n) * visible));
        const d = line.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
        // Nodes along the branch: leaves on both sides, flower or berry hanging below.
        const nodes = [0.3, 0.45, 0.6, 0.72, 0.84, 0.95];
        return (
          <g key={bi}>
            <path d={d} stroke={INK} strokeWidth={15} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d={d} stroke={COLORS.branch} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {nodes.map((s, ni) => {
              if (s > visible) return null;
              const [x, y] = bez(pts, s);
              const k = bi * 10 + ni;
              const leafOn = Math.max(0, Math.min(1, (leaves - s * 0.6) * 3));
              const berryOrder = berryIndex++;
              const berryOn = berryOrder < maxBerries && rand(k + 5) > 0.25 ? Math.max(0, Math.min(1, (berries * 1.15 - rand(k + 9)) * 5)) : 0;
              const flowerOn = flowers > rand(k + 3) && rand(k + 7) > 0.4 && berryOn === 0;
              const leafLen = 46 + rand(k) * 22;
              return (
                <g key={ni}>
                  {leafOn > 0 && (
                    <g>
                      <Leaf x={x} y={y} len={leafLen * leafOn} rot={-150 + rand(k + 1) * 40} />
                      <Leaf x={x} y={y} len={leafLen * leafOn * 0.9} rot={-40 + rand(k + 2) * 40} />
                      <Leaf x={x} y={y} len={leafLen * leafOn * 0.75} rot={-95 + rand(k + 4) * 30} />
                    </g>
                  )}
                  {flowerOn && <Flower x={x + 6} y={y + 18} s={1} />}
                  {berryOn > 0 && <Berry x={x + 4} y={y + 8} size={44 * berryOn} rot={Math.sin(frame / 18 + k) * 6 + (rand(k + 6) - 0.5) * 20} />}
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};
