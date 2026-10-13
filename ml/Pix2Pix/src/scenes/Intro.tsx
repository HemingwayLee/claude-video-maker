import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, fadeOut, lerp, pop } from "../anim";
import { TaskPair } from "../components/TaskArt";
import { Label } from "../components/Text";
import { COLORS, FONT, ROLE } from "../theme";
import { useLines } from "../timeline";

// Sketch → photo, map → satellite, day → night, B&W → color; then the title.
const PAIRS = [
  { index: 3, x: 315, y: 170 },
  { index: 2, x: 1115, y: 170 },
  { index: 5, x: 315, y: 520 },
  { index: 6, x: 1115, y: 520 },
];

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();
  const step = (L[1] - L[0]) / 4.6; // one pair per phrase of line 0
  const dim = lerp(frame, [L[2] - 5, L[2] + 15], [1, 0.18]);
  const title = pop(frame, fps, L[2] + 5, 13);
  return (
    <AbsoluteFill>
      {PAIRS.map((p, i) => (
        <TaskPair key={i} index={p.index} x={p.x} y={p.y} size={210} scale={pop(frame, fps, L[0] + i * step, 14)} opacity={dim} showArrow={fade(frame, L[0] + i * step + 12, 12)} />
      ))}
      <Label x={960} y={880} size={46} weight={800} center color={ROLE.input} opacity={fade(frame, L[1] + 10) * fadeOut(frame, L[2] - 5, 12)}>
        image <span style={{ color: COLORS.text }}>→</span> image translation
      </Label>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 300,
          textAlign: "center",
          fontFamily: FONT,
          opacity: Math.min(1, title * 1.3),
          transform: `scale(${0.85 + 0.15 * title})`,
        }}
      >
        <div style={{ fontSize: 170, fontWeight: 900, letterSpacing: -2 }}>
          <span style={{ color: ROLE.input }}>Pix</span>
          <span style={{ color: COLORS.text }}>2</span>
          <span style={{ color: ROLE.gen }}>Pix</span>
        </div>
        <div style={{ fontSize: 40, color: COLORS.text, marginTop: 10, fontWeight: 600 }}>Image-to-Image Translation with Conditional Adversarial Networks</div>
        <div style={{ fontSize: 30, color: COLORS.muted, marginTop: 18, opacity: fade(frame, L[2] + 40) }}>
          Phillip Isola, Jun-Yan Zhu, Tinghui Zhou, Alexei A. Efros · UC Berkeley · CVPR 2017
        </div>
      </div>
    </AbsoluteFill>
  );
};
