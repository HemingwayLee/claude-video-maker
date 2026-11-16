import React from "react";
import { COLORS, INK } from "../theme";

// A strawberry drawn around (0, 0), about 240 wide and 270 tall (calyx on
// top at y ≈ -95, tip at y = 150). Soft painted shading like the man's
// stickers: a radial-gradient body, a highlight, a thin dark outline.
//
// The little yellow bumps on its skin are the achenes (瘦果). Their
// positions are exported (ACHENES) so a scene can point at one, pluck one
// out, or grow a sprout from it.
//
//   face:      none, or a cute face with an expression
//   glow:      0 → 1, rings of light around every achene ("look at these!")
//   hide:      index of an achene to leave out (it was plucked)
//   sprouts:   0 → 1, tiny seedlings grow out of the achenes, one after another
//   age:       0 → 1, the berry gets a little darker and duller (left a few days)

export type BerryFace = "none" | "smile" | "happy" | "wow";

const BODY =
  "M0,-92 C62,-112 122,-88 120,-28 C118,40 52,118 0,150 C-52,118 -118,40 -120,-28 C-122,-88 -62,-112 0,-92 Z";

// Half width of the body at height y (an approximation of BODY).
const halfWidth = (y: number) =>
  y < -20 ? 116 * Math.sqrt(Math.max(0, 1 - ((y + 20) / 88) ** 2)) : 116 * Math.pow(Math.max(0, 1 - (y + 20) / 170), 1.05);

// Staggered rows of achenes over the front of the berry, with a little
// deterministic jitter so they don't look like a grid.
export const ACHENES: [number, number][] = (() => {
  const pts: [number, number][] = [];
  let row = 0;
  for (let y = -62; y <= 132; y += 22, row++) {
    const w = halfWidth(y) * 0.84;
    const step = 26;
    const off = row % 2 ? step / 2 : 0;
    for (let x = -w + ((w + off) % step); x <= w; x += step) {
      const j = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const jx = (j - Math.floor(j) - 0.5) * 6;
      pts.push([Math.round(x + jx), Math.round(y + jx * 0.6)]);
    }
  }
  return pts;
})();

// Achenes that are under the face are skipped when the face is shown.
const underFace = (x: number, y: number) => Math.abs(x) < 60 && y > -4 && y < 54;

// An achene points toward the berry's tip.
const tilt = (x: number, y: number) => (Math.atan2(150 - y, -x) * 180) / Math.PI - 90;

let uid = 0;

export const Strawberry: React.FC<{
  face?: BerryFace;
  blink?: boolean;
  glow?: number;
  hide?: number;
  sprouts?: number;
  age?: number;
}> = ({ face = "none", blink = false, glow = 0, hide = -1, sprouts = 0, age = 0 }) => {
  const id = React.useMemo(() => `sb${uid++}`, []);
  const shown = ACHENES.map((p, i) => ({ p, i })).filter(({ p }) => face === "none" || !underFace(p[0], p[1]));
  return (
    <g>
      <defs>
        <radialGradient id={`${id}b`} cx="34%" cy="28%" r="82%">
          <stop offset="0%" stopColor={COLORS.berryLight} />
          <stop offset="50%" stopColor={COLORS.berry} />
          <stop offset="100%" stopColor={COLORS.berryDark} />
        </radialGradient>
        <radialGradient id={`${id}a`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor={COLORS.acheneLight} />
          <stop offset="60%" stopColor={COLORS.achene} />
          <stop offset="100%" stopColor={COLORS.acheneDark} />
        </radialGradient>
        <clipPath id={`${id}c`}>
          <path d={BODY} />
        </clipPath>
      </defs>

      <path d={BODY} fill={`url(#${id}b)`} />
      <g clipPath={`url(#${id}c)`}>
        {/* overripe: a dull, darker layer */}
        <path d={BODY} fill={COLORS.berryOld} opacity={age * 0.45} />
        {/* soft highlight, top left; dimmer as it ages */}
        <ellipse cx={-56} cy={-40} rx={38} ry={20} fill="#fff" opacity={0.25 * (1 - age * 0.6)} transform="rotate(-30 -56 -40)" />
        {/* shade at the bottom right */}
        <ellipse cx={60} cy={110} rx={110} ry={70} fill={COLORS.berryDark} opacity={0.35} />
        {shown.map(({ p: [x, y], i }) =>
          i === hide ? (
            <ellipse key={i} cx={x} cy={y} rx={7} ry={9} fill={COLORS.dimple} opacity={0.8} transform={`rotate(${tilt(x, y)} ${x} ${y})`} />
          ) : (
            <g key={i} transform={`translate(${x} ${y}) rotate(${tilt(x, y)})`}>
              {/* the little dimple the achene sits in */}
              <ellipse cx={0} cy={1} rx={6.5} ry={8.5} fill={COLORS.dimple} opacity={0.75} />
              <path d="M0,-6.5 C3.5,-3.5 4.5,1 3.5,4 C2.5,6.5 -2.5,6.5 -3.5,4 C-4.5,1 -3.5,-3.5 0,-6.5 Z" fill={`url(#${id}a)`} stroke={COLORS.acheneDark} strokeWidth={0.8} />
            </g>
          ),
        )}
        {glow > 0 &&
          shown.map(({ p: [x, y], i }) =>
            i === hide ? null : (
              <circle
                key={`g${i}`}
                cx={x}
                cy={y}
                r={8 + 4 * glow}
                fill="none"
                stroke="#fff6a0"
                strokeWidth={3.5}
                opacity={glow * (0.6 + 0.4 * Math.sin(i * 1.7 + glow * 9))}
              />
            ),
          )}
      </g>
      <path d={BODY} fill="none" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />

      {sprouts > 0 &&
        shown.map(({ p: [x, y], i }) => {
          // two out of three achenes, and none right around the face
          if (i === hide || i % 3 === 2 || (face !== "none" && Math.abs(x) < 92 && y > -24 && y < 84)) return null;
          // one after another, scattered over the berry
          const delay = ((i * 37) % 17) / 17;
          const g = Math.max(0, Math.min(1, (sprouts - delay * 0.6) / 0.4));
          if (g <= 0) return null;
          // grow outward, away from the middle of the berry (but never straight down)
          if (y > 60 && Math.abs(x) < 10) return null;
          const normal = (Math.atan2(x, -(y + 10)) * 180) / Math.PI;
          const lean = Math.max(-115, Math.min(115, normal * 0.85));
          return <Sprout key={`s${i}`} x={x} y={y} grow={g} lean={lean} size={1.35} />;
        })}

      <Calyx />
      {face !== "none" && <BerryFace face={face} blink={blink} />}
    </g>
  );
};

// The green leafy crown (calyx) and a short stem.
const SEPALS = [-168, -140, -112, -68, -40, -12, 22, 58, 96, 128, 160];
export const Calyx: React.FC = () => (
  <g transform="translate(0 -94)">
    {SEPALS.map((a, i) => {
      const down = a > 0 && a < 180;
      const len = down ? 66 : 54;
      return (
        <path
          key={i}
          d={`M0,0 C${len * 0.25},-12 ${len * 0.7},-12 ${len},0 C${len * 0.7},12 ${len * 0.25},12 0,0 Z`}
          transform={`rotate(${a}) scale(1, ${down ? 1 : 0.85})`}
          fill={i % 2 ? COLORS.leaf : COLORS.leafLight}
          stroke={INK}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      );
    })}
    <path d="M-5,0 C-6,-20 -2,-34 8,-46 L16,-40 C8,-30 5,-18 5,0 Z" fill={COLORS.stem} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
  </g>
);

// A tiny seedling: a stem and two round seed leaves. `grow` 0 → 1.
export const Sprout: React.FC<{ x: number; y: number; grow: number; lean?: number; size?: number }> = ({
  x,
  y,
  grow,
  lean = 0,
  size = 1,
}) => {
  const h = 34 * grow;
  const leaf = Math.max(0, (grow - 0.4) / 0.6);
  return (
    <g transform={`translate(${x} ${y}) rotate(${lean}) scale(${size})`}>
      <path d={`M0,0 Q${-4 * grow},${-h * 0.5} 0,${-h}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d={`M0,0 Q${-4 * grow},${-h * 0.5} 0,${-h}`} fill="none" stroke={COLORS.leafLight} strokeWidth={3} strokeLinecap="round" />
      {leaf > 0 && (
        <g transform={`translate(0 ${-h}) scale(${leaf})`}>
          <path d="M0,0 C-6,-12 -20,-14 -24,-6 C-20,2 -8,4 0,0 Z" fill={COLORS.leafLight} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
          <path d="M0,0 C6,-12 20,-14 24,-6 C20,2 8,4 0,0 Z" fill={COLORS.leaf} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
};

// Dark eyes with a white shine, pink cheeks, a mouth per expression.
const BerryFace: React.FC<{ face: BerryFace; blink: boolean }> = ({ face, blink }) => (
  <g transform="translate(0 18)">
    {blink || face === "happy" ? (
      <>
        <path d="M-40,-4 Q-30,-16 -20,-4" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <path d="M20,-4 Q30,-16 40,-4" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      </>
    ) : (
      <>
        <ellipse cx={-30} cy={-6} rx={10} ry={face === "wow" ? 14 : 12} fill={INK} />
        <ellipse cx={30} cy={-6} rx={10} ry={face === "wow" ? 14 : 12} fill={INK} />
        <circle cx={-27} cy={-11} r={4} fill="#fff" />
        <circle cx={33} cy={-11} r={4} fill="#fff" />
      </>
    )}
    <ellipse cx={-50} cy={16} rx={13} ry={7} fill={COLORS.pink} opacity={0.85} />
    <ellipse cx={50} cy={16} rx={13} ry={7} fill={COLORS.pink} opacity={0.85} />
    {face === "wow" ? (
      <ellipse cx={0} cy={22} rx={9} ry={12} fill="#7a1a1a" stroke={INK} strokeWidth={3} />
    ) : face === "happy" ? (
      <path d="M-18,12 Q0,38 18,12 Z" fill="#7a1a1a" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    ) : (
      <path d="M-14,14 Q0,28 14,14" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    )}
  </g>
);
