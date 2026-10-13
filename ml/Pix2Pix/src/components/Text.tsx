import React from "react";
import { COLORS, FONT, MONO } from "../theme";

// Absolutely positioned text; `x`, `y` are its top-left corner unless `center`.
export const Label: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  color?: string;
  weight?: number;
  mono?: boolean;
  center?: boolean;
  opacity?: number;
  width?: number;
  style?: React.CSSProperties;
}> = ({ x, y, children, size = 32, color = COLORS.text, weight = 500, mono, center, opacity = 1, width, style }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width,
      transform: center ? "translateX(-50%)" : undefined,
      textAlign: center ? "center" : undefined,
      fontFamily: mono ? MONO : FONT,
      fontSize: size,
      fontWeight: weight,
      color,
      opacity,
      whiteSpace: width ? undefined : "nowrap",
      lineHeight: 1.25,
      ...style,
    }}
  >
    {children}
  </div>
);

// A rounded card.
export const Card: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  children?: React.ReactNode;
  opacity?: number;
  accent?: string;
  style?: React.CSSProperties;
}> = ({ x, y, w, h, children, opacity = 1, accent, style }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 20,
      background: COLORS.panel,
      border: `2px solid ${accent ?? COLORS.panelBorder}`,
      boxShadow: accent ? `0 0 40px ${accent}33` : undefined,
      opacity,
      ...style,
    }}
  >
    {children}
  </div>
);
