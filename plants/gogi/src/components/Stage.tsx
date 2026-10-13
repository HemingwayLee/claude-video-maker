import React from "react";
import { AbsoluteFill } from "remotion";

// A full-screen 1920×1080 SVG layer to draw scene objects in.
export const Stage: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={style}>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ overflow: "visible" }}>
      {children}
    </svg>
  </AbsoluteFill>
);
