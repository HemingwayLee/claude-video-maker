import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { Grid } from "../components/Grid";
import { Label } from "../components/Text";
import { CAT } from "../data";
import { COLORS, gray, MONO } from "../theme";
import { useLines } from "../timeline";

const CELL = 46;
const SIZE = 16 * CELL; // 736

const tint = (rgb: [number, number, number]) => (v: number) =>
  `rgb(${rgb.map((x) => Math.round(18 + v * (x - 18))).join(",")})`;
const CHANNELS = [
  { name: "Blue", color: tint([72, 149, 239]), label: COLORS.blue },
  { name: "Green", color: tint([6, 214, 160]), label: COLORS.green },
  { name: "Red", color: tint([239, 71, 111]), label: COLORS.red },
];

export const Pixels: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const appear = pop(frame, fps, L[0]);
  const numbers = fade(frame, L[1], 25);
  // Line 2: the gray image shrinks to the left and becomes 3 color layers.
  const toRgb = lerp(frame, [L[2], L[2] + 25], [0, 1]);
  const spread = pop(frame, fps, L[2] + 15);

  const scale = 1 - toRgb * 0.45;
  const left = 960 - SIZE / 2 - toRgb * (960 - SIZE / 2 - 150);

  return (
    <AbsoluteFill>
      {/* gray image with its numbers */}
      <div
        style={{
          position: "absolute",
          left,
          top: 140 + toRgb * 130,
          transform: `scale(${appear * scale})`,
          transformOrigin: "top left",
        }}
      >
        <Grid data={CAT} cell={CELL} color={gray} showValues valueOpacity={numbers * (1 - toRgb)} fontSize={15} gap={2} />
      </div>
      {/* value legend */}
      <div style={{ position: "absolute", left: 1400, top: 300, opacity: numbers * (1 - toRgb) }}>
        <div style={{ width: 360, height: 40, borderRadius: 8, background: `linear-gradient(90deg, ${gray(0)}, ${gray(1)})` }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 28, color: COLORS.text, marginTop: 10 }}>
          <span>0 black</span>
          <span>1 white</span>
        </div>
        <div style={{ fontSize: 30, color: COLORS.muted, marginTop: 40, lineHeight: 1.4 }}>
          16 × 16 pixels
          <br />= 256 numbers
        </div>
      </div>

      {/* RGB: three stacked grids */}
      <div style={{ position: "absolute", left: 900, top: 230, opacity: toRgb }}>
        {CHANNELS.map((ch, i) => {
          const offset = (2 - i) * 70 * spread; // red in front
          const top = -offset * 0.8 + 140;
          return (
            <React.Fragment key={ch.name}>
              <div style={{ position: "absolute", left: offset, top }}>
                <Grid data={CAT} cell={24} color={ch.color} gap={1} style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.6)" }} />
              </div>
              <Label x={600} y={top + 150} size={30} weight={700} color={ch.label} opacity={spread}>
                {ch.name}
              </Label>
            </React.Fragment>
          );
        })}
      </div>
      <Label x={1080} y={810} size={36} weight={600} mono center opacity={fade(frame, L[2] + 40)}>
        height × width × <span style={{ color: COLORS.yellow }}>3 channels</span>
      </Label>
    </AbsoluteFill>
  );
};
