import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, fadeOut, lerp, linear, pop } from "../anim";
import { PixelImage } from "../components/PixelImage";
import { imageAt, TRACE } from "../data";
import { COLORS, FONT, ROLE } from "../theme";
import { useLines } from "../timeline";

// Four pictures appear out of noise; then the title.
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();
  const p = linear(frame, [L[0] + 15, L[1] + 40], [0, 1]);
  const dim = lerp(frame, [L[2] - 5, L[2] + 15], [1, 0.2]);
  const title = pop(frame, fps, L[2] + 5, 13);
  return (
    <AbsoluteFill>
      {TRACE.images.map((_, i) => (
        <PixelImage key={i} im={imageAt(i, p, "xt")} x={250 + i * 370} y={300} size={310} border={p >= 1 ? ROLE.data : ROLE.noise} opacity={dim * fade(frame, 0, 15)} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 680, textAlign: "center", fontFamily: FONT, fontSize: 34, color: COLORS.muted, opacity: dim * fadeOut(frame, L[2] - 5, 10) }}>
        t = {Math.round((1 - p) * 1000)}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", fontFamily: FONT, opacity: Math.min(1, title * 1.3), transform: `scale(${0.85 + 0.15 * title})` }}>
        <div style={{ fontSize: 150, fontWeight: 900, letterSpacing: -2 }}>
          <span style={{ color: ROLE.noise }}>Diff</span>
          <span style={{ color: ROLE.data }}>usion</span>
        </div>
        <div style={{ fontSize: 44, color: COLORS.text, fontWeight: 600, marginTop: 6 }}>how noise becomes a picture</div>
        <div style={{ fontSize: 28, color: COLORS.muted, marginTop: 22, opacity: fade(frame, L[2] + 40) }}>
          Stable Diffusion · DALL·E · Imagen · Sora
        </div>
      </div>
    </AbsoluteFill>
  );
};
