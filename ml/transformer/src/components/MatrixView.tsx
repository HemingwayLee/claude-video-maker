import React from "react";
import { COLORS, FONT, MONO } from "../theme";
import type { Matrix } from "../data";

// A matrix drawn as a grid of cells, with optional row / column labels.
export const MatrixView: React.FC<{
  m: Matrix;
  x: number;
  y: number;
  cell: number;
  color: (v: number, r: number, c: number) => string;
  format?: (v: number) => string;
  showValues?: boolean | ((r: number, c: number) => boolean);
  rowLabels?: string[];
  colLabels?: string[];
  labelColor?: string;
  cellOpacity?: (r: number, c: number) => number;
  highlightRow?: number;
  highlightColor?: string;
  title?: React.ReactNode;
  titleColor?: string;
  opacity?: number;
  fontSize?: number;
}> = ({ m, x, y, cell, color, format = (v) => v.toFixed(2), showValues = true, rowLabels, colLabels, labelColor = COLORS.muted, cellOpacity, highlightRow, highlightColor = COLORS.yellow, title, titleColor = COLORS.text, opacity = 1, fontSize }) => {
  const rows = m.length;
  const cols = m[0].length;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity }}>
      {title ? (
        <div style={{ position: "absolute", left: 0, top: (colLabels ? -34 : 0) - 44, width: cols * cell, textAlign: "center", fontFamily: FONT, fontSize: 28, fontWeight: 800, color: titleColor, whiteSpace: "nowrap" }}>{title}</div>
      ) : null}
      {colLabels?.map((l, c) => (
        <div key={`c${c}`} style={{ position: "absolute", left: c * cell, top: -32, width: cell, textAlign: "center", fontFamily: FONT, fontSize: Math.min(22, cell * 0.36), color: labelColor, whiteSpace: "nowrap" }}>
          {l}
        </div>
      ))}
      {rowLabels?.map((l, r) => (
        <div key={`r${r}`} style={{ position: "absolute", left: -110, top: r * cell, width: 100, height: cell, display: "flex", alignItems: "center", justifyContent: "flex-end", fontFamily: FONT, fontSize: Math.min(22, cell * 0.38), color: highlightRow === r ? highlightColor : labelColor, fontWeight: highlightRow === r ? 800 : 500 }}>
          {l}
        </div>
      ))}
      {m.map((row, r) =>
        row.map((v, c) => {
          const show = typeof showValues === "function" ? showValues(r, c) : showValues;
          const bg = color(v, r, c);
          return (
            <div
              key={`${r}-${c}`}
              style={{
                position: "absolute",
                left: c * cell + 2,
                top: r * cell + 2,
                width: cell - 4,
                height: cell - 4,
                borderRadius: 6,
                background: bg,
                opacity: cellOpacity ? cellOpacity(r, c) : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: MONO,
                fontSize: fontSize ?? cell * 0.28,
                fontWeight: 600,
                color: textOn(bg),
              }}
            >
              {show ? format(v) : null}
            </div>
          );
        }),
      )}
      {highlightRow !== undefined ? (
        <div style={{ position: "absolute", left: -4, top: highlightRow * cell - 2, width: cols * cell + 8, height: cell + 4, border: `4px solid ${highlightColor}`, borderRadius: 10, boxShadow: `0 0 20px ${highlightColor}88` }} />
      ) : null}
      <div style={{ width: cols * cell, height: rows * cell }} />
    </div>
  );
};

// Dark or light text, whichever reads better on an rgb() background.
const textOn = (bg: string) => {
  const m = bg.match(/\d+/g);
  if (!m) return COLORS.text;
  const [r, g, b] = m.map(Number);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#0b1021" : COLORS.text;
};
