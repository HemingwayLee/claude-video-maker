import React from "react";
import { COLORS, diverging, FONT, MONO } from "../theme";

// Building blocks for the diagrams: arrows, network blocks, the noise vector
// and simple line charts. All coordinates are in video pixels (1920×1080).

// A full-frame SVG layer to draw paths on.
export const Layer: React.FC<{ children: React.ReactNode; opacity?: number }> = ({ children, opacity = 1 }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity, overflow: "visible" }}>
    {children}
  </svg>
);

// An arrow along an SVG path. `progress` 0..1 draws it in; `flow` animates
// dashes along it (pass the frame number).
export const Arrow: React.FC<{
  d: string;
  color?: string;
  width?: number;
  progress?: number;
  flow?: number;
  dashed?: boolean;
  id: string;
}> = ({ d, color = COLORS.muted, width = 4, progress = 1, flow, dashed, id }) => {
  const LEN = 3000; // longer than any path we draw
  const dash = dashed || flow !== undefined;
  return (
    <>
      <defs>
        <marker id={`head-${id}`} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M 0 0 L 8 4 L 0 8 z" fill={color} />
        </marker>
        {/* user-space units: a straight line has a zero-height bounding box */}
        <mask id={`mask-${id}`} maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
          <path d={d} fill="none" stroke="white" strokeWidth={width + 30} strokeDasharray={LEN} strokeDashoffset={LEN * (1 - progress)} />
        </mask>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dash ? "14 10" : undefined}
        strokeDashoffset={flow !== undefined ? -flow * 1.5 : undefined}
        markerEnd={progress > 0.98 ? `url(#head-${id})` : undefined}
        mask={`url(#mask-${id})`}
      />
    </>
  );
};

// A network drawn as a trapezoid: wide → narrow (`shape="shrink"`, the
// discriminator) or narrow → wide (`shape="grow"`, the generator).
export const NetBlock: React.FC<{
  x: number;
  y: number; // center line
  w: number;
  h: number;
  shape: "grow" | "shrink";
  color: string;
  label: string;
  sub?: string;
  labelSize?: number;
  opacity?: number;
  glow?: number;
}> = ({ x, y, w, h, shape, color, label, sub, labelSize = 64, opacity = 1, glow = 0 }) => {
  const narrow = h * 0.42;
  const [l, r] = shape === "grow" ? [narrow, h] : [h, narrow];
  const pts = [
    [x, y - l / 2],
    [x + w, y - r / 2],
    [x + w, y + r / 2],
    [x, y + l / 2],
  ]
    .map((p) => p.join(","))
    .join(" ");
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity }}>
      <svg width={1920} height={1080} style={{ position: "absolute", filter: glow > 0 ? `drop-shadow(0 0 ${24 * glow}px ${color})` : undefined }}>
        <polygon points={pts} fill={`${color}2a`} stroke={color} strokeWidth={4} strokeLinejoin="round" />
      </svg>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y - labelSize * 0.55 - (sub ? 18 : 0),
          width: w,
          textAlign: "center",
          fontFamily: FONT,
          color,
          fontSize: labelSize,
          fontWeight: 800,
          lineHeight: 1.1,
        }}
      >
        {label}
        {sub ? <div style={{ fontSize: 22, fontWeight: 600, color: COLORS.text, marginTop: 8 }}>{sub}</div> : null}
      </div>
    </div>
  );
};

// A vector drawn as a column (or row) of colored cells.
export const Vector: React.FC<{
  values: number[];
  x: number;
  y: number;
  cell?: number;
  color?: string; // border color
  horizontal?: boolean;
  showValues?: boolean;
  opacity?: number;
  label?: React.ReactNode;
  max?: number; // value that gets full color
}> = ({ values, x, y, cell = 26, color = COLORS.purple, horizontal, showValues, opacity = 1, label, max = 1.3 }) => (
  <div style={{ position: "absolute", left: x, top: y, opacity, display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ display: "flex", flexDirection: horizontal ? "row" : "column", gap: 3 }}>
      {values.map((v, i) => (
        <div
          key={i}
          style={{
            width: showValues ? cell * 1.9 : cell,
            height: cell - 3,
            borderRadius: 5,
            background: diverging(v, max),
            border: `2px solid ${color}99`,
            fontFamily: MONO,
            fontSize: cell * 0.48,
            fontWeight: 600,
            color: COLORS.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {showValues ? v.toFixed(1) : null}
        </div>
      ))}
    </div>
    {label ? <div style={{ textAlign: "center", fontFamily: FONT, fontSize: 24, fontWeight: 700, color, marginTop: 6, whiteSpace: "nowrap" }}>{label}</div> : null}
  </div>
);

// A chart frame: maps data coordinates to pixels.
export type Chart = { x: number; y: number; w: number; h: number; x0: number; x1: number; y0: number; y1: number };
export const px = (c: Chart, vx: number) => c.x + ((vx - c.x0) / (c.x1 - c.x0)) * c.w;
export const py = (c: Chart, vy: number) => c.y + c.h - ((vy - c.y0) / (c.y1 - c.y0)) * c.h;

export const linePath = (c: Chart, xs: number[], ys: number[]) =>
  xs.map((vx, i) => `${i === 0 ? "M" : "L"} ${px(c, vx).toFixed(1)} ${py(c, Math.min(c.y1, ys[i])).toFixed(1)}`).join(" ");

// Same as linePath, closed down to the x axis (for filled densities).
export const areaPath = (c: Chart, xs: number[], ys: number[]) =>
  `${linePath(c, xs, ys)} L ${px(c, xs[xs.length - 1])} ${py(c, c.y0)} L ${px(c, xs[0])} ${py(c, c.y0)} Z`;

export const Axes: React.FC<{ c: Chart; xLabel?: string; yLabel?: string; color?: string }> = ({ c, xLabel, yLabel, color = COLORS.muted }) => (
  <>
    <line x1={c.x} y1={c.y + c.h} x2={c.x + c.w} y2={c.y + c.h} stroke={color} strokeWidth={2} />
    <line x1={c.x} y1={c.y} x2={c.x} y2={c.y + c.h} stroke={color} strokeWidth={2} />
    {xLabel ? (
      <text x={c.x + c.w} y={c.y + c.h + 34} fill={color} fontSize={24} textAnchor="end" fontFamily={FONT}>
        {xLabel}
      </text>
    ) : null}
    {yLabel ? (
      <text x={c.x} y={c.y - 14} fill={color} fontSize={24} fontFamily={FONT}>
        {yLabel}
      </text>
    ) : null}
  </>
);
