import React from "react";
import { AbsoluteFill } from "remotion";
import { INK } from "../theme";

// SVG filters shared by every scene, defined once in an invisible <svg>.
//   #sticker: a white border around the shape + a soft shadow under it,
//             like the man's stickers.
//   #soft:    only the soft shadow.
export const StickerDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <filter id="sticker" x="-30%" y="-30%" width="160%" height="160%">
        <feMorphology in="SourceAlpha" operator="dilate" radius={8} result="grown" />
        <feFlood floodColor="#ffffff" />
        <feComposite in2="grown" operator="in" result="border" />
        <feGaussianBlur in="grown" stdDeviation={9} />
        <feOffset dy={10} result="blurred" />
        <feFlood floodColor={INK} floodOpacity={0.22} />
        <feComposite in2="blurred" operator="in" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="border" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation={8} />
        <feOffset dy={8} result="blurred" />
        <feFlood floodColor={INK} floodOpacity={0.2} />
        <feComposite in2="blurred" operator="in" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  </svg>
);

// A full-screen SVG in video pixels (1080 × 1920).
export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ overflow: "visible" }}>
      {children}
    </svg>
  </AbsoluteFill>
);

// Places a drawing at (x, y) with a scale and rotation, wrapped in the
// sticker border. The filter sits outside the scale so every sticker gets
// the same border width whatever its size.
export const Sticker: React.FC<{
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  opacity?: number;
  border?: boolean;
  children: React.ReactNode;
}> = ({ x, y, scale = 1, rotate = 0, opacity = 1, border = true, children }) => {
  if (scale <= 0.001 || opacity <= 0.001) return null;
  return (
    <g filter={border ? "url(#sticker)" : "url(#soft)"} opacity={opacity}>
      <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>{children}</g>
    </g>
  );
};
