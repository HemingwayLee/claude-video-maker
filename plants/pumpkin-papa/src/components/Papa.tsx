import React from "react";
import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import poses from "../../public/papa/poses.json";
import { pop } from "../anim";

// The man from /tobeused/papa. Each pose is a cut-out sticker in
// public/papa/ (made by `npm run papa`). He comes alive with springy pose
// changes, a little hop when he starts talking and a slow idle sway.
//
// He can also hold something: `prop` is drawn *behind* the sticker at a hand
// position, so his fist covers the handle and the rest sticks out. That is
// how he holds the scissors, which no pose in the sheet has.

export type Pose = keyof typeof poses;

// Where his fists are in a pose, as a fraction of the image (x, y).
export const HANDS: Partial<Record<Pose, { right: [number, number]; left?: [number, number] }>> = {
  fist: { right: [0.86, 0.33], left: [0.11, 0.4] },
  cheer: { right: [0.88, 0.28], left: [0.12, 0.28] },
};

export const Papa: React.FC<{
  // [start frame, pose] keys, in order; the first one is when he enters.
  poses: [number, Pose][];
  x: number; // bottom center, video pixels
  y: number;
  height: number;
  hops?: number[]; // frames where he hops (e.g. line starts)
  from?: "bottom" | "left" | "right";
  // Drawn in his right fist (SVG, around (0, 0), in image pixels at this height).
  prop?: React.ReactNode;
}> = ({ poses: keys, x, y, height, hops = [], from = "bottom", prop }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = keys[0][0];
  if (frame < enter) return null;

  let current = keys[0];
  for (const k of keys) if (frame >= k[0]) current = k;
  const pose = current[1];
  const [pw, ph] = poses[pose];
  const width = (pw / ph) * height;

  const inP = spring({ frame: frame - enter, fps, config: { damping: 13 } });
  const swap = current[0] === enter ? 1 : pop(frame, fps, current[0], 9);
  const off = (1 - inP) * 900;
  const dx = from === "left" ? -off : from === "right" ? off : 0;
  const dy = from === "bottom" ? off : 0;
  const hop = hops.reduce((h, f) => {
    const t = frame - f;
    return t >= 0 && t < 12 ? Math.max(h, Math.sin((t / 12) * Math.PI) * 26) : h;
  }, 0);
  const sway = Math.sin(frame / 22) * 1.6;
  const squash = 0.88 + 0.12 * swap;
  const hand = HANDS[pose]?.right;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        transform: `translate(${dx}px, ${dy - hop}px) translate(-50%, -100%) rotate(${sway}deg) scale(${2 - squash}, ${squash})`,
        transformOrigin: "50% 100%",
        filter: "drop-shadow(0 14px 16px rgba(58,38,24,0.25))",
      }}
    >
      {prop && hand && (
        <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <g transform={`translate(${hand[0] * width} ${hand[1] * height})`}>{prop}</g>
        </svg>
      )}
      <Img src={staticFile(`papa/${pose}.png`)} style={{ position: "absolute", left: 0, top: 0, width, height }} />
    </div>
  );
};
