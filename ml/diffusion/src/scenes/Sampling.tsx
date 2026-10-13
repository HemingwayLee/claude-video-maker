import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, fadeOut, linear } from "../anim";
import { PixelImage } from "../components/PixelImage";
import { Card, Label } from "../components/Text";
import { ICONS, imageAt, TRACE } from "../data";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

// The sampling loop, then four runs played back: xₜ (top) and the guess x̂₀ (bottom).
export const Sampling: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const p = linear(frame, [L[1] + 20, L[3] - 15], [0, 1]);
  const algo = fade(frame, L[0]) * fadeOut(frame, L[3] - 5, 10);
  const hi = frame >= L[1] && frame < L[3];
  const step = Math.round((1 - p) * TRACE.settings.T);
  return (
    <AbsoluteFill>
      <Card x={360} y={130} w={1200} h={200} opacity={algo}>
        <Label x={40} y={24} size={28} mono color={ROLE.noise}>
          x<sub>1000</sub> ~ N(0, I) <span style={{ color: COLORS.muted }}> · pure noise</span>
        </Label>
        <Label x={40} y={74} size={28} mono color={COLORS.text}>
          for t = 1000, 999, …, 1:
        </Label>
        <Label x={90} y={124} size={28} mono color={hi ? ROLE.net : COLORS.text}>
          predict ε̂ = ε_θ(xₜ, t) → remove a little → add a little fresh noise
        </Label>
      </Card>
      <AbsoluteFill style={{ opacity: fade(frame, L[3]) }}>
        <Label x={960} y={140} size={28} weight={700} center color={ROLE.data}>
          the 6 training pictures of the ideal denoiser
        </Label>
        {ICONS.map((ic, i) => (
          <PixelImage key={i} im={{ data: ic }} x={570 + i * 135} y={200} size={105} border={ROLE.data} />
        ))}
      </AbsoluteFill>
      {TRACE.images.map((_, i) => (
        <React.Fragment key={i}>
          <PixelImage im={imageAt(i, p, "xt")} x={300 + i * 360} y={380} size={190} border={ROLE.noise} opacity={fade(frame, L[1])} />
          <PixelImage im={imageAt(i, p, "x0")} x={300 + i * 360} y={610} size={190} border={ROLE.net} opacity={fade(frame, L[2] - 10)} />
        </React.Fragment>
      ))}
      <Label x={280} y={460} size={26} weight={700} color={ROLE.noise} style={{ transform: "translateX(-100%)" }} opacity={fade(frame, L[1])}>
        xₜ
      </Label>
      <Label x={280} y={690} size={26} weight={700} color={ROLE.net} style={{ transform: "translateX(-100%)" }} opacity={fade(frame, L[2] - 10)}>
        guess x̂₀
      </Label>
      <Label x={1790} y={360} size={26} mono weight={800} color={ROLE.time} center opacity={fade(frame, L[1]) * (p < 1 ? 1 : 0.5)}>
        t = {step}
      </Label>
    </AbsoluteFill>
  );
};
