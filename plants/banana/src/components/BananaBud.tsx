import React from "react";
import { COLORS, INK } from "../theme";

// The banana flower (香蕉花, the purple-red "heart" at the end of the bunch),
// drawn hanging from (0, 0) and pointing down, BUD_LENGTH (210) long.
//
// It is a stack of purple-red bracts (苞片). Under each bract hides a row of
// small cream flowers (小花) that look like little fingers. `open` lifts
// the bracts one after the other: 0 = closed, 1 = first bract up, 2 = both.

const BODY = "M 0 0 C 74 10, 80 120, 0 210 C -80 120, -74 10, 0 0 Z";
const BODY_SHADE = "M 0 0 C 74 10, 80 120, 0 210 C 30 140, 36 50, 0 0 Z";

// A bract, hinged along its top edge at y = 0 (local coordinates).
const BRACT = "M 0 -4 C 40 0, 64 40, 56 70 C 42 94, 14 104, 0 106 C -14 104, -42 94, -56 70 C -64 40, -40 0, 0 -4 Z";

const Florets: React.FC<{ y: number; width: number; dry?: number }> = ({ y, width, dry = 0 }) => {
  const n = 7;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1) - 0.5;
        const x = t * width;
        const rot = t * 40;
        return (
          <g key={i} transform={`translate(${x} ${y + Math.abs(t) * 10}) rotate(${rot})`}>
            {/* tube */}
            <rect x={-6.5} y={0} width={13} height={50} rx={6.5} fill={dry ? COLORS.floretDry : COLORS.floret} stroke={INK} strokeWidth={3} />
            <rect x={1} y={4} width={4} height={40} rx={2} fill={COLORS.floretShade} opacity={0.8} />
            {/* yellow tip of the flower */}
            <ellipse cx={0} cy={50} rx={7} ry={6} fill={COLORS.yellow} stroke={INK} strokeWidth={3} />
          </g>
        );
      })}
    </g>
  );
};

// Flips a bract up around its top edge: scaleY 1 → -0.55 looks like it
// rotates toward the viewer and up, showing its pink inner face.
const Bract: React.FC<{ y: number; open: number; scale: number }> = ({ y, open, scale }) => {
  const o = Math.max(0, Math.min(1, open));
  const sy = 1 - 1.55 * o;
  const inner = sy < 0;
  return (
    <g transform={`translate(0 ${y}) scale(${scale} ${sy * scale})`}>
      <path d={BRACT} fill={inner ? COLORS.bractInner : COLORS.bract} stroke={INK} strokeWidth={4 / scale} strokeLinejoin="round" />
      {inner ? (
        // light stripes on the inner face
        [-24, 0, 24].map((x) => (
          <path key={x} d={`M ${x} 6 Q ${x * 0.6} 50 ${x * 0.2} 88`} stroke="#f3a1bf" strokeWidth={3} fill="none" />
        ))
      ) : (
        <path d="M -34 22 C -44 46, -30 74, -14 88" stroke={COLORS.bractHighlight} strokeWidth={6} fill="none" strokeLinecap="round" />
      )}
    </g>
  );
};

export const BananaBud: React.FC<{ open?: number; sway?: number }> = ({ open = 0, sway = 0 }) => {
  return (
    <g transform={`rotate(${sway})`}>
      {/* the stalk end that holds the flower */}
      <rect x={-9} y={-14} width={18} height={24} rx={6} fill={COLORS.stalk} stroke={INK} strokeWidth={4} />
      {/* body */}
      <path d={BODY} fill={COLORS.bract} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d={BODY_SHADE} fill={COLORS.bractShade} opacity={0.75} />
      {/* scale lines of the lower, still-closed bracts */}
      {[118, 148, 176].map((y, i) => (
        <path key={y} d={`M ${-58 + i * 14} ${y - 14} Q 0 ${y + 14} ${58 - i * 14} ${y - 14}`} stroke={INK} strokeWidth={3.5} fill="none" opacity={0.75} />
      ))}
      {/* shine */}
      <ellipse cx={-30} cy={120} rx={9} ry={34} fill={COLORS.bractHighlight} opacity={0.7} transform="rotate(12 -30 120)" />
      <ellipse cx={-22} cy={168} rx={4} ry={9} fill="#fff" opacity={0.6} />

      {/* row 2: under the second bract */}
      <Florets y={62} width={68} />
      <Bract y={52} open={open - 1} scale={0.95} />
      {/* row 1: under the first bract */}
      <Florets y={14} width={80} />
      <Bract y={6} open={open} scale={1.05} />
    </g>
  );
};
