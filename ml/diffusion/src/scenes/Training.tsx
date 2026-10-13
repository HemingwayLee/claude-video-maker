import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { Axes, type Chart, Layer, linePath } from "../components/Diagram";
import { PixelImage } from "../components/PixelImage";
import { Card, Label } from "../components/Text";
import { iconFloats, noiseFor, noisify, RES, TRACE } from "../data";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

// The training loop as 4 steps, one example worked through, and the real loss curve.
const X0 = iconFloats(1);
const EPS = noiseFor("train", 3 * RES * RES);
const TT = 430;
const STEPS = [
  { text: "take a clean example x₀", color: ROLE.data },
  { text: "pick a random t and noise ε", color: ROLE.time },
  { text: "xₜ = √ᾱₜ·x₀ + √(1−ᾱₜ)·ε", color: ROLE.noise },
  { text: "loss = ||ε − ε_θ(xₜ, t)||²  → update θ", color: ROLE.net },
];
const LOSS = TRACE.spiral.losses;
const CH: Chart = { x: 1130, y: 650, w: 640, h: 220, x0: 0, x1: LOSS[LOSS.length - 1].step, y0: 0, y1: Math.max(...LOSS.map((l) => l.loss)) * 1.05 };

export const Training: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const active = frame >= L[3] ? 3 : frame >= L[2] ? 3 : frame >= L[1] ? 2 : 0;
  const show = (k: number) => fade(frame, k === 0 ? L[0] : k === 1 ? L[1] : k === 2 ? L[1] + 50 : L[2]);
  const shown = lerp(frame, [L[3] + 10, L[4] - 30], [0, 1]);
  const n = Math.max(2, Math.round(shown * LOSS.length));
  return (
    <AbsoluteFill>
      <Card x={120} y={170} w={880} h={420}>
        <Label x={30} y={22} size={30} weight={800} color={COLORS.text}>
          repeat:
        </Label>
        {STEPS.map((s, k) => (
          <Label key={k} x={60} y={90 + k * 78} size={32} mono color={s.color} opacity={show(k) * (k <= active || frame >= L[3] ? 1 : 0.4)}>
            {k + 1}. {s.text}
          </Label>
        ))}
      </Card>
      {/* one worked example */}
      <PixelImage im={{ data: X0, float: true }} x={1140} y={220} size={150} border={ROLE.data} label="x₀" labelColor={ROLE.data} opacity={show(0)} />
      <Label x={1360} y={265} size={30} mono weight={800} color={ROLE.time} opacity={show(1)}>
        t = {TT}
      </Label>
      <PixelImage im={{ data: EPS, float: true }} x={1560} y={220} size={150} border={ROLE.noise} label="ε" labelColor={ROLE.noise} opacity={show(1)} />
      <PixelImage im={{ data: noisify(X0, TT, "train", EPS), float: true }} x={1350} y={420} size={150} border={ROLE.noise} label="xₜ" labelColor={ROLE.noise} opacity={show(2)} />
      <Layer opacity={show(2)}>
        <path d="M 1215 380 L 1400 420 M 1635 380 L 1450 420" stroke={COLORS.muted} strokeWidth={3} fill="none" />
      </Layer>
      <Label x={560} y={640} size={28} center color={ROLE.net} opacity={show(3)} width={800}>
        the network ε_θ sees xₜ and t, and must say what ε was
      </Label>
      {/* real loss curve */}
      <AbsoluteFill style={{ opacity: fade(frame, L[3]) }}>
        <Layer>
          <Axes c={CH} xLabel="training step" yLabel="loss (our 2-D model)" />
          <path d={linePath(CH, LOSS.slice(0, n).map((l) => l.step), LOSS.slice(0, n).map((l) => l.loss))} stroke={ROLE.net} strokeWidth={3} fill="none" />
        </Layer>
        <Label x={560} y={740} size={30} weight={700} center color={ROLE.data}>
          no discriminator · no adversarial game · just a squared error
        </Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
