import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, fadeOut, lerp } from "../anim";
import { Arrow, Layer, NetBlock } from "../components/Diagram";
import { PixelImage } from "../components/PixelImage";
import { TaskArt } from "../components/TaskArt";
import { Card, Label } from "../components/Text";
import { outputAt, TEST_INPUTS, TEST_TARGETS } from "../data";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

// Training pairs (x, y); G paints G(x); before Pix2Pix: one hand-made loss per task.
const OLD = [
  { task: "Colorization", loss: "classification over color bins + rebalancing" },
  { task: "Super-resolution", loss: "pixel loss + perceptual (VGG) loss" },
  { task: "Segmentation", loss: "per-pixel cross-entropy + CRF smoothing" },
];

export const Task: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const s0 = fade(frame, L[0]) * fadeOut(frame, L[2] - 5, 12);
  const g = fade(frame, L[1]);
  // G's answer: our untrained → trained Pix2Pix, sped up.
  const step = lerp(frame, [L[1] + 30, L[2] - 10], [0, 3000]);
  const s2 = fade(frame, L[2] + 5);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: s0 }}>
        {/* the training pairs */}
        <Label x={250} y={170} size={30} weight={700} color={COLORS.muted} center>
          training pairs
        </Label>
        {[0, 1].map((i) => (
          <React.Fragment key={i}>
            <PixelImage im={TEST_INPUTS[i]} x={90} y={250 + i * 310} size={150} border={ROLE.input} label={i === 0 ? "x" : undefined} labelColor={ROLE.input} />
            <PixelImage im={TEST_TARGETS[i]} x={270} y={250 + i * 310} size={150} border={ROLE.real} label={i === 0 ? "y" : undefined} labelColor={ROLE.real} />
          </React.Fragment>
        ))}
        <div style={{ position: "absolute", left: 90, top: 870, display: "flex", gap: 30, opacity: fade(frame, L[0] + 30) }}>
          <TaskArt task="facade" side="labels" size={150} style={{ boxShadow: `0 0 0 4px ${ROLE.input}` }} />
          <TaskArt task="facade" side="real" size={150} style={{ boxShadow: `0 0 0 4px ${ROLE.real}` }} />
        </div>
        <Label x={510} y={900} size={24} color={COLORS.muted} opacity={fade(frame, L[0] + 30)}>
          …any kind of image works
        </Label>
        {/* x → G → G(x) */}
        <AbsoluteFill style={{ opacity: g }}>
          <PixelImage im={TEST_INPUTS[0]} x={720} y={330} size={210} border={ROLE.input} label="x" labelColor={ROLE.input} />
          <Layer>
            <Arrow id="tk1" d="M 950 435 L 1010 435" progress={g} />
            <Arrow id="tk2" d="M 1250 435 L 1320 435" progress={lerp(frame, [L[1] + 15, L[1] + 30], [0, 1])} />
          </Layer>
          <NetBlock x={1020} y={435} w={220} h={220} shape="shrink" color={ROLE.gen} label="G" />
          <PixelImage im={outputAt("both", 0, step)} x={1340} y={330} size={210} border={ROLE.gen} label="G(x)" labelColor={ROLE.gen} />
          <PixelImage im={TEST_TARGETS[0]} x={1620} y={330} size={210} border={ROLE.real} label="y" labelColor={ROLE.real} opacity={fade(frame, L[1] + 40)} />
          <Label x={1585} y={420} size={44} weight={800} color={COLORS.muted} center opacity={fade(frame, L[1] + 40)}>
            ≈
          </Label>
          <Label x={1440} y={600} size={22} color={COLORS.muted} center>
            training step {Math.round(step).toLocaleString()}
          </Label>
        </AbsoluteFill>
      </AbsoluteFill>
      {/* before Pix2Pix */}
      <AbsoluteFill style={{ opacity: s2 }}>
        <Label x={960} y={160} size={40} weight={800} center>
          Before Pix2Pix: one recipe per task
        </Label>
        {OLD.map((o, i) => (
          <Card key={i} x={260} y={250 + i * 190} w={1400} h={150} opacity={fade(frame, L[2] + 15 + i * 18)}>
            <Label x={40} y={48} size={36} weight={800} color={ROLE.input}>
              {o.task}
            </Label>
            <Label x={480} y={30} size={24} color={COLORS.muted}>
              its own network
            </Label>
            <Label x={480} y={70} size={28} mono color={ROLE.l1}>
              loss = {o.loss}
            </Label>
          </Card>
        ))}
        <Label x={960} y={860} size={34} weight={700} center color={COLORS.text} opacity={fade(frame, L[3] - 70)}>
          Pix2Pix: <span style={{ color: ROLE.disc }}>learn</span> the loss instead.
        </Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
