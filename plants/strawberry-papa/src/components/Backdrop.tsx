import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { MOODS, type Mood } from "../theme";

// The blurry, glowing background of the stickers: a soft gradient with big
// out-of-focus light blobs drifting slowly. `to` + `mix` (0 → 1) blend into a
// second mood, for a scene that changes weather.

const BLOBS = [
  { x: 0.15, y: 0.12, r: 260, c: 2, sp: 0.7 },
  { x: 0.85, y: 0.2, r: 300, c: 3, sp: 1.1 },
  { x: 0.55, y: 0.42, r: 220, c: 4, sp: 0.9 },
  { x: 0.1, y: 0.62, r: 320, c: 5, sp: 1.3 },
  { x: 0.9, y: 0.7, r: 260, c: 2, sp: 0.8 },
  { x: 0.4, y: 0.9, r: 340, c: 3, sp: 1.0 },
  { x: 0.7, y: 0.05, r: 180, c: 5, sp: 1.2 },
];

export const Backdrop: React.FC<{ mood: Mood; to?: Mood; mix?: number }> = ({ mood, to, mix = 0 }) => {
  const frame = useCurrentFrame();
  const a = MOODS[mood];
  const b = MOODS[to ?? mood];
  const col = (i: number) => interpolateColors(mix, [0, 1], [a[i], b[i]]);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${col(0)} 0%, ${col(1)} 100%)`, overflow: "hidden" }}>
      {BLOBS.map((o, i) => {
        const t = frame / 30;
        const x = o.x * 1080 + Math.sin(t * 0.35 * o.sp + i) * 40 - o.r;
        const y = o.y * 1920 + Math.cos(t * 0.3 * o.sp + i * 2) * 50 - o.r;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: o.r * 2,
              height: o.r * 2,
              borderRadius: "50%",
              background: col(o.c),
              opacity: 0.55,
              filter: "blur(70px)",
            }}
          />
        );
      })}
      {/* small sharp-ish sparkles of light, like the bokeh in the sticker sheet */}
      {Array.from({ length: 14 }, (_, i) => {
        const x = ((i * 397) % 1000) + 40;
        const y = ((i * 733) % 1800) + 60 + Math.sin(frame / 40 + i) * 20;
        const r = 14 + ((i * 7) % 20);
        return (
          <div
            key={`d${i}`}
            style={{
              position: "absolute",
              left: x - r,
              top: y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: "#fff",
              opacity: 0.25 + 0.15 * Math.sin(frame / 25 + i * 1.7),
              filter: "blur(6px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
