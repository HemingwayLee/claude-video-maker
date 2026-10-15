import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, pop } from "../anim";
import { Grid } from "../components/Grid";
import { Label } from "../components/Text";
import { CAT } from "../data";
import { COLORS, gray } from "../theme";
import { useLines } from "../timeline";

const CHIPS = [
  { text: "Convolution", color: COLORS.yellow },
  { text: "ReLU", color: COLORS.green },
  { text: "Pooling", color: COLORS.cyan },
  { text: "Fully connected", color: COLORS.magenta },
];

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const cat = pop(frame, fps, L[0]);
  const question = pop(frame, fps, L[0] + 20, 10);
  const title = pop(frame, fps, L[1], 16);

  return (
    <AbsoluteFill>
      {/* the photo */}
      <div
        style={{
          position: "absolute",
          left: 200,
          top: 300,
          transform: `scale(${cat})`,
          padding: 18,
          borderRadius: 24,
          background: COLORS.panel,
          border: `2px solid ${COLORS.panelBorder}`,
        }}
      >
        <Grid data={CAT} cell={26} color={gray} gap={1} />
      </div>
      <Label x={640} y={240} size={150} weight={800} color={COLORS.yellow} opacity={question} style={{ transform: `scale(${question}) rotate(12deg)` }}>
        ?
      </Label>

      {/* the title */}
      <div style={{ position: "absolute", left: 820, top: 280, opacity: title, transform: `translateY(${(1 - title) * 40}px)` }}>
        <div style={{ fontSize: 34, fontWeight: 600, color: COLORS.cyan, letterSpacing: 6, fontFamily: "inherit" }}>
          HOW COMPUTERS LEARN TO SEE
        </div>
        <div style={{ fontSize: 104, fontWeight: 800, color: COLORS.text, lineHeight: 1.02, marginTop: 16 }}>
          Convolutional
          <br />
          Neural Networks
        </div>
        <div style={{ fontSize: 44, fontWeight: 600, color: COLORS.muted, marginTop: 18 }}>
          a.k.a. <span style={{ color: COLORS.yellow }}>CNN</span>
        </div>
      </div>

      {/* the building blocks we will meet */}
      <div style={{ position: "absolute", left: 820, top: 700, display: "flex", gap: 18 }}>
        {CHIPS.map((chip, i) => {
          const p = pop(frame, fps, L[2] + i * 8);
          return (
            <div
              key={chip.text}
              style={{
                padding: "12px 24px",
                borderRadius: 40,
                border: `3px solid ${chip.color}`,
                color: chip.color,
                fontSize: 30,
                fontWeight: 700,
                opacity: Math.min(1, p),
                transform: `scale(${p})`,
              }}
            >
              {chip.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
