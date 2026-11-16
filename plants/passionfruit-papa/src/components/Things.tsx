import React from "react";
import { COLORS, INK } from "../theme";
import { PassionFruit } from "./PassionFruit";

// The props of the story, each drawn around (0, 0) in the same soft
// sticker style as the passion fruit. Wrap them in <Sticker> to place them.

let uid = 0;
const useUid = (p: string) => React.useMemo(() => `${p}${uid++}`, [p]);

// ---- the map -------------------------------------------------------------

// Catmull-Rom through points → smooth closed path.
const smooth = (pts: [number, number][]) => {
  const n = pts.length;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d + " Z";
};

// Taiwan, simplified, centered, about 230 × 470.
const TAIWAN = smooth(
  ([
    [150, 0], [190, 22], [218, 48], [205, 85], [198, 135], [188, 205], [172, 285], [156, 350], [138, 410],
    [118, 462], [104, 470], [98, 438], [86, 398], [64, 356], [36, 298], [12, 238], [0, 182], [10, 130],
    [40, 80], [80, 42], [118, 16],
  ] as [number, number][]).map(([x, y]) => [x - 110, y - 235]),
);

// Fengshan (鳳山, Kaohsiung) on the map above, in the map's own units.
export const FENGSHAN: [number, number] = [-26, 136];

// Spots spread over the map's west side and south, where fruit grows.
export const FARM_SPOTS: [number, number][] = [
  [10, -150], [-50, -40], [20, -70], [-70, 40], [0, 20], [-30, 100], [40, 70], [10, 180],
];

export const Taiwan: React.FC = () => {
  const id = useUid("tw");
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor={COLORS.leafLight} />
          <stop offset="100%" stopColor={COLORS.landDark} />
        </radialGradient>
      </defs>
      <path d={TAIWAN} fill={`url(#${id})`} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      {/* the central mountains, soft */}
      {[[40, -120, 1], [24, -40, 1.25], [10, 50, 1], [0, 130, 0.8]].map(([x, y, s], i) => (
        <path
          key={i}
          transform={`translate(${x} ${y}) scale(${s})`}
          d="M-26,12 L-4,-20 L4,-10 L12,-22 L30,12 Z"
          fill={COLORS.leafDark}
          stroke={INK}
          strokeWidth={2.5}
          strokeLinejoin="round"
          opacity={0.55}
        />
      ))}
      <ellipse cx={-30} cy={-90} rx={18} ry={50} fill="#fff" opacity={0.18} transform="rotate(30 -30 -90)" />
    </g>
  );
};

// A map pin, tip at (0, 0), about 70 tall.
export const Pin: React.FC = () => (
  <g>
    <path d="M0,0 C-8,-20 -30,-36 -30,-58 C-30,-76 -16,-88 0,-88 C16,-88 30,-76 30,-58 C30,-36 8,-20 0,0 Z" fill={COLORS.pin} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
    <circle cx={0} cy={-58} r={12} fill="#fff" stroke={INK} strokeWidth={2.5} />
    <ellipse cx={-14} cy={-70} rx={6} ry={10} fill="#fff" opacity={0.45} transform="rotate(30 -14 -70)" />
  </g>
);

// ---- the sea crossing ----------------------------------------------------

// A little wooden sailboat with a Japanese flag on its sail (the people who
// brought the fruit) and a crate of passion fruit on deck. About 330 wide,
// waterline at y = 0.
export const Boat: React.FC<{ cargo?: number }> = ({ cargo = 3 }) => {
  const id = useUid("bt");
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.hull} />
          <stop offset="100%" stopColor={COLORS.hullDark} />
        </linearGradient>
      </defs>
      {/* mast + sail */}
      <rect x={-6} y={-300} width={12} height={270} rx={5} fill={COLORS.woodDark} stroke={INK} strokeWidth={3} />
      <path d="M10,-284 C90,-250 120,-150 112,-60 L10,-60 Z" fill={COLORS.sail} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <circle cx={60} cy={-150} r={30} fill={COLORS.flagRed} />
      <path d="M-10,-250 C-60,-210 -80,-140 -74,-70 L-10,-70 Z" fill={COLORS.sail} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M-18,-236 C-50,-200 -62,-150 -60,-90" fill="none" stroke="#e8e0cc" strokeWidth={6} strokeLinecap="round" />
      {/* the crate of fruit */}
      {Array.from({ length: cargo }, (_, i) => (
        <g key={i} transform={`translate(${-70 + i * 40} ${-70 - (i % 2) * 14}) scale(0.24)`}>
          <PassionFruit />
        </g>
      ))}
      <rect x={-104} y={-66} width={128} height={44} rx={6} fill={COLORS.wood} stroke={INK} strokeWidth={3} />
      <path d="M-104,-44 L24,-44" stroke={COLORS.woodDark} strokeWidth={3} />
      {/* hull */}
      <path d="M-170,-34 L170,-34 C160,0 130,22 96,24 L-110,24 C-140,22 -160,0 -170,-34 Z" fill={`url(#${id})`} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M-160,-18 L162,-18" stroke="#fff" strokeWidth={5} opacity={0.6} />
      {[-90, -30, 30, 90].map((x) => (
        <circle key={x} cx={x} cy={2} r={8} fill="#ffe7a8" stroke={INK} strokeWidth={2.5} />
      ))}
    </g>
  );
};

// One curly white wave mark on the sea, about 90 wide.
export const WaveMark: React.FC<{ opacity?: number }> = ({ opacity = 0.85 }) => (
  <path d="M-45,0 Q-30,-16 -15,0 Q0,16 15,0 Q30,-16 45,0" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" opacity={opacity} />
);

// ---- the research station ------------------------------------------------

// 鳳山農業試驗所 as a friendly building: a red-roofed house with a leaf
// sign, and a glass greenhouse beside it. About 440 wide, ground at y = 0.
export const Station: React.FC = () => {
  const id = useUid("st");
  return (
    <g>
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={COLORS.wall} />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e6f7ff" />
          <stop offset="100%" stopColor={COLORS.glass} />
        </linearGradient>
      </defs>
      <ellipse cx={0} cy={6} rx={240} ry={22} fill={COLORS.leaf} stroke={INK} strokeWidth={3} />
      {/* greenhouse */}
      <path d="M40,0 L40,-120 C40,-190 200,-190 200,-120 L200,0 Z" fill={`url(#${id}g)`} stroke={INK} strokeWidth={3.5} />
      {[80, 120, 160].map((x) => (
        <path key={x} d={`M${x},0 L${x},${-162 + Math.abs(x - 120) * 0.5}`} stroke="#8ab8d0" strokeWidth={3} />
      ))}
      <path d="M40,-80 L200,-80" stroke="#8ab8d0" strokeWidth={3} />
      {[64, 104, 144, 180].map((x, i) => (
        <circle key={x} cx={x} cy={-30 - (i % 2) * 8} r={18} fill={COLORS.leaf} stroke={INK} strokeWidth={2.5} />
      ))}
      <ellipse cx={80} cy={-140} rx={14} ry={26} fill="#fff" opacity={0.6} transform="rotate(35 80 -140)" />
      {/* main house */}
      <rect x={-200} y={-170} width={230} height={170} rx={8} fill={`url(#${id}w)`} stroke={INK} strokeWidth={3.5} />
      <path d="M-222,-160 L-85,-262 L52,-160 Z" fill={COLORS.roof} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M-200,-170 L-85,-252 L30,-170" fill="none" stroke={COLORS.roofDark} strokeWidth={5} opacity={0.6} />
      {/* round sign with a leaf */}
      <circle cx={-85} cy={-196} r={30} fill="#fff" stroke={INK} strokeWidth={3} />
      <path d="M-85,-180 C-104,-188 -104,-210 -85,-218 C-66,-210 -66,-188 -85,-180 Z" fill={COLORS.leaf} stroke={INK} strokeWidth={2.5} />
      <path d="M-85,-182 L-85,-214" stroke={COLORS.leafDark} strokeWidth={2.5} />
      {/* windows + door */}
      {[-170, -40].map((x) => (
        <g key={x}>
          <rect x={x} y={-130} width={50} height={46} rx={5} fill={COLORS.glass} stroke={INK} strokeWidth={3} />
          <path d={`M${x + 25},-130 L${x + 25},-84 M${x},-107 L${x + 50},-107`} stroke={INK} strokeWidth={2} />
        </g>
      ))}
      <rect x={-110} y={-90} width={50} height={90} rx={6} fill={COLORS.wood} stroke={INK} strokeWidth={3} />
      <circle cx={-70} cy={-44} r={4} fill={INK} />
      {/* a flowerpot of passion fruit seedlings at the door */}
      <g transform="translate(-160 0) scale(0.55)">
        <Pot grow={1} />
      </g>
    </g>
  );
};

// ---- growing things ------------------------------------------------------

// A three-lobed passion fruit leaf, stem at (0, 0), pointing up. About 90 wide.
export const PLeaf: React.FC = () => (
  <g>
    <path
      d="M0,0 C-20,-6 -46,-20 -44,-54 C-30,-50 -20,-56 -14,-62 C-16,-80 -8,-98 0,-108 C8,-98 16,-80 14,-62 C20,-56 30,-50 44,-54 C46,-20 20,-6 0,0 Z"
      fill={COLORS.leaf}
      stroke={INK}
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <path d="M0,0 L0,-96 M0,-14 L-36,-48 M0,-14 L36,-48" stroke={COLORS.leafLight} strokeWidth={3} strokeLinecap="round" fill="none" />
  </g>
);

// A passion flower: ten pale petals, a ring of purple-and-white filaments
// and the green center with its stamens. About 150 wide. `open` 0 → 1.
export const PassionFlower: React.FC<{ open?: number; spin?: number }> = ({ open = 1, spin = 0 }) => {
  if (open <= 0) return null;
  return (
    <g transform={`rotate(${spin}) scale(${open})`}>
      {Array.from({ length: 10 }, (_, i) => (
        <ellipse
          key={i}
          cx={0}
          cy={-46}
          rx={17}
          ry={34}
          fill={i % 2 ? COLORS.petal : COLORS.petalShade}
          stroke={INK}
          strokeWidth={2.5}
          transform={`rotate(${i * 36 + 18})`}
        />
      ))}
      {Array.from({ length: 36 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 10})`}>
          <path d="M0,-12 L0,-50" stroke={COLORS.corona} strokeWidth={4} strokeLinecap="round" />
          <path d="M0,-38 L0,-50" stroke={COLORS.coronaTip} strokeWidth={4} strokeLinecap="round" />
        </g>
      ))}
      <circle r={20} fill={COLORS.corona} stroke={INK} strokeWidth={2} />
      <circle r={12} fill={COLORS.leafLight} stroke={INK} strokeWidth={2} />
      {[0, 120, 240].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d="M0,0 L0,-24" stroke={COLORS.leafDark} strokeWidth={4} strokeLinecap="round" />
          <ellipse cx={0} cy={-28} rx={9} ry={5} fill={COLORS.yellow} stroke={INK} strokeWidth={2} />
        </g>
      ))}
    </g>
  );
};

// A clay pot with a seedling growing out of it (`grow` 0 → 1). About 120 wide,
// pot bottom at y = 0.
export const Pot: React.FC<{ grow?: number; frame?: number }> = ({ grow = 1, frame = 0 }) => {
  const sway = Math.sin(frame / 16) * 4;
  const h = 40 + 90 * grow;
  return (
    <g>
      <g transform={`rotate(${sway * grow} 0 -80)`}>
        <path d={`M0,-80 C-8,${-80 - h * 0.5} 8,${-80 - h * 0.8} 0,${-80 - h}`} fill="none" stroke={COLORS.leafDark} strokeWidth={7} strokeLinecap="round" />
        {grow > 0.1 && (
          <g transform={`translate(0 ${-80 - h * 0.45}) rotate(-60) scale(${0.5 * grow})`}>
            <PLeaf />
          </g>
        )}
        {grow > 0.4 && (
          <g transform={`translate(0 ${-80 - h * 0.7}) rotate(55) scale(${0.55 * grow})`}>
            <PLeaf />
          </g>
        )}
        <g transform={`translate(0 ${-80 - h}) scale(${0.35 + 0.4 * grow})`}>
          <PLeaf />
        </g>
      </g>
      <path d="M-58,-80 L58,-80 L44,0 L-44,0 Z" fill={COLORS.pot} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <rect x={-66} y={-96} width={132} height={24} rx={8} fill={COLORS.pot} stroke={INK} strokeWidth={3.5} />
      <path d="M-40,-60 L-34,-12" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.35} />
    </g>
  );
};

// A trellis (wooden posts + a bar), with a passion fruit vine that climbs
// it as `grow` goes 0 → 1. Flowers open with `bloom`, fruits hang with
// `fruit` (both 0 → 1). About 760 wide; ground at y = 0, bar at y = -330.
const VINE_LEAVES: [number, number, number][] = [
  // position along the vine (0 → 1), side (rotation), size
  [0.08, -50, 0.8], [0.16, 60, 0.85], [0.24, -40, 0.9], [0.32, 140, 0.9], [0.4, -150, 0.95], [0.48, 150, 0.9],
  [0.56, -140, 1], [0.64, 160, 0.9], [0.72, -150, 0.95], [0.8, 140, 0.9], [0.88, -160, 0.85], [0.95, 150, 0.8],
];
const FLOWERS = [0.36, 0.6, 0.84];
const FRUITS = [0.46, 0.7, 0.92, 0.52];

// The vine: up the left post, then along the bar to the right.
const vinePoint = (t: number): [number, number] => {
  const up = 0.3; // first 30 % climbs the post
  if (t < up) {
    const u = t / up;
    return [-360 + Math.sin(u * Math.PI * 3) * 14, -u * 340];
  }
  const u = (t - up) / (1 - up);
  return [-360 + u * 720, -340 + Math.sin(u * Math.PI * 5) * 16];
};

export const Trellis: React.FC<{ grow: number; bloom?: number; fruit?: number; frame?: number; faces?: boolean }> = ({
  grow,
  bloom = 0,
  fruit = 0,
  frame = 0,
  faces = false,
}) => {
  const steps = Math.max(2, Math.round(80 * grow));
  const pts = Array.from({ length: steps }, (_, i) => vinePoint((i / (steps - 1)) * grow));
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <g>
      <ellipse cx={0} cy={8} rx={420} ry={30} fill={COLORS.soil} stroke={INK} strokeWidth={3} />
      {[-370, 370].map((x) => (
        <rect key={x} x={x - 14} y={-350} width={28} height={356} rx={6} fill={COLORS.wood} stroke={INK} strokeWidth={3} />
      ))}
      <rect x={-400} y={-366} width={800} height={26} rx={8} fill={COLORS.wood} stroke={INK} strokeWidth={3} />
      {[-200, 0, 200].map((x) => (
        <path key={x} d={`M${x},-340 L${x},-250`} stroke={COLORS.woodDark} strokeWidth={4} strokeDasharray="6 8" />
      ))}
      {/* the vine */}
      <path d={d} fill="none" stroke={COLORS.leafDark} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      {VINE_LEAVES.map(([t, rot, s], i) => {
        const k = Math.min(1, Math.max(0, (grow - t) / 0.08));
        if (k <= 0) return null;
        const [x, y] = vinePoint(t);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot + Math.sin(frame / 20 + i) * 4}) scale(${s * k})`}>
            <PLeaf />
          </g>
        );
      })}
      {/* curly tendrils */}
      {[0.2, 0.5, 0.78].map((t, i) => {
        if (grow < t + 0.05) return null;
        const [x, y] = vinePoint(t);
        return <path key={i} d={`M${x},${y} q14,-20 4,-34 q-10,-10 -16,0 q-4,10 6,10`} fill="none" stroke={COLORS.leafDark} strokeWidth={3.5} strokeLinecap="round" />;
      })}
      {FLOWERS.map((t, i) => {
        const [x, y] = vinePoint(t);
        const o = Math.min(1, Math.max(0, bloom * 1.6 - i * 0.3)) * (1 - fruit);
        return (
          <g key={i} transform={`translate(${x} ${y + 30})`}>
            <PassionFlower open={o * 0.6} spin={frame * 0.4 + i * 30} />
          </g>
        );
      })}
      {FRUITS.map((t, i) => {
        const [x, y] = vinePoint(t);
        const k = Math.min(1, Math.max(0, fruit * 1.8 - i * 0.25));
        if (k <= 0) return null;
        const swing = Math.sin(frame / 18 + i) * 6;
        return (
          <g key={i} transform={`translate(${x + (i === 3 ? -60 : 0)} ${y}) rotate(${swing})`}>
            <path d="M0,0 L0,70" stroke={COLORS.leafDark} strokeWidth={5} />
            <g transform={`translate(0 ${70 + 100 * 0.5 * k}) scale(${0.5 * k})`}>
              <PassionFruit face={faces ? "happy" : "none"} />
            </g>
          </g>
        );
      })}
    </g>
  );
};

// A watering can, spout to the right. About 200 wide.
export const WateringCan: React.FC = () => (
  <g>
    <path d="M40,-30 L120,-90 L132,-78 L58,-8 Z" fill="#7cc4e8" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
    <ellipse cx={128} cy={-86} rx={14} ry={20} fill="#9fd8f4" stroke={INK} strokeWidth={3} transform="rotate(-40 128 -86)" />
    <path d="M-60,-70 C-110,-70 -110,10 -60,10" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
    <path d="M-60,-70 C-110,-70 -110,10 -60,10" fill="none" stroke="#5aaed8" strokeWidth={8} strokeLinecap="round" />
    <rect x={-70} y={-80} width={120} height={110} rx={18} fill="#5aaed8" stroke={INK} strokeWidth={3.5} />
    <ellipse cx={-40} cy={-40} rx={10} ry={26} fill="#fff" opacity={0.4} />
  </g>
);

// A smiling sun with turning rays, about 280 wide.
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
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M-16,-96 L0,-140 L16,-96 Z" fill={COLORS.sunGlow} stroke={INK} strokeWidth={3} strokeLinejoin="round" transform={`rotate(${i * 30})`} />
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

// A fat sticker arrow pointing right, about 160 wide.
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

// A falling drop of water.
export const Drop: React.FC<{ x: number; y: number; size?: number; opacity?: number }> = ({ x, y, size = 24, opacity = 1 }) => (
  <path
    transform={`translate(${x} ${y}) scale(${size / 30})`}
    d="M0,-22 C8,-8 14,0 14,8 C14,16 8,22 0,22 C-8,22 -14,16 -14,8 C-14,0 -8,-8 0,-22 Z"
    fill={COLORS.water}
    stroke="#fff"
    strokeWidth={3.5}
    opacity={opacity}
  />
);
