import React from "react";
import { COLORS, INK } from "../theme";

// A football pitch seen from above, centered on (0, 0). Real pitches are
// about 105 × 68 m, so 0.714 ha each: 10 ha ≈ 14 pitches.
export const Pitch: React.FC<{ w: number }> = ({ w }) => {
  const h = (w * 68) / 105;
  const line = Math.max(2, w / 70);
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={COLORS.pitch} stroke={INK} strokeWidth={line * 2} />
      {Array.from({ length: 6 }, (_, i) =>
        i % 2 ? <rect key={i} x={-w / 2 + (i * w) / 6} y={-h / 2} width={w / 6} height={h} fill={COLORS.pitchStripe} /> : null,
      )}
      <rect x={-w / 2 + w * 0.04} y={-h / 2 + h * 0.06} width={w * 0.92} height={h * 0.88} fill="none" stroke="#fff" strokeWidth={line} />
      <line x1={0} y1={-h / 2 + h * 0.06} x2={0} y2={h / 2 - h * 0.06} stroke="#fff" strokeWidth={line} />
      <circle r={h * 0.15} fill="none" stroke="#fff" strokeWidth={line} />
      {[-1, 1].map((s) => (
        <rect key={s} x={s < 0 ? -w / 2 + w * 0.04 : w / 2 - w * 0.04 - w * 0.15} y={-h * 0.22} width={w * 0.15} height={h * 0.44} fill="none" stroke="#fff" strokeWidth={line} />
      ))}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill="none" stroke={INK} strokeWidth={line * 2} />
    </g>
  );
};

// A cartoon football (soccer ball), centered on (0, 0).
export const Ball: React.FC<{ r: number; rot?: number }> = ({ r, rot = 0 }) => (
  <g transform={`rotate(${rot})`}>
    <circle r={r} fill="#fff" stroke={INK} strokeWidth={r * 0.1} />
    <path
      d={Array.from({ length: 5 }, (_, i) => {
        const a = ((i * 72 - 90) * Math.PI) / 180;
        return `${i ? "L" : "M"} ${Math.cos(a) * r * 0.38} ${Math.sin(a) * r * 0.38}`;
      }).join(" ") + " Z"}
      fill={INK}
    />
    {Array.from({ length: 5 }, (_, i) => {
      const a = ((i * 72 - 90) * Math.PI) / 180;
      return (
        <line key={i} x1={Math.cos(a) * r * 0.38} y1={Math.sin(a) * r * 0.38} x2={Math.cos(a) * r * 0.95} y2={Math.sin(a) * r * 0.95} stroke={INK} strokeWidth={r * 0.08} />
      );
    })}
  </g>
);
