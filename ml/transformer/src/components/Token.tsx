import React from "react";
import { COLORS, FONT, ROLE } from "../theme";

// A token drawn as a rounded chip. (x, y) is its top-left corner.
export const Chip: React.FC<{
  x: number;
  y: number;
  text: string;
  w?: number;
  h?: number;
  color?: string;
  fill?: number; // 0..1 how strongly the chip is filled with its color
  opacity?: number;
  size?: number;
  style?: React.CSSProperties;
}> = ({ x, y, text, w = 130, h = 56, color = ROLE.token, fill = 0.15, opacity = 1, size = 28, style }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 12,
      border: `3px solid ${color}`,
      background: `${color}${Math.round(Math.max(0, Math.min(1, fill)) * 255)
        .toString(16)
        .padStart(2, "0")}`,
      boxShadow: fill > 0.5 ? `0 0 ${24 * fill}px ${color}` : undefined,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: FONT,
      fontSize: size,
      fontWeight: 700,
      color: fill > 0.6 ? COLORS.bg : COLORS.text,
      opacity,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {text}
  </div>
);
