import React, { useLayoutEffect, useRef } from "react";
import { type Img, SIZE } from "../data";
import { COLORS, FONT } from "../theme";

// A 32×32 image from the training run, scaled up with crisp square pixels.
// Optional: a colored border, a caption above, and an 8×8 overlay grid of
// PatchGAN scores (0 = fake → red, 1 = real → green).

export const PixelImage: React.FC<{
  im: Img;
  x: number;
  y: number;
  size: number;
  border?: string;
  label?: React.ReactNode;
  labelColor?: string;
  opacity?: number;
  patches?: number[];
  patchOpacity?: number;
  grid?: number; // draw a grid with this many cells per side (e.g. to show pixels)
  style?: React.CSSProperties;
}> = ({ im, x, y, size, border, label, labelColor = COLORS.muted, opacity = 1, patches, patchOpacity = 1, grid, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const data = ctx.createImageData(SIZE, SIZE);
    const n = SIZE * SIZE;
    for (let p = 0; p < n; p++) {
      const [r, g, b] = im.channels === 1 ? [im.data[p], im.data[p], im.data[p]] : [im.data[p], im.data[n + p], im.data[2 * n + p]];
      data.data.set([r, g, b, 255], p * 4);
    }
    ctx.putImageData(data, 0, 0);
  }, [im]);
  const cells = patches ? Math.round(Math.sqrt(patches.length)) : 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: size, height: size, opacity, ...style }}>
      <canvas
        ref={ref}
        width={SIZE}
        height={SIZE}
        style={{
          width: size,
          height: size,
          imageRendering: "pixelated",
          borderRadius: 6,
          outline: border ? `4px solid ${border}` : undefined,
          outlineOffset: 3,
          display: "block",
        }}
      />
      {patches && patchOpacity > 0 && (
        <svg width={size} height={size} style={{ position: "absolute", left: 0, top: 0, opacity: patchOpacity }}>
          {patches.map((v, i) => {
            const cx = i % cells;
            const cy = Math.floor(i / cells);
            const s = size / cells;
            const col = v >= 0.5 ? `rgba(6,214,160,${0.25 + 0.6 * (v - 0.5) * 2})` : `rgba(239,71,111,${0.25 + 0.6 * (0.5 - v) * 2})`;
            return <rect key={i} x={cx * s + 1} y={cy * s + 1} width={s - 2} height={s - 2} fill={col} rx={3} />;
          })}
        </svg>
      )}
      {grid && (
        <svg width={size} height={size} style={{ position: "absolute", left: 0, top: 0 }}>
          {Array.from({ length: grid + 1 }, (_, i) => (
            <React.Fragment key={i}>
              <line x1={(i * size) / grid} y1={0} x2={(i * size) / grid} y2={size} stroke="rgba(0,0,0,0.25)" strokeWidth={1} />
              <line x1={0} y1={(i * size) / grid} x2={size} y2={(i * size) / grid} stroke="rgba(0,0,0,0.25)" strokeWidth={1} />
            </React.Fragment>
          ))}
        </svg>
      )}
      {label !== undefined && (
        <div
          style={{
            position: "absolute",
            left: -40,
            right: -40,
            top: -46,
            textAlign: "center",
            fontFamily: FONT,
            fontSize: 26,
            fontWeight: 700,
            color: labelColor,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};
