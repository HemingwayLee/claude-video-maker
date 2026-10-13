import React from "react";
import { COLORS, INK } from "../theme";

// Simplified coastlines as [longitude, latitude] points, drawn by hand from
// an atlas. Good enough for a cartoon map, not for navigation.

type LonLat = [number, number];

export const TAIWAN: LonLat[] = [
  [121.51, 25.3], [121.62, 25.22], [121.75, 25.14], [121.93, 25.03], [121.86, 24.86], [121.83, 24.7],
  [121.86, 24.57], [121.73, 24.3], [121.62, 24.05], [121.57, 23.85], [121.48, 23.55], [121.4, 23.25],
  [121.3, 22.98], [121.15, 22.75], [121.0, 22.58], [120.9, 22.35], [120.87, 22.1], [120.84, 21.9],
  [120.73, 21.93], [120.7, 22.1], [120.62, 22.33], [120.45, 22.48], [120.28, 22.6], [120.2, 22.8],
  [120.1, 23.05], [120.12, 23.3], [120.15, 23.5], [120.2, 23.75], [120.33, 24.0], [120.47, 24.22],
  [120.62, 24.45], [120.8, 24.68], [120.92, 24.85], [121.05, 25.03], [121.25, 25.12], [121.4, 25.2],
];

// The coast of mainland China facing Taiwan (Fujian and Guangdong), closed
// off far to the west so it can be filled.
export const MAINLAND: LonLat[] = [
  [120.6, 28.5], [120.2, 27.2], [119.8, 26.6], [119.7, 26.1], [119.55, 25.75], [119.45, 25.4],
  [119.1, 25.2], [118.95, 24.95], [118.65, 24.75], [118.3, 24.55], [118.05, 24.4], [117.8, 24.2],
  [117.5, 23.9], [117.2, 23.6], [116.8, 23.3], [116.5, 22.95], [115.8, 22.75], [114.5, 22.4],
  [110, 22], [110, 28.5],
];

// Map projection: degrees → pixels around (lon0, lat0). k = pixels per
// degree of latitude; longitude is squeezed by cos(latitude).
export type Projection = { k: number; lon0: number; lat0: number };
const COS = Math.cos((23.7 * Math.PI) / 180);

export const project = ([lon, lat]: LonLat, p: Projection): [number, number] => [(lon - p.lon0) * COS * p.k, -(lat - p.lat0) * p.k];

// A smooth closed path through the points (Catmull-Rom → cubic Bézier).
export const landPath = (pts: LonLat[], p: Projection) => {
  const xy = pts.map((q) => project(q, p));
  const n = xy.length;
  let d = `M ${xy[0][0].toFixed(1)} ${xy[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = xy[(i - 1 + n) % n];
    const p1 = xy[i];
    const p2 = xy[(i + 1) % n];
    const p3 = xy[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + " Z";
};

// Taiwan, centered on (0, 0), `height` px tall.
export const Taiwan: React.FC<{ height: number; fill?: string; shade?: string; stroke?: number; mountains?: boolean }> = ({
  height,
  fill = COLORS.land,
  shade = COLORS.landShade,
  stroke,
  mountains = true,
}) => {
  const p: Projection = { k: height / 3.4, lon0: 121.0, lat0: 23.6 };
  const sw = stroke ?? Math.max(3, height / 110);
  const s = height / 800;
  return (
    <g>
      <path d={landPath(TAIWAN, p)} fill={fill} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      {mountains && (
        // the Central Mountain Range, as a few cartoon peaks down the middle
        <g>
          {[
            [40, -230, 1],
            [60, -120, 1.2],
            [50, 0, 1.1],
            [20, 120, 0.9],
            [-20, 220, 0.7],
          ].map(([x, y, m], i) => (
            <path
              key={i}
              d={`M ${(x - 40 * m) * s} ${(y + 20 * m) * s} L ${x * s} ${(y - 40 * m) * s} L ${(x + 40 * m) * s} ${(y + 20 * m) * s} Z`}
              fill={shade}
              stroke={INK}
              strokeWidth={sw * 0.6}
              strokeLinejoin="round"
            />
          ))}
        </g>
      )}
    </g>
  );
};

// A cargo ship, centered on its waterline at (0, 0), facing right, ~260 px long.
// Its deck carries crates of goji berries.
export const Ship: React.FC<{ frame: number }> = ({ frame }) => {
  const roll = Math.sin(frame / 10) * 2.5;
  return (
    <g transform={`rotate(${roll})`}>
      <path d="M -130 -20 L 140 -20 L 110 30 L -110 30 Z" fill="#e65a4f" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -122 -6 L 132 -6" stroke="#fff" strokeWidth={6} />
      <rect x={-110} y={-96} width={50} height={76} rx={6} fill="#fff" stroke={INK} strokeWidth={5} />
      <rect x={-100} y={-84} width={30} height={18} rx={3} fill={COLORS.sea} stroke={INK} strokeWidth={3} />
      {[-40, 20, 80].map((x, i) => (
        <Crate key={x} x={x} y={-20} w={56} h={44 + (i % 2) * 10} />
      ))}
      {/* wake */}
      <path d={`M -150 26 q -20 -8 -40 0 q -20 8 -40 0`} stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.8} />
    </g>
  );
};

// A wooden crate heaped with goji berries, bottom-center at (x, y).
export const Crate: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={`M ${-w / 2 + 4} ${-h} Q 0 ${-h - w * 0.45} ${w / 2 - 4} ${-h} Z`} fill={COLORS.berry} stroke={INK} strokeWidth={4} />
    <circle cx={-w * 0.12} cy={-h - w * 0.14} r={w * 0.06} fill={COLORS.berryShine} />
    <rect x={-w / 2} y={-h} width={w} height={h} rx={4} fill={COLORS.wood} stroke={INK} strokeWidth={5} />
    <line x1={-w / 2} y1={-h / 2} x2={w / 2} y2={-h / 2} stroke={COLORS.woodShade} strokeWidth={4} />
  </g>
);
