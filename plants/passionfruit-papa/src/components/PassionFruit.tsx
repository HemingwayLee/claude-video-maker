import React from "react";
import { COLORS, INK } from "../theme";

// A purple passion fruit (百香果), drawn around (0, 0), about 190 wide.
// Soft painted shading: a radial gradient body, pale freckles, a highlight,
// a little green stalk on top and a thin dark outline.
//   face: none, or a cute face with an expression

export type Face = "none" | "smile" | "happy";

const RX = 92;
const RY = 100;

const SPECKS = [
  [-50, -30], [-30, 10], [-14, -56], [6, 30], [24, -20], [44, 14], [56, -46], [-58, 34],
  [-20, 62], [30, 60], [64, 40], [-4, -12], [12, -70], [-40, -66], [50, -76], [-66, -6],
];

let uid = 0;
const useUid = (p: string) => React.useMemo(() => `${p}${uid++}`, [p]);

// The face is drawn in light colors: dark ink would vanish on the purple skin.
const FACE = "#fff2f8";

const FaceMarks: React.FC<{ face: Face; blink: boolean }> = ({ face, blink }) => {
  if (face === "none") return null;
  const closed = face === "happy" || blink;
  return (
    <g transform="translate(0 6)">
      {closed ? (
        <>
          <path d="M-40,-4 Q-28,-18 -16,-4" fill="none" stroke={FACE} strokeWidth={6} strokeLinecap="round" />
          <path d="M16,-4 Q28,-18 40,-4" fill="none" stroke={FACE} strokeWidth={6} strokeLinecap="round" />
        </>
      ) : (
        <>
          {[-28, 28].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy={-8} rx={12} ry={15} fill="#fff" stroke={INK} strokeWidth={2.5} />
              <ellipse cx={x + 2} cy={-6} rx={7} ry={9} fill={INK} />
              <circle cx={x + 5} cy={-10} r={3} fill="#fff" />
            </g>
          ))}
        </>
      )}
      <ellipse cx={-52} cy={16} rx={13} ry={8} fill={COLORS.pink} opacity={0.85} />
      <ellipse cx={52} cy={16} rx={13} ry={8} fill={COLORS.pink} opacity={0.85} />
      {face === "happy" ? (
        <path d="M-16,14 Q0,36 16,14 Z" fill="#e0475a" stroke={FACE} strokeWidth={3.5} strokeLinejoin="round" />
      ) : (
        <path d="M-12,16 Q0,27 12,16" fill="none" stroke={FACE} strokeWidth={5} strokeLinecap="round" />
      )}
    </g>
  );
};

export const PassionFruit: React.FC<{ face?: Face; blink?: boolean }> = ({ face = "none", blink = false }) => {
  const id = useUid("pf");
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="34%" cy="28%" r="85%">
          <stop offset="0%" stopColor={COLORS.skinLight} />
          <stop offset="55%" stopColor={COLORS.skin} />
          <stop offset="100%" stopColor={COLORS.skinDark} />
        </radialGradient>
      </defs>
      {/* stalk + little calyx */}
      <path d="M0,-96 C2,-118 10,-130 22,-138" fill="none" stroke={COLORS.leafDark} strokeWidth={9} strokeLinecap="round" />
      <path d="M0,-96 C2,-118 10,-130 22,-138" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
      <ellipse cx={0} cy={0} rx={RX} ry={RY} fill={`url(#${id})`} stroke={INK} strokeWidth={3.5} />
      {SPECKS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.6 + (i % 3)} fill={COLORS.speck} opacity={0.55} />
      ))}
      <path d="M-14,-98 L0,-88 L14,-98 L8,-104 L0,-98 L-8,-104 Z" fill={COLORS.calyx} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <ellipse cx={-40} cy={-50} rx={22} ry={34} fill="#fff" opacity={0.3} transform="rotate(30 -40 -50)" />
      <ellipse cx={-52} cy={-14} rx={6} ry={10} fill="#fff" opacity={0.3} transform="rotate(20 -52 -14)" />
      <FaceMarks face={face} blink={blink} />
    </g>
  );
};

// Half a fruit, cut across, seen from slightly above: a purple cup holding
// golden jelly and black seeds. About 190 wide, cut face centered at (0, 0).
const SEEDS = [
  [-44, -6], [-24, -18], [-2, -22], [22, -16], [44, -4], [-36, 10], [-12, 4], [12, 8], [34, 12],
  [-18, 20], [6, 22], [26, -2], [-56, 4], [56, 6], [0, -6],
];

export const PassionHalf: React.FC = () => {
  const id = useUid("ph");
  return (
    <g>
      <defs>
        <radialGradient id={`${id}s`} cx="30%" cy="10%" r="95%">
          <stop offset="0%" stopColor={COLORS.skinLight} />
          <stop offset="50%" stopColor={COLORS.skin} />
          <stop offset="100%" stopColor={COLORS.skinDark} />
        </radialGradient>
        <radialGradient id={`${id}p`} cx="45%" cy="40%" r="70%">
          <stop offset="0%" stopColor={COLORS.pulpLight} />
          <stop offset="65%" stopColor={COLORS.pulp} />
          <stop offset="100%" stopColor={COLORS.pulpDeep} />
        </radialGradient>
      </defs>
      {/* the cup */}
      <path
        d={`M${-RX},0 C${-RX},70 -50,${RY} 0,${RY} C50,${RY} ${RX},70 ${RX},0 Z`}
        fill={`url(#${id}s)`}
        stroke={INK}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      {SPECKS.slice(0, 8).map(([x, y], i) => (
        <circle key={i} cx={x * 0.9} cy={40 + Math.abs(y) * 0.5} r={2.6 + (i % 3)} fill={COLORS.speck} opacity={0.5} />
      ))}
      {/* the cut face: white pith ring, golden jelly, seeds */}
      <ellipse cx={0} cy={0} rx={RX} ry={38} fill={COLORS.pith} stroke={INK} strokeWidth={3.5} />
      <ellipse cx={0} cy={2} rx={RX - 13} ry={29} fill={`url(#${id}p)`} />
      {SEEDS.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y * 0.9})`}>
          <ellipse rx={7} ry={5.5} fill="#ffe9a0" opacity={0.8} />
          <ellipse rx={3.6} ry={2.6} fill={COLORS.seed} />
        </g>
      ))}
      <ellipse cx={-30} cy={-10} rx={18} ry={6} fill="#fff" opacity={0.5} transform="rotate(-8 -30 -10)" />
      <ellipse cx={-56} cy={52} rx={10} ry={18} fill="#fff" opacity={0.25} transform="rotate(30 -56 52)" />
    </g>
  );
};
