import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade } from "../anim";
import { PixelImage } from "../components/PixelImage";
import { Card, Label } from "../components/Text";
import { iconFloats, imageAt, noiseFor, noisify, RES, TRACE } from "../data";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

// Four cards: forward process, noise predictor, sampler, guidance.
const X0 = iconFloats(4);
const N = noiseFor("recap", 3 * RES * RES);
const CARDS = [
  { title: "Forward process", body: "add noise; jump to any step t in one formula", color: ROLE.noise },
  { title: "Noise predictor", body: "ε_θ(xₜ, t), trained with ||ε − ε̂||²", color: ROLE.net },
  { title: "Sampler", body: "pure noise → remove it step by step (DDPM, DDIM)", color: ROLE.data },
  { title: "Guidance", body: "condition on a prompt; push with scale w", color: ROLE.guide },
];

export const Recap: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const p = Math.max(0, Math.min(1, (frame - L[2]) / 90));
  return (
    <AbsoluteFill>
      {CARDS.map((c, i) => (
        <Card key={c.title} x={110 + i * 435} y={190} w={400} h={560} accent={c.color} opacity={fade(frame, L[i])}>
          <Label x={200} y={30} size={56} weight={900} center color={c.color}>
            {i + 1}
          </Label>
          <Label x={200} y={110} size={32} weight={800} center color={c.color}>
            {c.title}
          </Label>
          <Label x={200} y={170} size={24} center color={COLORS.text} width={340}>
            {c.body}
          </Label>
          {i === 0 && <PixelImage im={{ data: noisify(X0, 500, "recap", N), float: true }} x={115} y={300} size={170} border={ROLE.noise} />}
          {i === 2 && <PixelImage im={imageAt(3, p, "xt")} x={115} y={300} size={170} border={ROLE.data} />}
          {i === 1 && <Label x={200} y={350} size={60} center color={ROLE.net}>ε̂</Label>}
          {i === 3 && <Label x={200} y={350} size={44} center color={ROLE.guide}>w = 3</Label>}
        </Card>
      ))}
      <Label x={960} y={800} size={22} center color={COLORS.muted} opacity={fade(frame, L[3] + 30)}>
        real runs in this video: scripts/train-diffusion.mjs · {TRACE.settings.STEPS.toLocaleString()} training steps · T = {TRACE.settings.T}
      </Label>
    </AbsoluteFill>
  );
};
