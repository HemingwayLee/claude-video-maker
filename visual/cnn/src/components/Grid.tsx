import React from "react";
import { COLORS, MONO } from "../theme";
import type { Matrix } from "../data";

type GridProps = {
  data: Matrix;
  cell: number; // size of one cell in px
  color: (v: number, r: number, c: number) => string;
  // Show the number inside each cell. A function lets you pick cells.
  showValues?: boolean | ((r: number, c: number) => boolean);
  valueOpacity?: number;
  format?: (v: number) => string;
  fontSize?: number;
  cellOpacity?: (r: number, c: number) => number;
  // Override the shown number for a cell (e.g. while it changes).
  display?: (v: number, r: number, c: number) => number;
  gap?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode; // overlays, positioned in the grid's coordinates
};

const defaultFormat = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

// A matrix drawn as colored squares, optionally with its numbers.
export const Grid: React.FC<GridProps> = ({
  data,
  cell,
  color,
  showValues = false,
  valueOpacity = 1,
  format = defaultFormat,
  fontSize,
  cellOpacity,
  display,
  gap = 2,
  style,
  children,
}) => {
  const rows = data.length;
  const cols = data[0].length;
  return (
    <div style={{ position: "relative", width: cols * cell, height: rows * cell, ...style }}>
      {data.map((row, r) =>
        row.map((v, c) => {
          const shown = display ? display(v, r, c) : v;
          const show = typeof showValues === "function" ? showValues(r, c) : showValues;
          const bright = color(shown, r, c);
          return (
            <div
              key={`${r}-${c}`}
              style={{
                position: "absolute",
                left: c * cell + gap / 2,
                top: r * cell + gap / 2,
                width: cell - gap,
                height: cell - gap,
                borderRadius: Math.min(6, cell * 0.12),
                background: bright,
                opacity: cellOpacity ? cellOpacity(r, c) : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: MONO,
                fontSize: fontSize ?? cell * 0.34,
                fontWeight: 600,
                color: textOn(bright),
              }}
            >
              {show ? <span style={{ opacity: valueOpacity }}>{format(shown)}</span> : null}
            </div>
          );
        }),
      )}
      {children}
    </div>
  );
};

// Black or white text, whichever reads better on an rgb() background.
const textOn = (bg: string) => {
  const m = bg.match(/\d+/g);
  if (!m) return COLORS.text;
  const [r, g, b] = m.map(Number);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#0b1021" : COLORS.text;
};

// A highlighted window over a grid (e.g. the kernel), in cell units.
export const Window: React.FC<{
  row: number;
  col: number;
  size: number;
  cell: number;
  color?: string;
  opacity?: number;
}> = ({ row, col, size, cell, color = COLORS.yellow, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: col * cell - 3,
      top: row * cell - 3,
      width: size * cell + 6,
      height: size * cell + 6,
      border: `5px solid ${color}`,
      borderRadius: 10,
      background: `${color}22`,
      boxShadow: `0 0 30px ${color}88`,
      opacity,
    }}
  />
);
