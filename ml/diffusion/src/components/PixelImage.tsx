import React, { useLayoutEffect, useRef } from "react";
import { type Img, RES } from "../data";
import { COLORS, FONT } from "../theme";

// A small RGB image (48×48) scaled up with crisp square pixels.
export const PixelImage: React.FC<{
  im: Img;
  x: number;
  y: number;
  size: number;
  border?: string;
  label?: React.ReactNode;
  labelColor?: string;
  opacity?: number;
  style?: React.CSSProperties;
}> = ({ im, x, y, size, border, label, labelColor = COLORS.muted, opacity = 1, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const data = ctx.createImageData(RES, RES);
    const n = RES * RES;
    const v = (k: number) => (im.float ? Math.round(Math.max(0, Math.min(1, (im.data[k] + 1) / 2)) * 255) : im.data[k]);
    for (let p = 0; p < n; p++) data.data.set([v(p), v(n + p), v(2 * n + p), 255], p * 4);
    ctx.putImageData(data, 0, 0);
  }, [im]);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: size, height: size, opacity, ...style }}>
      <canvas
        ref={ref}
        width={RES}
        height={RES}
        style={{ width: size, height: size, imageRendering: "pixelated", borderRadius: 6, outline: border ? `4px solid ${border}` : undefined, outlineOffset: 3, display: "block" }}
      />
      {label !== undefined && (
        <div style={{ position: "absolute", left: -60, right: -60, top: -44, textAlign: "center", fontFamily: FONT, fontSize: 26, fontWeight: 700, color: labelColor, whiteSpace: "nowrap" }}>{label}</div>
      )}
    </div>
  );
};
