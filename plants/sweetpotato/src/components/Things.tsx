import React from "react";
import { COLORS, INK } from "../theme";

// The props of the story, each drawn around (0, 0) in the man's soft
// sticker style. Wrap them in <Sticker> to place them.

let uid = 0;
const useUid = (p: string) => React.useMemo(() => `${p}${uid++}`, [p]);

// ---- the glass of water --------------------------------------------------

// A glass jar, bottom center at (0, 0), about 250 wide and 345 tall.
// Whatever is passed as children (the cutting) is drawn inside the glass:
// behind the water and the front of the glass, so the stem looks submerged.
export const JAR_WATER = 215; // height of the water surface above the bottom

const BODY =
  "M-100,-330 L-100,-318 Q-124,-312 -124,-290 L-124,-22 Q-124,0 -100,0 L100,0 Q124,0 124,-22 L124,-290 Q124,-312 100,-318 L100,-330 Z";

export const Jar: React.FC<{ fill?: number; frame?: number; children?: React.ReactNode }> = ({
  fill = 1,
  frame = 0,
  children,
}) => {
  const id = useUid("jar");
  const level = JAR_WATER * fill;
  const wob = Math.sin(frame / 10) * 3;
  return (
    <g>
      <defs>
        <clipPath id={`${id}c`}>
          <path d={BODY} />
        </clipPath>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.water} stopOpacity={0.3} />
          <stop offset="100%" stopColor={COLORS.waterDeep} stopOpacity={0.45} />
        </linearGradient>
      </defs>
      {/* back of the glass */}
      <path d={BODY} fill={COLORS.glass} opacity={0.55} />
      <rect x={-108} y={-346} width={216} height={20} rx={9} fill={COLORS.glass} opacity={0.7} />
      {children}
      {/* water */}
      {fill > 0 && (
        <g clipPath={`url(#${id}c)`}>
          <path d={`M-130,${-level + wob} Q0,${-level - wob} 130,${-level + wob} L130,0 L-130,0 Z`} fill={`url(#${id}w)`} />
          <ellipse cx={0} cy={-level} rx={122} ry={14} fill="#c8ecff" opacity={0.7} stroke="#fff" strokeWidth={3} />
          {[0, 1, 2, 3].map((i) => {
            const t = ((frame * 0.8 + i * 40) % 160) / 160;
            return <circle key={i} cx={-60 + i * 38 + Math.sin(frame / 8 + i) * 6} cy={-10 - t * (level - 20)} r={4 + (i % 2) * 2} fill="#fff" opacity={0.7 * (1 - t)} />;
          })}
        </g>
      )}
      {/* front of the glass: highlights and outline */}
      <path d="M-98,-280 L-98,-40" stroke="#fff" strokeWidth={14} strokeLinecap="round" opacity={0.6} />
      <path d="M-74,-280 L-74,-200" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.5} />
      <path d="M96,-250 L96,-60" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.35} />
      <path d={BODY} fill="none" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <rect x={-108} y={-346} width={216} height={20} rx={9} fill="none" stroke={INK} strokeWidth={3.5} />
    </g>
  );
};

// ---- tools and furniture ---------------------------------------------------

// Garden scissors, pivot at (0, 0), blades up. `open` in degrees.
export const Scissors: React.FC<{ open?: number }> = ({ open = 0 }) => {
  const half = (flip: number) => (
    <g transform={`scale(${flip} 1) rotate(${open / 2})`}>
      <path d="M-4,10 L-14,-24 L-4,-150 Q8,-90 12,-12 Z" fill={COLORS.steel} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M-6,-30 L-4,-130" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.8} />
      <path d="M4,8 Q10,40 20,56" fill="none" stroke={INK} strokeWidth={17} strokeLinecap="round" />
      <path d="M4,8 Q10,40 20,56" fill="none" stroke={COLORS.handle} strokeWidth={11} strokeLinecap="round" />
      <ellipse cx={26} cy={86} rx={20} ry={30} fill="none" stroke={INK} strokeWidth={17} />
      <ellipse cx={26} cy={86} rx={20} ry={30} fill="none" stroke={COLORS.handle} strokeWidth={11} />
    </g>
  );
  return (
    <g>
      {half(1)}
      {half(-1)}
      <circle r={9} fill={COLORS.steelDark} stroke={INK} strokeWidth={3} />
    </g>
  );
};

// A wooden board (a table top), centered at (0, 0), 360 wide.
export const Board: React.FC = () => (
  <g>
    <rect x={-180} y={-20} width={360} height={40} rx={14} fill={COLORS.wood} stroke={INK} strokeWidth={3.5} />
    <path d="M-150,-6 Q-60,-12 20,-4 M-40,8 Q60,2 150,8" stroke={COLORS.woodDark} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.7} />
    <rect x={-170} y={-16} width={200} height={6} rx={3} fill="#fff" opacity={0.3} />
  </g>
);

// A mound of garden soil, centered at (0, 0), about 600 wide.
export const Soil: React.FC = () => (
  <g>
    <path d="M-300,30 Q-260,-40 -120,-46 Q0,-56 120,-46 Q260,-40 300,30 Z" fill={COLORS.soil} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
    <ellipse cx={-80} cy={-26} rx={90} ry={10} fill="#c18c5c" opacity={0.55} />
    {[[-200, 0], [-60, 6], [90, -6], [210, 4], [20, 16]].map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx={8} ry={5} fill={COLORS.soilDark} opacity={0.7} />
    ))}
  </g>
);

// A thought bubble, centered at (0, 0), r ≈ 190, with a tail of small
// circles toward (tx, ty). The children are drawn inside.
export const Thought: React.FC<{ tx: number; ty: number; children?: React.ReactNode }> = ({ tx, ty, children }) => {
  const puffs: [number, number, number][] = [
    [0, 0, 170], [-130, 20, 95], [130, 20, 95], [-80, -110, 95], [80, -110, 95], [-90, 120, 90], [90, 120, 90], [0, 150, 95], [0, -140, 90],
  ];
  const tail = [0.55, 0.75, 0.9].map((f, i) => [tx * f, ty * f, 26 - i * 7] as const);
  return (
    <g>
      {puffs.map(([x, y, r], i) => (
        <circle key={`o${i}`} cx={x} cy={y} r={r + 4} fill={INK} />
      ))}
      {tail.map(([x, y, r], i) => (
        <circle key={`t${i}`} cx={x} cy={y} r={r} fill="#fff" stroke={INK} strokeWidth={4} />
      ))}
      {puffs.map(([x, y, r], i) => (
        <circle key={`w${i}`} cx={x} cy={y} r={r} fill="#fff" />
      ))}
      {children}
    </g>
  );
};

// ---- sky ---------------------------------------------------------------------

export const Sun: React.FC<{ frame: number }> = ({ frame }) => {
  const id = useUid("sun");
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
        {Array.from({ length: 10 }, (_, i) => (
          <path key={i} d="M-14,-74 L0,-108 L14,-74 Z" fill={COLORS.sunGlow} stroke={INK} strokeWidth={3} strokeLinejoin="round" transform={`rotate(${i * 36})`} />
        ))}
      </g>
      <circle r={68} fill={`url(#${id})`} stroke={INK} strokeWidth={3.5} />
      <path d="M-26,-4 Q-18,-14 -10,-4 M10,-4 Q18,-14 26,-4" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
      <ellipse cx={-36} cy={14} rx={9} ry={5} fill={COLORS.pink} opacity={0.8} />
      <ellipse cx={36} cy={14} rx={9} ry={5} fill={COLORS.pink} opacity={0.8} />
      <path d="M-12,16 Q0,30 12,16" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};

export const Moon: React.FC = () => (
  <g>
    <path d="M10,-66 A68,68 0 1 0 60,40 A54,54 0 1 1 10,-66 Z" fill={COLORS.moon} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M-30,-6 Q-24,-14 -18,-6" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    <ellipse cx={-34} cy={12} rx={8} ry={5} fill={COLORS.pink} opacity={0.7} />
    <circle cx={-46} cy={-36} r={6} fill="#fff" opacity={0.6} />
  </g>
);

// ---- little effects ------------------------------------------------------------

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

// A round ✓ (good) or ✗ (bad) badge, radius 44.
export const Badge: React.FC<{ good: boolean }> = ({ good }) => (
  <g>
    <circle r={44} fill={good ? COLORS.good : COLORS.bad} stroke="#fff" strokeWidth={8} />
    {good ? (
      <path d="M-20,2 L-6,16 L22,-14" fill="none" stroke="#fff" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d="M-16,-16 L16,16 M16,-16 L-16,16" fill="none" stroke="#fff" strokeWidth={11} strokeLinecap="round" />
    )}
  </g>
);

// A water drop.
export const Drop: React.FC<{ x: number; y: number; size?: number; opacity?: number; rotate?: number }> = ({
  x,
  y,
  size = 30,
  opacity = 1,
  rotate = 0,
}) => (
  <path
    transform={`translate(${x} ${y}) rotate(${rotate}) scale(${size / 30})`}
    d="M0,-22 C8,-8 14,0 14,8 C14,16 8,22 0,22 C-8,22 -14,16 -14,8 C-14,0 -8,-8 0,-22 Z"
    fill={COLORS.water}
    stroke="#fff"
    strokeWidth={3.5}
    opacity={opacity}
  />
);
