import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade } from "../anim";
import { Card, Label } from "../components/Text";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

// GANs vs. diffusion, row by row.
const ROWS = [
  { k: "training", gan: "two networks in a game: can be unstable", diff: "one simple squared error: stable", line: 0 },
  { k: "variety", gan: "can collapse to a few modes", diff: "covers the whole data distribution", line: 0 },
  { k: "quality", gan: "BigGAN: best on ImageNet until 2021", diff: "“Diffusion Models Beat GANs” (Dhariwal & Nichol, 2021)", line: 1 },
  { k: "speed", gan: "one network pass per image", diff: "many passes (fixes: DDIM, latents, distillation)", line: 2 },
];

export const Compare: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  return (
    <AbsoluteFill>
      <Label x={760} y={160} size={36} weight={800} center color={COLORS.magenta}>
        GAN
      </Label>
      <Label x={1400} y={160} size={36} weight={800} center color={ROLE.data}>
        Diffusion
      </Label>
      {ROWS.map((r, i) => {
        const show = fade(frame, L[r.line] + (r.line === 0 ? i * 40 : 10));
        const ganWins = r.k === "speed";
        return (
          <React.Fragment key={r.k}>
            <Label x={130} y={262 + i * 150} size={30} weight={800} color={COLORS.muted} opacity={show}>
              {r.k}
            </Label>
            <Card x={450} y={230 + i * 150} w={620} h={120} accent={ganWins ? COLORS.magenta : undefined} opacity={show}>
              <Label x={30} y={38} size={26} color={COLORS.text} width={560}>
                {r.gan}
              </Label>
            </Card>
            <Card x={1090} y={230 + i * 150} w={620} h={120} accent={ganWins ? undefined : ROLE.data} opacity={show}>
              <Label x={30} y={38} size={26} color={COLORS.text} width={560}>
                {r.diff}
              </Label>
            </Card>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
