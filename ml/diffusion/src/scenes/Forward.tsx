import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, fadeOut, lerp, linear } from "../anim";
import { Axes, type Chart, Layer, linePath, px, py } from "../components/Diagram";
import { PixelImage } from "../components/PixelImage";
import { Label } from "../components/Text";
import { ALPHA_BAR, alphaBarAt, BETA, iconFloats, noiseFor, noisify, RES } from "../data";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

// The forward process on one picture, the β schedule, the closed form, and
// how signal and noise trade places as t grows.
const X0 = iconFloats(5);
const NOISE = noiseFor("fwd", 3 * RES * RES);
const TS = Array.from({ length: 101 }, (_, i) => i * 10);
const CH: Chart = { x: 1010, y: 300, w: 760, h: 400, x0: 0, x1: 1000, y0: 0, y1: 1 };
const JUMPS = [700, 150, 900, 400, 50, 600];

export const Forward: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  let t: number;
  if (frame < L[1]) t = linear(frame, [L[0] + 10, L[1] - 15], [0, 1000]);
  else if (frame < L[2]) t = 1000;
  else if (frame < L[3]) t = JUMPS[Math.floor((frame - L[2]) / 22) % JUMPS.length];
  else if (frame < L[4]) t = 300;
  else t = linear(frame, [L[4] + 10, L[5] - 30], [0, 1000]);
  const ab = alphaBarAt(t);
  const betaChart = fade(frame, L[1]) * fadeOut(frame, L[3] - 5, 10);
  const parts = fade(frame, L[3]) * fadeOut(frame, L[4] - 5, 10);
  const trade = fade(frame, L[4]);
  const betaC: Chart = { ...CH, y1: 0.022 };
  return (
    <AbsoluteFill>
      <PixelImage im={{ data: noisify(X0, t, "fwd", NOISE), float: true }} x={150} y={250} size={430} border={t < 1 ? ROLE.data : ROLE.noise} />
      <Label x={365} y={700} size={44} mono weight={800} center color={ROLE.time}>
        t = {Math.round(t)}
      </Label>
      <Label x={365} y={760} size={24} center color={COLORS.muted} opacity={frame >= L[2] && frame < L[3] ? 1 : 0}>
        jump to any t with one formula
      </Label>

      {/* the β schedule */}
      <AbsoluteFill style={{ opacity: betaChart }}>
        <Layer>
          <Axes c={betaC} xLabel="step t" yLabel="β_t: noise added at step t" />
          <path d={linePath(betaC, TS, TS.map((s) => BETA(s)))} stroke={ROLE.time} strokeWidth={5} fill="none" />
        </Layer>
        <Label x={CH.x + 10} y={CH.y + CH.h - 50} size={24} mono color={ROLE.time}>
          β₁ = 0.0001
        </Label>
        <Label x={CH.x + CH.w - 190} y={CH.y + 10} size={24} mono color={ROLE.time}>
          β₁₀₀₀ = 0.02
        </Label>
      </AbsoluteFill>

      {/* x_t = √ᾱ x_0 + √(1 − ᾱ) ε, at t = 300 */}
      <AbsoluteFill style={{ opacity: parts }}>
        <Label x={1390} y={230} size={40} mono center>
          x<sub>t</sub> = <span style={{ color: ROLE.data }}>√ᾱ<sub>t</sub> · x<sub>0</sub></span> + <span style={{ color: ROLE.noise }}>√(1−ᾱ<sub>t</sub>) · ε</span>
        </Label>
        <PixelImage im={{ data: X0, float: true }} x={1000} y={360} size={200} border={ROLE.data} label="x₀" labelColor={ROLE.data} />
        <Label x={1100} y={580} size={26} mono center color={ROLE.data}>
          × {Math.sqrt(ab).toFixed(2)}
        </Label>
        <Label x={1235} y={430} size={50} center color={COLORS.muted}>
          +
        </Label>
        <PixelImage im={{ data: NOISE, float: true }} x={1290} y={360} size={200} border={ROLE.noise} label="ε ~ N(0, I)" labelColor={ROLE.noise} />
        <Label x={1390} y={580} size={26} mono center color={ROLE.noise}>
          × {Math.sqrt(1 - ab).toFixed(2)}
        </Label>
        <Label x={1525} y={430} size={50} center color={COLORS.muted}>
          =
        </Label>
        <PixelImage im={{ data: noisify(X0, 300, "fwd", NOISE), float: true }} x={1580} y={360} size={200} border={ROLE.time} label="x₃₀₀" labelColor={ROLE.time} />
        <Label x={1390} y={660} size={24} center color={COLORS.muted}>
          ᾱ<sub>t</sub> = (1 − β₁)(1 − β₂)…(1 − β<sub>t</sub>): how much of the image survives
        </Label>
      </AbsoluteFill>

      {/* signal vs noise */}
      <AbsoluteFill style={{ opacity: trade }}>
        <Layer>
          <Axes c={CH} xLabel="step t" yLabel="weight" />
          <path d={linePath(CH, TS, TS.map((s) => Math.sqrt(s === 0 ? 1 : ALPHA_BAR[s - 1])))} stroke={ROLE.data} strokeWidth={5} fill="none" />
          <path d={linePath(CH, TS, TS.map((s) => Math.sqrt(1 - (s === 0 ? 1 : ALPHA_BAR[s - 1]))))} stroke={ROLE.noise} strokeWidth={5} fill="none" />
          <line x1={px(CH, t)} y1={CH.y} x2={px(CH, t)} y2={CH.y + CH.h} stroke={ROLE.time} strokeWidth={3} strokeDasharray="8 6" />
          <circle cx={px(CH, t)} cy={py(CH, Math.sqrt(ab))} r={9} fill={ROLE.data} />
          <circle cx={px(CH, t)} cy={py(CH, Math.sqrt(1 - ab))} r={9} fill={ROLE.noise} />
        </Layer>
        <Label x={CH.x + 30} y={CH.y + 20} size={26} mono weight={700} color={ROLE.data}>
          √ᾱ<sub>t</sub>: image
        </Label>
        <Label x={CH.x + CH.w - 260} y={CH.y + 20} size={26} mono weight={700} color={ROLE.noise}>
          √(1−ᾱ<sub>t</sub>): noise
        </Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
