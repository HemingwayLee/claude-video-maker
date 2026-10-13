import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import { GROUND_Y, leafShape } from "../plant";
import { COLORS, INK } from "../theme";

// A camera over the world. The world is drawn in 1080×1920 "world"
// coordinates; the camera puts world point (x, y) at screen ANCHOR, zoomed
// by z. FULL shows the world 1:1.

export type Cam = { x: number; y: number; z: number };
export const ANCHOR = { x: 540, y: 900 };
export const FULL: Cam = { x: ANCHOR.x, y: ANCHOR.y, z: 1 };

export const toScreen = (cam: Cam, wx: number, wy: number): [number, number] => [
  ANCHOR.x + (wx - cam.x) * cam.z,
  ANCHOR.y + (wy - cam.y) * cam.z,
];

// Camera keyframes: [[frame, cam], ...], eased between keys.
export const moveCam = (frame: number, keys: [number, Cam][]): Cam => {
  if (keys.length === 1 || frame <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, c1] = keys[i];
    const [f0, c0] = keys[i - 1];
    if (frame <= f1) {
      const t = interpolate(frame, [f0, f1], [0, 1]);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // ease in-out cubic
      // Zoom is interpolated in log space so it feels steady.
      const z = Math.exp(Math.log(c0.z) + (Math.log(c1.z) - Math.log(c0.z)) * e);
      return { x: c0.x + (c1.x - c0.x) * e, y: c0.y + (c1.y - c0.y) * e, z };
    }
  }
  return keys[keys.length - 1][1];
};

const camTransform = (cam: Cam, depth = 1) => {
  // depth < 1: farther away, moves and zooms less (parallax).
  const z = 1 + (cam.z - 1) * depth;
  const x = ANCHOR.x + (cam.x - ANCHOR.x) * depth;
  const y = ANCHOR.y + (cam.y - ANCHOR.y) * depth;
  return `translate(${ANCHOR.x} ${ANCHOR.y}) scale(${z}) translate(${-x} ${-y})`;
};

// Anime cumulus cloud: a bunch of circles, with a shaded underside.
const Cloud: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => {
  const puffs: [number, number, number][] = [
    [-70, 10, 44], [-25, -18, 58], [30, -26, 66], [85, -2, 50], [120, 18, 36], [-110, 22, 30],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {puffs.map(([px, py, r], i) => (
        <circle key={`o${i}`} cx={px} cy={py} r={r + 5} fill={INK} opacity={0.18} />
      ))}
      {puffs.map(([px, py, r], i) => (
        <circle key={`f${i}`} cx={px} cy={py} r={r} fill={COLORS.cloud} />
      ))}
      <path d="M -140 30 Q 0 70 156 30 Q 120 56 0 58 Q -110 58 -140 30 Z" fill={COLORS.cloudShade} />
    </g>
  );
};

// A small, faded banana plant for the background.
const FarBanana: React.FC<{ x: number; s: number; color: string }> = ({ x, s, color }) => {
  const base: [number, number] = [0, -300];
  const leaves = [
    { ctrl: [-80, -420], tip: [-200, -360], width: 34 },
    { ctrl: [-20, -460], tip: [-30, -560], width: 34 },
    { ctrl: [70, -430], tip: [190, -400], width: 34 },
    { ctrl: [-60, -330], tip: [-150, -250], width: 28 },
    { ctrl: [60, -340], tip: [150, -260], width: 28 },
  ] as { ctrl: [number, number]; tip: [number, number]; width: number }[];
  return (
    <g transform={`translate(${x} ${GROUND_Y - 120}) scale(${s})`}>
      <path d="M -18 0 L -12 -300 L 12 -300 L 18 0 Z" fill={color} />
      {leaves.map((l, i) => (
        <path key={i} d={leafShape(base, l, 0).outline} fill={color} />
      ))}
    </g>
  );
};

export const World: React.FC<{ cam: Cam; frame: number; children: React.ReactNode; overlay?: React.ReactNode }> = ({
  cam,
  frame,
  children,
  overlay,
}) => {
  const { width, height } = useVideoConfig();
  const drift = frame * 0.25;
  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={COLORS.skyTop} />
            <stop offset="0.75" stopColor={COLORS.skyBottom} />
          </linearGradient>
        </defs>
        <rect width={width} height={height} fill="url(#sky)" />
        {/* sky: barely moves */}
        <g transform={camTransform(cam, 0.08)}>
          <g transform="translate(880 330)">
            <circle r={120} fill="#fff6c9" opacity={0.6} />
            <circle r={82} fill="#ffe36b" stroke="#ffb703" strokeWidth={8} />
          </g>
          <Cloud x={((140 + drift) % 1400) - 200} y={420} s={1.1} />
          <Cloud x={((760 + drift * 0.7) % 1400) - 200} y={620} s={0.8} />
          <Cloud x={((420 + drift * 0.5) % 1400) - 200} y={260} s={0.6} />
        </g>
        {/* far hills and fields */}
        <g transform={camTransform(cam, 0.35)}>
          <path d={`M -400 ${GROUND_Y - 160} Q 100 ${GROUND_Y - 420} 520 ${GROUND_Y - 220} T 1500 ${GROUND_Y - 260} L 1500 ${GROUND_Y + 600} L -400 ${GROUND_Y + 600} Z`} fill={COLORS.hillFar} />
          <FarBanana x={90} s={0.55} color="#7cc489" />
          <FarBanana x={760} s={0.45} color="#86c992" />
          <FarBanana x={1000} s={0.6} color="#7cc489" />
        </g>
        <g transform={camTransform(cam, 0.65)}>
          <path d={`M -400 ${GROUND_Y - 60} Q 300 ${GROUND_Y - 200} 700 ${GROUND_Y - 90} T 1600 ${GROUND_Y - 110} L 1600 ${GROUND_Y + 800} L -400 ${GROUND_Y + 800} Z`} fill={COLORS.hillNear} />
        </g>
        {/* the world itself */}
        <g transform={camTransform(cam)}>
          <rect x={-1000} y={GROUND_Y} width={3200} height={1200} fill={COLORS.ground} />
          <path d={`M -1000 ${GROUND_Y} L 2200 ${GROUND_Y}`} stroke={INK} strokeWidth={5} />
          <ellipse cx={340} cy={GROUND_Y + 10} rx={170} ry={26} fill={COLORS.soil} stroke={INK} strokeWidth={4} />
          {/* grass tufts */}
          {[60, 180, 520, 610, 760, 930, 1040].map((x, i) => (
            <path key={x} d={`M ${x - 18} ${GROUND_Y + 40 + (i % 3) * 30} l 8 -26 l 8 22 l 8 -30 l 8 34`} stroke={COLORS.groundShade} strokeWidth={5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {children}
        </g>
      </svg>
      {overlay}
    </AbsoluteFill>
  );
};
