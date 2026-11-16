import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { COLORS, INK, outline } from "../theme";

// Sticker-style text: bold, dark brown, with a thick white border. Used
// only where words are really needed (names, places, months).
export const Label: React.FC<{
  x: number; // center, video pixels
  y: number;
  at: number; // frame it pops in
  size?: number;
  color?: string;
  rotate?: number;
  until?: number; // frame it pops out
  children: React.ReactNode;
}> = ({ x, y, at, size = 72, color = INK, rotate = 0, until, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, at, 11) * (until === undefined ? 1 : 1 - pop(frame, fps, until, 200));
  if (s <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${s})`,
        fontSize: size,
        fontWeight: 900,
        color,
        whiteSpace: "nowrap",
        letterSpacing: size * 0.04,
        textShadow: `${outline(COLORS.white, size * 0.11)}, 0 ${size * 0.16}px ${size * 0.2}px rgba(58,38,24,0.3)`,
      }}
    >
      {children}
    </div>
  );
};
