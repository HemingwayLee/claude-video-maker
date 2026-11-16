import React from "react";
import { COLORS, INK } from "../theme";

// The props of the story, each drawn around (0, 0) in the same soft
// sticker style as the strawberry. Wrap them in <Sticker> to place them.

let uid = 0;
const useUid = (p: string) => React.useMemo(() => `${p}${uid++}`, [p]);

// ---- the achene and its seed --------------------------------------------

// Teardrop, pointed end up, about 170 wide × 250 tall.
const ACHENE = "M0,-130 C40,-96 86,-30 86,30 C86,88 46,120 0,120 C-46,120 -86,88 -86,30 C-86,-30 -40,-96 0,-130 Z";
const CAVITY = "M0,-100 C28,-72 62,-20 62,30 C62,74 32,98 0,98 C-32,98 -62,74 -62,30 C-62,-20 -28,-72 0,-100 Z";

// One achene (瘦果), blown up. `open` 0 → 1 splits its shell into two halves
// that swing apart and reveal the seed inside. `seedGlow` makes the seed shine.
export const AcheneBig: React.FC<{ open?: number; seedFace?: boolean; seedGlow?: number; frame?: number }> = ({
  open = 0,
  seedFace = true,
  seedGlow = 0,
  frame = 0,
}) => {
  const id = useUid("ac");
  const half = (side: -1 | 1) => (
    <g transform={`translate(${side * open * 62} ${open * 8}) rotate(${side * open * 12} 0 120)`}>
      <g clipPath={`url(#${id}${side < 0 ? "L" : "R"})`}>
        <path d={ACHENE} fill={`url(#${id}g)`} />
        {/* the cut face of the shell, seen from the inside once it opens */}
        <path d={CAVITY} fill="#f7e2a0" opacity={open > 0.02 ? 1 : 0} />
        <path d={CAVITY} fill="none" stroke={COLORS.acheneDark} strokeWidth={3} opacity={open > 0.02 ? 0.6 : 0} />
        {/* fine lengthwise lines on the shell */}
        {open <= 0.02 &&
          [-50, -25, 25, 50].map((x) => (
            <path key={x} d={`M${x * 0.3},-110 Q${x * 1.3},10 ${x * 0.8},110`} fill="none" stroke={COLORS.acheneDark} strokeWidth={2.5} opacity={0.35} />
          ))}
        <ellipse cx={-38} cy={-20} rx={18} ry={40} fill="#fff" opacity={open > 0.02 ? 0.15 : 0.4} transform="rotate(18 -38 -20)" />
      </g>
      <path d={ACHENE} fill="none" stroke={INK} strokeWidth={4} strokeLinejoin="round" clipPath={`url(#${id}${side < 0 ? "L" : "R"})`} />
      {/* the edge of the cut */}
      {open > 0.02 && <line x1={0} y1={-130} x2={0} y2={120} stroke={INK} strokeWidth={4} />}
    </g>
  );
  return (
    <g>
      <defs>
        <radialGradient id={`${id}g`} cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor={COLORS.acheneLight} />
          <stop offset="55%" stopColor={COLORS.achene} />
          <stop offset="100%" stopColor={COLORS.acheneDark} />
        </radialGradient>
        <clipPath id={`${id}L`}>
          <rect x={-200} y={-200} width={200} height={400} />
        </clipPath>
        <clipPath id={`${id}R`}>
          <rect x={0} y={-200} width={200} height={400} />
        </clipPath>
      </defs>
      {/* the seed sits inside; hidden until the shell opens */}
      {open > 0.02 && (
        <g transform={`translate(0 ${4}) scale(${0.85 + 0.15 * open})`}>
          {seedGlow > 0 && <circle r={110 + 10 * Math.sin(frame / 6)} fill="#fff6a0" opacity={0.45 * seedGlow} />}
          <Seed face={seedFace} />
        </g>
      )}
      {half(-1)}
      {half(1)}
    </g>
  );
};

// The real seed: small, cream-white, with a pale embryo line. About 110 × 160.
export const Seed: React.FC<{ face?: boolean }> = ({ face = true }) => {
  const id = useUid("sd");
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor={COLORS.seedLight} />
          <stop offset="60%" stopColor={COLORS.seed} />
          <stop offset="100%" stopColor={COLORS.seedDark} />
        </radialGradient>
      </defs>
      <path
        d="M0,-82 C26,-60 54,-18 54,22 C54,60 30,80 0,80 C-30,80 -54,60 -54,22 C-54,-18 -26,-60 0,-82 Z"
        fill={`url(#${id})`}
        stroke={INK}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      {/* the embryo: the baby plant curled up inside */}
      <path d="M-4,-62 C-18,-30 -20,10 -6,46" fill="none" stroke="#c9d98a" strokeWidth={8} strokeLinecap="round" opacity={0.7} />
      <ellipse cx={-22} cy={-24} rx={9} ry={20} fill="#fff" opacity={0.7} transform="rotate(20 -22 -24)" />
      {face && (
        <g transform="translate(8 20)">
          <path d="M-22,-4 Q-15,-12 -8,-4" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <path d="M8,-4 Q15,-12 22,-4" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <ellipse cx={-28} cy={10} rx={8} ry={5} fill={COLORS.pink} opacity={0.85} />
          <ellipse cx={28} cy={10} rx={8} ry={5} fill={COLORS.pink} opacity={0.85} />
          <path d="M-9,8 Q0,20 9,8 Z" fill="#c2413a" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
};

// ---- tools and scenery --------------------------------------------------

// A magnifying glass: ring of radius `r` at (0, 0), handle to the bottom
// right. Draw the zoomed picture *under* it, clipped to the same circle.
export const Magnifier: React.FC<{ r?: number }> = ({ r = 150 }) => {
  const id = useUid("mg");
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c08850" />
          <stop offset="100%" stopColor="#6a3818" />
        </linearGradient>
      </defs>
      <g transform="rotate(45)">
        <rect x={r + 6} y={-20} width={r * 1.1} height={40} rx={20} fill={`url(#${id})`} stroke={INK} strokeWidth={3.5} />
        <rect x={r - 4} y={-26} width={34} height={52} rx={8} fill="#9aa3ad" stroke={INK} strokeWidth={3.5} />
      </g>
      <circle r={r + 12} fill="none" stroke={INK} strokeWidth={30} />
      <circle r={r + 12} fill="none" stroke="#ffcf3a" strokeWidth={23} />
      <circle r={r + 12} fill="none" stroke="#fff6b0" strokeWidth={6} opacity={0.6} transform="translate(-3 -3)" />
      {/* glass shine */}
      <path d={`M${-r * 0.62},${-r * 0.2} A${r * 0.68},${r * 0.68} 0 0 1 ${-r * 0.2},${-r * 0.62}`} fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" opacity={0.7} />
    </g>
  );
};

// A round white plate seen from slightly above. About 520 × 150.
export const Plate: React.FC = () => (
  <g>
    <ellipse cx={0} cy={0} rx={260} ry={74} fill={COLORS.plate} stroke={INK} strokeWidth={3.5} />
    <ellipse cx={0} cy={0} rx={234} ry={62} fill="none" stroke={COLORS.plateRim} strokeWidth={8} />
    <ellipse cx={0} cy={4} rx={176} ry={42} fill="#eef6ff" />
  </g>
);

// A smiling sun with turning rays.
export const Sun: React.FC<{ frame: number }> = ({ frame }) => {
  const id = useUid("sun");
  const rays = 12;
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff6b0" />
          <stop offset="60%" stopColor={COLORS.sun} />
          <stop offset="100%" stopColor={COLORS.sunGlow} />
        </radialGradient>
      </defs>
      <g transform={`rotate(${frame * 0.8})`}>
        {Array.from({ length: rays }, (_, i) => (
          <path
            key={i}
            d="M-16,-96 L0,-140 L16,-96 Z"
            fill={COLORS.sunGlow}
            stroke={INK}
            strokeWidth={3}
            strokeLinejoin="round"
            transform={`rotate(${(i * 360) / rays})`}
          />
        ))}
      </g>
      <circle r={90} fill={`url(#${id})`} stroke={INK} strokeWidth={3.5} />
      <path d="M-34,-4 Q-24,-16 -14,-4" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <path d="M14,-4 Q24,-16 34,-4" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <ellipse cx={-46} cy={18} rx={12} ry={7} fill={COLORS.pink} opacity={0.8} />
      <ellipse cx={46} cy={18} rx={12} ry={7} fill={COLORS.pink} opacity={0.8} />
      <path d="M-18,22 Q0,42 18,22 Z" fill="#c2413a" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
};

// A sleepy crescent moon, about 180 tall.
export const Moon: React.FC = () => {
  const id = useUid("moon");
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="35%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#fffbe0" />
          <stop offset="100%" stopColor="#ffd860" />
        </radialGradient>
      </defs>
      <path d="M20,-90 A90,90 0 1 0 20,90 A70,70 0 1 1 20,-90 Z" fill={`url(#${id})`} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M-42,-8 Q-34,0 -26,-8" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
      <ellipse cx={-46} cy={12} rx={9} ry={5} fill={COLORS.pink} opacity={0.8} />
      <path d="M-40,26 Q-32,32 -24,26" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};

// A star, about 50 wide.
export const Star: React.FC<{ x: number; y: number; size?: number; opacity?: number }> = ({ x, y, size = 50, opacity = 1 }) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const r = (i % 2 ? 0.45 : 1) * (size / 2);
    return `${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");
  return <polygon points={pts} fill="#fff3a0" stroke="#fff" strokeWidth={3} strokeLinejoin="round" opacity={opacity} />;
};

// A thick sticker question mark, about 150 tall.
export const Question: React.FC = () => (
  <g>
    <path
      d="M-46,-40 C-46,-82 -14,-100 12,-98 C48,-96 66,-70 62,-42 C58,-14 30,-4 22,12 C18,20 18,28 18,36 L-16,36 C-18,22 -16,4 -4,-10 C8,-24 28,-30 28,-46 C28,-60 18,-66 6,-66 C-8,-66 -14,-56 -14,-40 Z"
      fill={COLORS.berry}
      stroke={INK}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <circle cx={1} cy={70} r={20} fill={COLORS.berry} stroke={INK} strokeWidth={4} />
    <ellipse cx={-26} cy={-62} rx={10} ry={5} fill="#fff" opacity={0.6} transform="rotate(-40 -26 -62)" />
  </g>
);

// A fat arrow pointing right, about 160 wide.
export const Arrow: React.FC = () => (
  <path d="M-80,-22 L20,-22 L20,-50 L80,0 L20,50 L20,22 L-80,22 Z" fill={COLORS.yellow} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
);

// ---- little effects -------------------------------------------------------

// Four-pointed sparkle, `t` 0 → 1 → 0 for its twinkle.
export const Sparkle: React.FC<{ x: number; y: number; size?: number; t: number; color?: string }> = ({
  x,
  y,
  size = 40,
  t,
  color = COLORS.yellow,
}) => {
  if (t <= 0) return null;
  const s = size * t;
  return (
    <path
      d={`M${x},${y - s} Q${x + s * 0.18},${y - s * 0.18} ${x + s},${y} Q${x + s * 0.18},${y + s * 0.18} ${x},${y + s} Q${x - s * 0.18},${y + s * 0.18} ${x - s},${y} Q${x - s * 0.18},${y - s * 0.18} ${x},${y - s} Z`}
      fill={color}
      stroke="#fff"
      strokeWidth={4}
      strokeLinejoin="round"
    />
  );
};

export const Heart: React.FC<{ x: number; y: number; size?: number; color?: string }> = ({
  x,
  y,
  size = 40,
  color = COLORS.pink,
}) => (
  <path
    transform={`translate(${x} ${y}) scale(${size / 40})`}
    d="M0,14 C-26,-4 -26,-26 -12,-28 C-4,-29 0,-22 0,-18 C0,-22 4,-29 12,-28 C26,-26 26,-4 0,14 Z"
    fill={color}
    stroke="#fff"
    strokeWidth={4}
    strokeLinejoin="round"
  />
);
