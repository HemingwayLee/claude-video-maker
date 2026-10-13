import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade } from "../anim";
import { PixelImage } from "../components/PixelImage";
import { Card, Label } from "../components/Text";
import { finalOutput, TEST_INPUTS, TRACE } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

// Three cards: U-Net, PatchGAN, cGAN + λ·L1; then the trained result.
const CARDS = [
  { title: "U-Net generator", body: "encoder → decoder, with skips that carry the details across", color: ROLE.gen },
  { title: "PatchGAN discriminator", body: "a real/fake score for every patch, averaged", color: ROLE.disc },
  { title: "cGAN + λ · L1", body: "the GAN makes it sharp, L1 keeps it faithful (λ = 100)", color: ROLE.l1 },
];

export const Recap: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  return (
    <AbsoluteFill>
      {CARDS.map((c, i) => (
        <Card key={c.title} x={150 + i * 550} y={200} w={500} h={330} accent={c.color} opacity={fade(frame, L[i])}>
          <Label x={250} y={40} size={64} weight={900} center color={c.color}>
            {i + 1}
          </Label>
          <Label x={250} y={140} size={34} weight={800} center color={c.color}>
            {c.title}
          </Label>
          <Label x={250} y={205} size={26} center color={COLORS.text} width={420}>
            {c.body}
          </Label>
        </Card>
      ))}
      <AbsoluteFill style={{ opacity: fade(frame, L[2] + 50) }}>
        <PixelImage im={TEST_INPUTS[1]} x={700} y={620} size={200} border={ROLE.input} />
        <Label x={960} y={690} size={48} center color={COLORS.muted}>
          →
        </Label>
        <PixelImage im={finalOutput("both", 1)} x={1020} y={620} size={200} border={ROLE.gen} />
        <Label x={960} y={860} size={20} mono center color={COLORS.muted}>
          our tiny Pix2Pix · {TRACE.settings.STEPS.toLocaleString()} steps · scripts/train-pix2pix.mjs
        </Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
