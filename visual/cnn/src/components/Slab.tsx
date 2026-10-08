import React from "react";

// A layer volume drawn as a 3-D slab, the classic CNN diagram shape.
// `h` is the spatial size (height and depth), `t` the number of channels
// (thickness). (x, y) is the top-left corner of the front face.
export const Slab: React.FC<{
  x: number;
  y: number;
  h: number;
  t: number;
  color: string;
  opacity?: number;
  glow?: number; // 0..1
}> = ({ x, y, h, t, color, opacity = 1, glow = 0 }) => {
  const d = h * 0.45;
  const pts = (p: number[][]) => p.map(([a, b]) => `${a},${b}`).join(" ");
  return (
    <svg
      width={1920}
      height={1080}
      style={{ position: "absolute", left: 0, top: 0, opacity, filter: glow > 0 ? `drop-shadow(0 0 ${20 * glow}px ${color})` : undefined }}
    >
      {/* side */}
      <polygon points={pts([[x + t, y], [x + t + d, y - d], [x + t + d, y + h - d], [x + t, y + h]])} fill={color} fillOpacity={0.45} stroke={color} strokeWidth={2} />
      {/* top */}
      <polygon points={pts([[x, y], [x + t, y], [x + t + d, y - d], [x + d, y - d]])} fill={color} fillOpacity={0.7} stroke={color} strokeWidth={2} />
      {/* front */}
      <rect x={x} y={y} width={t} height={h} fill={color} fillOpacity={0.9} stroke={color} strokeWidth={2} />
    </svg>
  );
};
