import React from "react";
import { COLORS, FONT, MONO, ROLE } from "../theme";

// The condition y, drawn as a yellow tag: "y = glasses".
export const YTag: React.FC<{ x: number; y: number; text: string; opacity?: number; color?: string; size?: number; style?: React.CSSProperties }> = ({
  x,
  y,
  text,
  opacity = 1,
  color = ROLE.label,
  size = 28,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      padding: "6px 16px",
      borderRadius: 10,
      border: `3px solid ${color}`,
      background: `${color}22`,
      fontFamily: FONT,
      fontSize: size,
      fontWeight: 700,
      color: COLORS.text,
      whiteSpace: "nowrap",
      opacity,
      ...style,
    }}
  >
    <i style={{ color, fontWeight: 800 }}>y</i> = {text}
  </div>
);

// A one-hot vector: one cell per class, the chosen one lit.
export const OneHot: React.FC<{
  x: number;
  y: number;
  n: number;
  hot: number;
  cell?: number;
  horizontal?: boolean;
  labels?: string[];
  opacity?: number;
}> = ({ x, y, n, hot, cell = 30, horizontal, labels, opacity = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", flexDirection: horizontal ? "row" : "column", gap: 3, opacity }}>
    {Array.from({ length: n }, (_, i) => (
      <div key={i} style={{ display: "flex", flexDirection: horizontal ? "column" : "row", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: cell,
            height: cell - 3,
            borderRadius: 5,
            background: i === hot ? ROLE.label : COLORS.panel,
            border: `2px solid ${ROLE.label}`,
            fontFamily: MONO,
            fontSize: cell * 0.5,
            fontWeight: 700,
            color: i === hot ? COLORS.bg : COLORS.muted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {i === hot ? 1 : 0}
        </div>
        {labels ? <div style={{ fontFamily: FONT, fontSize: cell * 0.6, color: i === hot ? ROLE.label : COLORS.muted, whiteSpace: "nowrap" }}>{labels[i]}</div> : null}
      </div>
    ))}
  </div>
);
