import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, INK } from "../theme";

// Full-screen backgrounds, drawn in a 1920×1080 SVG.

const Cloud: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path
      d="M -120 30 Q -150 -10 -100 -26 Q -90 -80 -30 -70 Q 0 -110 50 -78 Q 110 -90 110 -30 Q 160 -10 120 30 Z"
      fill={COLORS.cloud}
      stroke={INK}
      strokeWidth={5}
      strokeLinejoin="round"
    />
    <path d="M -100 22 Q 0 40 110 22 Q 60 34 0 34 Q -60 34 -100 22 Z" fill={COLORS.cloudShade} />
  </g>
);

// Sky, drifting clouds, two rows of hills and a field. `groundY` is the top
// of the field (where characters and plants stand).
export const Field: React.FC<{ frame: number; groundY?: number }> = ({ frame, groundY = 820 }) => {
  const drift = (frame * 0.4) % 2400;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={COLORS.skyTop} />
            <stop offset="1" stopColor={COLORS.skyBottom} />
          </linearGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#sky)" />
        {/* sun */}
        <circle cx={1700} cy={150} r={120} fill="#fff6c2" opacity={0.6} />
        <circle cx={1700} cy={150} r={80} fill="#ffe27a" stroke={INK} strokeWidth={5} />
        {[
          [260, 170, 1],
          [900, 110, 0.8],
          [1400, 260, 0.7],
          [2000, 160, 0.9],
        ].map(([x, y, s], i) => (
          <Cloud key={i} x={((x + drift * (0.5 + s * 0.4)) % 2400) - 240} y={y} s={s} />
        ))}
        {/* far and near hills */}
        <path
          d={`M 0 ${groundY - 150} Q 300 ${groundY - 300} 620 ${groundY - 170} Q 900 ${groundY - 320} 1260 ${groundY - 170} Q 1600 ${groundY - 290} 1920 ${groundY - 180} L 1920 ${groundY} L 0 ${groundY} Z`}
          fill={COLORS.hillFar}
          stroke={INK}
          strokeWidth={5}
        />
        <path
          d={`M 0 ${groundY - 60} Q 420 ${groundY - 180} 860 ${groundY - 70} Q 1300 ${groundY - 170} 1920 ${groundY - 60} L 1920 ${groundY} L 0 ${groundY} Z`}
          fill={COLORS.hillNear}
          stroke={INK}
          strokeWidth={5}
        />
        {/* field */}
        <rect x={0} y={groundY} width={1920} height={1080 - groundY} fill={COLORS.ground} stroke={INK} strokeWidth={6} />
        {Array.from({ length: 9 }, (_, i) => (
          <path
            key={i}
            d={`M ${i * 240 - 40} ${groundY + 40 + (i % 2) * 70} q 16 -22 32 0 q 16 -22 32 0`}
            stroke={COLORS.groundShade}
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

// Calm sea with little wave marks, for the map scenes.
export const Sea: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ background: COLORS.sea }}>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      {Array.from({ length: 36 }, (_, i) => {
        const x = ((i * 397) % 1920) + Math.sin(frame / 30 + i) * 14;
        const y = ((i * 263) % 1000) + 40;
        return (
          <path key={i} d={`M ${x} ${y} q 20 -16 40 0 q 20 -16 40 0`} stroke={COLORS.seaLine} strokeWidth={6} fill="none" strokeLinecap="round" />
        );
      })}
    </svg>
  </AbsoluteFill>
);

// Anime "emphasis" background: rays spinning slowly around (cx, cy).
export const Burst: React.FC<{ frame: number; cx: number; cy: number; colors: [string, string]; opacity?: number }> = ({
  frame,
  cx,
  cy,
  colors,
  opacity = 1,
}) => {
  if (opacity <= 0) return null;
  const n = 24;
  const R = 2400;
  const spin = frame * 0.25;
  return (
    <AbsoluteFill style={{ opacity }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <rect width={1920} height={1080} fill={colors[0]} />
        {Array.from({ length: n }, (_, i) => {
          const a0 = ((i / n) * 360 + spin) * (Math.PI / 180);
          const a1 = (((i + 0.5) / n) * 360 + spin) * (Math.PI / 180);
          return (
            <path
              key={i}
              d={`M ${cx} ${cy} L ${cx + Math.cos(a0) * R} ${cy + Math.sin(a0) * R} L ${cx + Math.cos(a1) * R} ${cy + Math.sin(a1) * R} Z`}
              fill={colors[1]}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
