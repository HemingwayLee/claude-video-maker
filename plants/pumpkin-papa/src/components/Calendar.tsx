import React from "react";
import { COLORS, FONT, INK } from "../theme";

// A ring of the 12 months, like a clock: 12 at the top, 3 on the right.
// `lit[m]` (0 → 1) lights month m (1–12) in its season's color.

export const monthAngle = (m: number) => m * 30; // degrees clockwise from the top

const polar = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [Math.cos(a) * r, Math.sin(a) * r] as const;
};

const sector = (r0: number, r1: number, a0: number, a1: number) => {
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  return `M${x0},${y0} A${r1},${r1} 0 0 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 0 0 ${x3},${y3} Z`;
};

export const seasonColor = (m: number) => (m >= 9 && m <= 11 ? COLORS.autumn : m === 12 || m <= 2 ? COLORS.winter : "#f2e6d4");

export const Calendar: React.FC<{ lit: Record<number, number>; R?: number; r?: number }> = ({ lit, R = 340, r = 210 }) => (
  <g>
    <circle r={R + 8} fill="#fffaf2" stroke={INK} strokeWidth={3.5} />
    {Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const a = monthAngle(m);
      const on = lit[m] ?? 0;
      const [tx, ty] = polar((R + r) / 2, a);
      return (
        <g key={m}>
          <path d={sector(r, R, a - 15, a + 15)} fill="#f4ead9" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path
            d={sector(r, r + (R - r) * on, a - 15, a + 15)}
            fill={seasonColor(m)}
            opacity={on > 0 ? 1 : 0}
          />
          <path d={sector(r, R, a - 15, a + 15)} fill="none" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <text
            x={tx}
            y={ty}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={FONT}
            fontWeight={900}
            fontSize={on > 0.5 ? 60 : 46}
            fill={on > 0.5 ? "#fff" : "#b9a58a"}
            stroke={on > 0.5 ? INK : "none"}
            strokeWidth={on > 0.5 ? 3 : 0}
            paintOrder="stroke"
          >
            {m}
          </text>
        </g>
      );
    })}
    <circle r={r} fill="#fff6e8" stroke={INK} strokeWidth={3.5} />
  </g>
);

// A thick arrow along the ring from angle a0 to a1 (degrees, clockwise),
// drawn up to `t` (0 → 1).
export const ArcArrow: React.FC<{ radius: number; a0: number; a1: number; t: number; color: string }> = ({
  radius,
  a0,
  a1,
  t,
  color,
}) => {
  if (t <= 0) return null;
  const end = a0 + (a1 - a0) * t;
  const [x0, y0] = polar(radius, a0);
  const [x1, y1] = polar(radius, end);
  const large = end - a0 > 180 ? 1 : 0;
  // arrowhead pointing along the tangent at the end
  const tip = polar(radius, end + 6);
  return (
    <g>
      <path d={`M${x0},${y0} A${radius},${radius} 0 ${large} 1 ${x1},${y1}`} fill="none" stroke="#fff" strokeWidth={34} strokeLinecap="round" />
      <path d={`M${x0},${y0} A${radius},${radius} 0 ${large} 1 ${x1},${y1}`} fill="none" stroke={color} strokeWidth={20} strokeLinecap="round" />
      <g transform={`translate(${tip[0]} ${tip[1]}) rotate(${end + 6})`}>
        <path d="M0,0 L-36,-30 L-36,30 Z" transform="rotate(0)" fill={color} stroke="#fff" strokeWidth={6} strokeLinejoin="round" />
      </g>
    </g>
  );
};
