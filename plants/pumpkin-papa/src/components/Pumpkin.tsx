import React from "react";
import { COLORS, INK } from "../theme";

// A small chestnut pumpkin (kabocha), drawn around (0, 0), about 200 wide.
// Soft painted shading: a radial gradient body, darker grooves between the
// lobes, pale speckles, a highlight and a thin dark outline.
//   variant "hei" = 小黑 (almost black-green), "bei" = 貝貝 (a bit lighter)
//   face: none, or a cute face with an expression
//   shades: sunglasses (小黑 is ready for the Taiwanese heat)

export type Face = "none" | "smile" | "happy" | "hot" | "sad";

const RX = 100;
const RY = 72;

// Outline: a squashed circle with shallow dips between the lobes and a
// dent at the top where the stem sits.
const bodyPath = (() => {
  const pts: string[] = [];
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2;
    const dip = 1 - 0.035 * Math.pow(Math.abs(Math.sin(t * 4)), 8);
    let x = Math.cos(t) * RX * dip;
    let y = Math.sin(t) * RY * dip;
    const top = t - Math.PI * 1.5; // 0 at the top
    y += 12 * Math.exp(-((top / 0.32) ** 2)); // stem dent
    if (y > 0) y *= 0.92; // flatter bottom
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
})();

// The grooves between lobes: from the stem down and around to the bottom.
const GROOVES = [-0.72, -0.38, 0, 0.38, 0.72];

const SPECKS = [
  [-62, -20], [-48, 12], [-30, -38], [-12, 30], [8, -18], [26, 14], [44, -36], [58, 18],
  [-70, 30], [70, -10], [-22, 50], [34, 46], [-50, -44], [18, -48], [-4, 6], [52, -50],
];

let uid = 0;

export const Pumpkin: React.FC<{
  variant?: "hei" | "bei";
  face?: Face;
  shades?: boolean;
  blink?: boolean; // eyes closed this frame
}> = ({ variant = "hei", face = "none", shades = false, blink = false }) => {
  const id = React.useMemo(() => `pk${uid++}`, []);
  const c =
    variant === "hei"
      ? { skin: COLORS.heiSkin, light: COLORS.heiLight, dark: COLORS.heiDark, speck: COLORS.heiSpeck }
      : { skin: COLORS.beiSkin, light: COLORS.beiLight, dark: COLORS.beiDark, speck: COLORS.beiSpeck };
  return (
    <g>
      <defs>
        <radialGradient id={`${id}b`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="55%" stopColor={c.skin} />
          <stop offset="100%" stopColor={c.dark} />
        </radialGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={COLORS.stem} />
          <stop offset="100%" stopColor={COLORS.stemDark} />
        </linearGradient>
        <clipPath id={`${id}c`}>
          <path d={bodyPath} />
        </clipPath>
      </defs>

      <path d={bodyPath} fill={`url(#${id}b)`} />
      <g clipPath={`url(#${id}c)`}>
        {GROOVES.map((k, i) => (
          <path
            key={i}
            d={`M0,-58 Q${k * 150},${-10} ${k * 52},${RY * 0.9}`}
            fill="none"
            stroke={c.dark}
            strokeWidth={k === 0 ? 0 : 7}
            strokeLinecap="round"
            opacity={0.55}
          />
        ))}
        {SPECKS.map(([x, y], i) => (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx={variant === "hei" ? 3.2 : 2.4}
            ry={variant === "hei" ? 2.2 : 6}
            fill={c.speck}
            opacity={variant === "hei" ? 0.55 : 0.35}
          />
        ))}
        {/* soft highlight, top left */}
        <ellipse cx={-42} cy={-34} rx={34} ry={16} fill="#fff" opacity={0.28} transform="rotate(-20 -42 -34)" />
        <ellipse cx={-50} cy={-38} rx={12} ry={5} fill="#fff" opacity={0.5} transform="rotate(-20 -50 -38)" />
        {/* shade at the bottom */}
        <ellipse cx={0} cy={RY + 10} rx={RX} ry={34} fill={c.dark} opacity={0.45} />
      </g>
      <path d={bodyPath} fill="none" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />

      {/* stem */}
      <path
        d="M-9,-56 C-10,-72 -4,-86 10,-94 C16,-97 22,-92 18,-86 C10,-78 8,-68 9,-56 Z"
        fill={`url(#${id}s)`}
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <ellipse cx={0} cy={-56} rx={16} ry={5} fill={c.dark} stroke={INK} strokeWidth={2.5} />

      {face !== "none" && <PumpkinFace face={face} blink={blink} />}
      {shades && <Shades />}
    </g>
  );
};

// Big white eyes read well on the dark skin.
const PumpkinFace: React.FC<{ face: Face; blink: boolean }> = ({ face, blink }) => {
  const eyeY = 2;
  const closed = blink || face === "happy";
  return (
    <g>
      {[-30, 30].map((x) =>
        closed ? (
          <path key={x} d={`M${x - 11},${eyeY + 2} Q${x},${eyeY - 10} ${x + 11},${eyeY + 2}`} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
        ) : (
          <g key={x}>
            <ellipse cx={x} cy={eyeY} rx={11} ry={13} fill="#fff" stroke={INK} strokeWidth={2.5} />
            <ellipse cx={x + (face === "sad" ? 0 : 1.5)} cy={eyeY + 2} rx={6.5} ry={8} fill="#2a1a10" />
            <circle cx={x + 3.5} cy={eyeY - 2} r={2.6} fill="#fff" />
          </g>
        ),
      )}
      {/* blush */}
      <ellipse cx={-50} cy={22} rx={11} ry={6} fill={COLORS.pink} opacity={0.75} />
      <ellipse cx={50} cy={22} rx={11} ry={6} fill={COLORS.pink} opacity={0.75} />
      {/* mouth */}
      {face === "smile" || face === "happy" ? (
        <path d="M-12,24 Q0,38 12,24 Q0,30 -12,24 Z" fill="#c2413a" stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
      ) : face === "hot" ? (
        <ellipse cx={0} cy={30} rx={9} ry={11} fill="#c2413a" stroke="#fff" strokeWidth={3} />
      ) : (
        <path d="M-12,32 Q0,22 12,32" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
      )}
      {(face === "sad" || face === "hot") && (
        <>
          <path d="M-42,-16 L-20,-10" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
          <path d="M42,-16 L20,-10" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
        </>
      )}
    </g>
  );
};

const Shades: React.FC = () => (
  <g>
    <path d="M-58,-6 L58,-6" stroke="#111" strokeWidth={5} />
    {[-30, 30].map((x) => (
      <g key={x}>
        <path
          d={`M${x - 24},-10 L${x + 24},-10 L${x + 20},8 Q${x},22 ${x - 20},8 Z`}
          fill="#14141c"
          stroke="#fff"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <path d={`M${x - 14},-4 L${x - 4},-4`} stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
      </g>
    ))}
    {/* smile under the glasses */}
    <path d="M-12,26 Q0,38 12,26" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
  </g>
);

// The pumpkin cut in half, seen from the cut side: a thin green rind,
// golden flesh, and the seed cavity in the middle.
export const PumpkinHalf: React.FC = () => {
  const id = React.useMemo(() => `ph${uid++}`, []);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}f`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor={COLORS.fleshLight} />
          <stop offset="70%" stopColor={COLORS.flesh} />
          <stop offset="100%" stopColor={COLORS.fleshDeep} />
        </radialGradient>
      </defs>
      <path d={bodyPath} fill={COLORS.heiSkin} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <g transform="scale(0.9)">
        <path d={bodyPath} fill={`url(#${id}f)`} />
      </g>
      {/* seed cavity */}
      <path
        d="M-44,-8 C-40,-34 40,-34 44,-8 C48,18 30,34 0,34 C-30,34 -48,18 -44,-8 Z"
        fill="#f6a52a"
        stroke="#e08a18"
        strokeWidth={3}
      />
      {[
        [-26, -6, -30], [-8, -16, -10], [12, -14, 15], [30, -2, 35], [-20, 14, 20], [4, 8, -5], [22, 18, -30],
      ].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={8} ry={4.5} fill={COLORS.seed} stroke="#d9a35a" strokeWidth={1.5} transform={`rotate(${r} ${x} ${y})`} />
      ))}
      <ellipse cx={-48} cy={-30} rx={22} ry={8} fill="#fff" opacity={0.35} transform="rotate(-18 -48 -30)" />
      {/* stem stub */}
      <path d="M-8,-58 L-6,-80 L8,-82 L8,-58 Z" fill={COLORS.stem} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
};
