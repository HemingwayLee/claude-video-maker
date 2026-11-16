import React from "react";
import { COLORS, INK } from "../theme";

// The props of the story, each drawn around (0, 0) in the same soft
// sticker style as the pumpkin. Wrap them in <Sticker> to place them.

let uid = 0;
const useUid = (p: string) => React.useMemo(() => `${p}${uid++}`, [p]);

// A chestnut (栗子): what the pumpkin tastes like. About 110 wide.
export const Chestnut: React.FC = () => {
  const id = useUid("cn");
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#c47a42" />
          <stop offset="60%" stopColor={COLORS.chestnut} />
          <stop offset="100%" stopColor={COLORS.chestnutDark} />
        </radialGradient>
      </defs>
      <path
        d="M0,-58 C10,-58 18,-52 26,-44 C46,-26 56,-2 56,22 C56,46 30,56 0,56 C-30,56 -56,46 -56,22 C-56,-2 -46,-26 -26,-44 C-18,-52 -10,-58 0,-58 Z"
        fill={`url(#${id})`}
        stroke={INK}
        strokeWidth={3.5}
      />
      <path d="M-50,28 C-30,40 30,40 50,28 C52,44 30,54 0,54 C-30,54 -52,44 -50,28 Z" fill={COLORS.chestnutBase} />
      <path d="M0,-58 L-2,-68 L4,-68 Z" fill={COLORS.chestnutDark} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={-22} cy={-18} rx={12} ry={22} fill="#fff" opacity={0.35} transform="rotate(25 -22 -18)" />
      <path
        d="M-56,22 C-56,46 -30,56 0,56 C30,56 56,46 56,22"
        fill="none"
        stroke={INK}
        strokeWidth={3.5}
      />
    </g>
  );
};

// A smiling sun with turning rays. `heat` (0 → 1) makes it bigger and angrier-red.
export const Sun: React.FC<{ frame: number; heat?: number }> = ({ frame, heat = 0 }) => {
  const id = useUid("sun");
  const rays = 12;
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff6b0" />
          <stop offset="60%" stopColor={COLORS.sun} />
          <stop offset="100%" stopColor={heat > 0.5 ? COLORS.hot : COLORS.sunGlow} />
        </radialGradient>
      </defs>
      <g transform={`rotate(${frame * 0.8})`}>
        {Array.from({ length: rays }, (_, i) => (
          <path
            key={i}
            d="M-16,-96 L0,-140 L16,-96 Z"
            fill={heat > 0.5 ? COLORS.hot : COLORS.sunGlow}
            stroke={INK}
            strokeWidth={3}
            strokeLinejoin="round"
            transform={`rotate(${(i * 360) / rays}) scale(1, ${1 + 0.25 * heat + 0.08 * Math.sin(frame / 4 + i)})`}
          />
        ))}
      </g>
      <circle r={90} fill={`url(#${id})`} stroke={INK} strokeWidth={3.5} />
      {/* face */}
      <path d="M-34,-4 Q-24,-16 -14,-4" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <path d="M14,-4 Q24,-16 34,-4" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <ellipse cx={-46} cy={18} rx={12} ry={7} fill={COLORS.pink} opacity={0.8} />
      <ellipse cx={46} cy={18} rx={12} ry={7} fill={COLORS.pink} opacity={0.8} />
      <path d="M-18,22 Q0,42 18,22 Z" fill="#c2413a" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={-38} cy={-46} rx={20} ry={10} fill="#fff" opacity={0.5} transform="rotate(-30 -38 -46)" />
    </g>
  );
};

// A six-armed snowflake, about 60 wide.
export const Snowflake: React.FC<{ color?: string }> = ({ color = "#ffffff" }) => (
  <g stroke={color} strokeWidth={6} strokeLinecap="round" fill="none">
    {[0, 60, 120].map((a) => (
      <g key={a} transform={`rotate(${a})`}>
        <path d="M0,-30 L0,30" />
        <path d="M-9,-22 L0,-14 L9,-22 M-9,22 L0,14 L9,22" />
      </g>
    ))}
  </g>
);

// A thermometer: `level` 0 (cold, blue) → 1 (hot, red). About 300 tall.
export const Thermometer: React.FC<{ level: number }> = ({ level }) => {
  const top = -130;
  const bottom = 90;
  const y = bottom - (bottom - top) * (0.12 + 0.88 * level);
  const r = Math.round(95 + (255 - 95) * level);
  const g = Math.round(180 + (90 - 180) * level);
  const b = Math.round(255 + (54 - 255) * level);
  const fill = `rgb(${r},${g},${b})`;
  return (
    <g>
      <rect x={-26} y={-160} width={52} height={270} rx={26} fill="#fff" stroke={INK} strokeWidth={3.5} />
      <circle cx={0} cy={130} r={46} fill="#fff" stroke={INK} strokeWidth={3.5} />
      <rect x={-12} y={y} width={24} height={bottom - y + 30} rx={12} fill={fill} />
      <circle cx={0} cy={130} r={33} fill={fill} />
      <ellipse cx={-12} cy={118} rx={8} ry={12} fill="#fff" opacity={0.55} />
      {[-110, -70, -30, 10, 50].map((t) => (
        <path key={t} d={`M10,${t} L22,${t}`} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      ))}
    </g>
  );
};

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

// Hokkaido, simplified, centered, about 440 × 370.
const HOKKAIDO = smooth(
  ([
    [176, 0], [196, 40], [236, 88], [298, 118], [360, 134], [404, 104], [436, 118], [404, 160], [438, 186],
    [384, 202], [322, 228], [262, 268], [232, 322], [204, 272], [160, 242], [122, 240], [100, 270],
    [112, 304], [74, 350], [48, 366], [28, 322], [58, 272], [50, 232], [90, 190], [120, 140], [132, 82],
    [150, 30],
  ] as [number, number][]).map(([x, y]) => [x - 230, y - 185]),
);

export const Island: React.FC<{ which: "taiwan" | "hokkaido"; tint?: string; tintMix?: number }> = ({
  which,
  tint,
  tintMix = 0,
}) => {
  const id = useUid("is");
  const d = which === "taiwan" ? TAIWAN : HOKKAIDO;
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor={COLORS.leafLight} />
          <stop offset="100%" stopColor={COLORS.landDark} />
        </radialGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      {/* a few soft mountains */}
      {(which === "taiwan"
        ? [[30, -120, 1], [14, -40, 1.25], [0, 50, 1], [-8, 130, 0.8]]
        : [[-40, -40, 1], [10, -10, 1.2], [70, 20, 0.9]]
      ).map(([x, y, s], i) => (
        <path
          key={i}
          transform={`translate(${x} ${y}) scale(${s})`}
          d="M-26,12 L-4,-20 L4,-10 L12,-22 L30,12 Z"
          fill={COLORS.leafDark}
          stroke={INK}
          strokeWidth={2.5}
          strokeLinejoin="round"
          opacity={0.6}
        />
      ))}
      {tint && <path d={d} fill={tint} opacity={tintMix} />}
    </g>
  );
};

// A pumpkin leaf: five rounded lobes, veins. About 140 wide, stem at (0, 0)
// and the blade pointing up. `dry` (0 → 1) turns it yellow-brown; `color`
// paints it any color (autumn leaves).
export const Leaf: React.FC<{ dry?: number; color?: string }> = ({ dry = 0, color }) => {
  const mix = (a: string, b: string) => {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - dry) + ((pb >> s) & 255) * dry);
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  };
  return (
    <g>
      <path
        d="M0,0 C-30,-6 -70,-14 -70,-48 C-82,-60 -74,-92 -50,-96 C-46,-122 -14,-134 0,-118 C14,-134 46,-122 50,-96 C74,-92 82,-60 70,-48 C70,-14 30,-6 0,0 Z"
        fill={color ?? mix(COLORS.leaf, COLORS.leafDry)}
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d="M0,0 L0,-110 M0,-40 L-56,-70 M0,-40 L56,-70 M0,-20 L-60,-36 M0,-20 L60,-36" stroke={mix(COLORS.leafLight, "#e0c98a")} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <ellipse cx={-30} cy={-80} rx={16} ry={8} fill="#fff" opacity={0.25} transform="rotate(-30 -30 -80)" />
    </g>
  );
};

// A pumpkin plant on a mound of soil: leaves on stalks, optionally a fruit.
// `grow` (0 → 1) raises it from a sprout; `wilt` (0 → 1) droops and dries it.
export const Plant: React.FC<{ grow?: number; wilt?: number; fruit?: React.ReactNode; frame?: number }> = ({
  grow = 1,
  wilt = 0,
  fruit,
  frame = 0,
}) => {
  const leaves = [
    { a: -38, len: 120, s: 1 },
    { a: 30, len: 135, s: 1.1 },
    { a: -8, len: 165, s: 0.95 },
  ];
  const wave = Math.sin(frame / 18) * 2 * (1 - wilt);
  return (
    <g>
      <ellipse cx={0} cy={6} rx={120} ry={30} fill={COLORS.soil} stroke={INK} strokeWidth={3} />
      <ellipse cx={-30} cy={-2} rx={40} ry={8} fill="#c18c5c" opacity={0.6} />
      {leaves.map((l, i) => {
        const a = l.a * (1 + wilt * 0.9) + wave + (l.a > 0 ? 1 : -1) * wilt * 40;
        const len = l.len * grow * (1 - wilt * 0.35);
        const rad = (a * Math.PI) / 180;
        const tx = Math.sin(rad) * len;
        const ty = -Math.cos(rad) * len;
        return (
          <g key={i}>
            <path
              d={`M0,0 Q${tx * 0.2},${ty * 0.6} ${tx},${ty}`}
              stroke={COLORS.leafDark}
              strokeWidth={7}
              fill="none"
              strokeLinecap="round"
            />
            <g transform={`translate(${tx} ${ty}) rotate(${a + wilt * (l.a > 0 ? 70 : -70)}) scale(${l.s * grow * (1 - wilt * 0.2)})`}>
              <Leaf dry={wilt} />
            </g>
          </g>
        );
      })}
      {fruit}
    </g>
  );
};

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

// A drop of sweat.
export const Sweat: React.FC<{ x: number; y: number; size?: number; opacity?: number }> = ({
  x,
  y,
  size = 30,
  opacity = 1,
}) => (
  <path
    transform={`translate(${x} ${y}) scale(${size / 30})`}
    d="M0,-22 C8,-8 14,0 14,8 C14,16 8,22 0,22 C-8,22 -14,16 -14,8 C-14,0 -8,-8 0,-22 Z"
    fill="#8fd3ff"
    stroke="#fff"
    strokeWidth={3.5}
    opacity={opacity}
  />
);

// Wavy heat lines rising.
export const HeatWaves: React.FC<{ x: number; y: number; frame: number; opacity: number }> = ({ x, y, frame, opacity }) => (
  <g opacity={opacity} transform={`translate(${x} ${y})`}>
    {[-60, 0, 60].map((dx, i) => {
      const rise = ((frame * 1.6 + i * 30) % 90) - 45;
      return (
        <path
          key={i}
          d={`M${dx},${30 - rise} q12,-12 0,-24 q-12,-12 0,-24 q12,-12 0,-24`}
          fill="none"
          stroke={COLORS.hot}
          strokeWidth={7}
          strokeLinecap="round"
          opacity={1 - Math.abs(rise) / 50}
        />
      );
    })}
  </g>
);
