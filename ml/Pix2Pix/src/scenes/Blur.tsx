import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, fadeOut, lerp } from "../anim";
import { Arrow, Layer } from "../components/Diagram";
import { PixelImage } from "../components/PixelImage";
import { Label } from "../components/Text";
import { average, finalOutput, PHASES, pixel, SIZE, TEST_INPUTS } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

// The four right answers for one outline (stripes at 4 positions), what L1
// does with a pixel that is dark in half of them, and the blurry result.
const AVG = average(PHASES);
const PX = { row: 14, col: 16 }; // light, light, dark, dark across the 4 answers
const rgb = (c: number[]) => `rgb(${c.join(",")})`;

export const Blur: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const size = 200;
  const ax = (i: number) => 640 + i * 280; // the four answers
  const answersY = lerp(frame, [L[4] - 5, L[4] + 20], [330, 170]);
  const answersSize = lerp(frame, [L[4] - 5, L[4] + 20], [size, 130]);
  const marker = fade(frame, L[3] + 10) * fadeOut(frame, L[4], 10);
  const colors = PHASES.map((p) => pixel(p, PX.row, PX.col));
  const mean = colors[0].map((_, k) => Math.round(colors.reduce((s, c) => s + c[k], 0) / colors.length));
  return (
    <AbsoluteFill>
      <Label x={960} y={150} size={40} mono center color={ROLE.l1} opacity={fade(frame, L[0]) * fadeOut(frame, L[1] + 20, 12)}>
        L1 = mean | y − G(x) |
      </Label>
      <Label x={960} y={215} size={26} center color={COLORS.muted} opacity={fade(frame, L[0] + 20) * fadeOut(frame, L[1] + 20, 12)}>
        the average pixel difference between the answer and the truth
      </Label>

      {/* the input */}
      <PixelImage im={TEST_INPUTS[0]} x={150} y={330} size={size} border={ROLE.input} label="input x" labelColor={ROLE.input} opacity={fade(frame, L[1]) * fadeOut(frame, L[4], 10)} />
      <Layer opacity={fade(frame, L[1] + 15) * fadeOut(frame, L[4], 10)}>
        <Arrow id="b1" d="M 380 430 L 600 430" />
      </Layer>
      {/* the right answers */}
      {PHASES.map((p, i) => {
        const show = i === 1 ? fade(frame, L[1] + 20) : fade(frame, L[2] + 10 + i * 10);
        const x = lerp(frame, [L[4] - 5, L[4] + 20], [ax(i), 655 + i * 160]);
        return (
          <React.Fragment key={i}>
            <PixelImage im={p} x={x} y={answersY} size={answersSize} border={ROLE.real} opacity={show} />
            <Label x={x + answersSize / 2} y={answersY + answersSize + 14} size={26} weight={800} color={ROLE.real} center opacity={fade(frame, L[2] + 20 + i * 10) * fadeOut(frame, L[4], 10)}>
              ✓ right
            </Label>
            {/* the pixel we follow */}
            <div
              style={{
                position: "absolute",
                left: x + (PX.col * answersSize) / SIZE - 4,
                top: answersY + (PX.row * answersSize) / SIZE - 4,
                width: answersSize / SIZE + 8,
                height: answersSize / SIZE + 8,
                border: `3px solid ${COLORS.text}`,
                borderRadius: 3,
                opacity: marker,
              }}
            />
          </React.Fragment>
        );
      })}
      {/* one pixel, four answers */}
      <AbsoluteFill style={{ opacity: marker }}>
        <Label x={250} y={640} size={28} weight={700}>
          one pixel in the 4 right answers:
        </Label>
        {colors.map((c, i) => (
          <div key={i} style={{ position: "absolute", left: ax(i) + 60, top: 625, width: 80, height: 80, borderRadius: 10, background: rgb(c), border: `3px solid ${COLORS.text}` }} />
        ))}
        <Label x={250} y={760} size={28} weight={700} opacity={fade(frame, L[3] + 70)}>
          L1's safest bet: in between
        </Label>
        <div style={{ position: "absolute", left: ax(1) + 200, top: 745, width: 80, height: 80, borderRadius: 10, background: rgb(mean), border: `3px dashed ${ROLE.l1}`, opacity: fade(frame, L[3] + 70) }} />
        <Label x={ax(1) + 300} y={768} size={24} mono color={ROLE.l1} opacity={fade(frame, L[3] + 80)}>
          ← any value in between costs L1 the same
        </Label>
      </AbsoluteFill>
      {/* the result: blur */}
      <AbsoluteFill style={{ opacity: fade(frame, L[4] + 10) }}>
        <Label x={960} y={135} size={24} color={COLORS.muted} center>
          the 4 right answers
        </Label>
        <Layer>
          <Arrow id="b2" d="M 960 345 L 760 420" color={ROLE.l1} progress={lerp(frame, [L[4] + 15, L[4] + 35], [0, 1])} />
          <Arrow id="b3" d="M 960 345 L 1160 420" color={ROLE.l1} progress={lerp(frame, [L[4] + 45, L[4] + 65], [0, 1])} />
        </Layer>
        <PixelImage im={AVG} x={560} y={480} size={300} border={ROLE.l1} label="their average" labelColor={ROLE.l1} />
        <PixelImage im={finalOutput("l1", 0)} x={1060} y={480} size={300} border={ROLE.l1} label="our L1-trained network" labelColor={ROLE.l1} opacity={fade(frame, L[4] + 50)} />
        <Label x={960} y={815} size={30} weight={700} center opacity={fade(frame, L[4] + 70)}>
          blurry · matches <span style={{ color: ROLE.gen }}>none</span> of the right answers
        </Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
