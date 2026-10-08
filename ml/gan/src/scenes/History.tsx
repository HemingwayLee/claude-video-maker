import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { Card } from "../components/Text";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

type Event = { year: string; name: string; note: string; line: number; color: string };
const EVENTS: Event[] = [
  { year: "2014", name: "GAN", note: "Goodfellow et al.: the original two-player idea", line: 0, color: ROLE.gen },
  { year: "2015", name: "DCGAN", note: "convolutional G and D that train reliably", line: 1, color: COLORS.orange },
  { year: "2017", name: "CycleGAN", note: "horse ↔ zebra, no paired examples", line: 1, color: COLORS.orange },
  { year: "2017", name: "ProGAN", note: "grow the image while training, up to 1024²", line: 2, color: COLORS.yellow },
  { year: "2018", name: "BigGAN", note: "large-scale, class-conditional ImageNet", line: 2, color: COLORS.yellow },
  { year: "2018", name: "StyleGAN", note: "photorealistic faces, controllable styles", line: 2, color: COLORS.yellow },
];

const AXIS_Y = 470;
const X0 = 170;
const STEP = 300;

export const History: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const axis = lerp(frame, [L[0], L[2] + 60], [0.12, 1]);

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <line x1={110} y1={AXIS_Y} x2={110 + (1800 - 110) * axis} y2={AXIS_Y} stroke={COLORS.muted} strokeWidth={4} />
      </svg>
      {EVENTS.map((e, i) => {
        const at = e.line === 0 ? L[0] + 10 : L[e.line] + 15 + (i - EVENTS.findIndex((v) => v.line === e.line)) * 35;
        const p = pop(frame, fps, at, 14);
        const x = X0 + i * STEP;
        const up = i % 2 === 0;
        return (
          <React.Fragment key={e.name}>
            <div style={{ position: "absolute", left: x - 14, top: AXIS_Y - 14, width: 28, height: 28, borderRadius: 14, background: e.color, transform: `scale(${p})` }} />
            <div
              style={{
                position: "absolute",
                left: x - 130,
                top: up ? AXIS_Y - 230 : AXIS_Y + 40,
                width: 260,
                textAlign: "center",
                opacity: Math.min(1, p),
                transform: `translateY(${(1 - Math.min(1, p)) * (up ? 20 : -20)}px)`,
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 28, color: COLORS.muted }}>{e.year}</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: e.color }}>{e.name}</div>
              <div style={{ fontSize: 22, color: COLORS.text, lineHeight: 1.3, marginTop: 4 }}>{e.note}</div>
            </div>
          </React.Fragment>
        );
      })}

      <Card x={170} y={690} w={1580} h={150} accent={COLORS.purple} opacity={fade(frame, L[3])}>
        <div style={{ padding: "20px 34px", fontSize: 28, lineHeight: 1.5 }}>
          <div>
            <span style={{ color: COLORS.purple, fontWeight: 800 }}>2021 →</span> diffusion models take the lead in image generation.
          </div>
          <div style={{ color: COLORS.muted }}>
            Adversarial losses live on: one-step generators, super-resolution, and the image tokenizers (VQGAN-style) inside many image models.
          </div>
        </div>
      </Card>
    </AbsoluteFill>
  );
};
