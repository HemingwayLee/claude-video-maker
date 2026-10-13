import React, { useLayoutEffect, useRef } from "react";
import { COLORS, FONT } from "../theme";

// A 2-D scatter plot drawn on a canvas (fast enough for thousands of points).
// The view shows world coordinates [-range, range]² in a square of `size` px.
export type Layer = {
  points: ArrayLike<number>; // [x0, y0, x1, y1, …]
  color: string;
  radius?: number;
  alpha?: number;
  colors?: string[]; // one color per point, overrides `color`
};
export type Lines = { paths: ArrayLike<number>[]; color: string; width?: number; alpha?: number };
export type Arrows = { at: ArrayLike<number>; dir: ArrayLike<number>; color: string; scale: number; alpha?: number };

export const PointCloud: React.FC<{
  x: number;
  y: number;
  size: number;
  range?: number;
  layers: Layer[];
  lines?: Lines[];
  arrows?: Arrows[];
  border?: string;
  label?: React.ReactNode;
  labelColor?: string;
  opacity?: number;
  axes?: boolean;
}> = ({ x, y, size, range = 3, layers, lines = [], arrows = [], border = COLORS.panelBorder, label, labelColor = COLORS.text, opacity = 1, axes = true }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const dpr = 2; // draw at 2× for crisp dots
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const px = (v: number) => size / 2 + (v / range) * (size / 2);
    const py = (v: number) => size / 2 - (v / range) * (size / 2);
    if (axes) {
      ctx.strokeStyle = "rgba(141,151,196,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px(-range), py(0));
      ctx.lineTo(px(range), py(0));
      ctx.moveTo(px(0), py(-range));
      ctx.lineTo(px(0), py(range));
      ctx.stroke();
    }
    for (const l of lines) {
      ctx.strokeStyle = l.color;
      ctx.globalAlpha = l.alpha ?? 0.5;
      ctx.lineWidth = l.width ?? 1.5;
      for (const p of l.paths) {
        ctx.beginPath();
        for (let i = 0; i + 1 < p.length; i += 2) (i === 0 ? ctx.moveTo : ctx.lineTo).call(ctx, px(p[i]), py(p[i + 1]));
        ctx.stroke();
      }
    }
    for (const a of arrows) {
      ctx.strokeStyle = a.color;
      ctx.fillStyle = a.color;
      ctx.globalAlpha = a.alpha ?? 0.9;
      ctx.lineWidth = 2;
      for (let i = 0; i + 1 < a.at.length; i += 2) {
        const x0 = px(a.at[i]);
        const y0 = py(a.at[i + 1]);
        const dx = a.dir[i] * a.scale;
        const dy = -a.dir[i + 1] * a.scale;
        const len = Math.hypot(dx, dy);
        if (len < 0.5) continue;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + dx, y0 + dy);
        ctx.stroke();
        const ux = dx / len;
        const uy = dy / len;
        const h = Math.min(7, len * 0.5);
        ctx.beginPath();
        ctx.moveTo(x0 + dx, y0 + dy);
        ctx.lineTo(x0 + dx - ux * h - uy * h * 0.6, y0 + dy - uy * h + ux * h * 0.6);
        ctx.lineTo(x0 + dx - ux * h + uy * h * 0.6, y0 + dy - uy * h - ux * h * 0.6);
        ctx.fill();
      }
    }
    for (const l of layers) {
      ctx.globalAlpha = l.alpha ?? 0.8;
      const r = l.radius ?? 2.2;
      for (let i = 0; i + 1 < l.points.length; i += 2) {
        ctx.fillStyle = l.colors ? l.colors[i / 2] : l.color;
        ctx.beginPath();
        ctx.arc(px(l.points[i]), py(l.points[i + 1]), r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: size, height: size, opacity }}>
      <canvas ref={ref} width={size * 2} height={size * 2} style={{ width: size, height: size, borderRadius: 14, background: "rgba(5,8,20,0.55)", border: `2px solid ${border}`, display: "block" }} />
      {label !== undefined && (
        <div style={{ position: "absolute", left: -40, right: -40, top: -44, textAlign: "center", fontFamily: FONT, fontSize: 26, fontWeight: 700, color: labelColor, whiteSpace: "nowrap" }}>{label}</div>
      )}
    </div>
  );
};
