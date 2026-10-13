import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { Arrow, Layer } from "../components/Diagram";
import { PixelImage } from "../components/PixelImage";
import { Card, Label } from "../components/Text";
import { iconFloats, imageAt, noiseFor, noisify, RES } from "../data";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

// Destroying is easy (left → right); learning to undo it (right → left).
const STEPS = [0, 100, 250, 450, 700, 1000];
const X0 = iconFloats(0);
const NOISE = noiseFor("idea", 3 * RES * RES);

export const Idea: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const size = 190;
  const x = (i: number) => 175 + i * 270;
  return (
    <AbsoluteFill>
      {STEPS.map((t, i) => (
        <React.Fragment key={t}>
          <PixelImage im={{ data: noisify(X0, t, "idea", NOISE), float: true }} x={x(i)} y={230} size={size} border={i === 0 ? ROLE.data : ROLE.noise} opacity={fade(frame, L[0] + i * 14)} label={`t = ${t}`} labelColor={i === 0 ? ROLE.data : COLORS.muted} />
        </React.Fragment>
      ))}
      <Layer opacity={fade(frame, L[0] + 10)}>
        <Arrow id="id1" d={`M ${x(0) + 40} 460 L ${x(5) + size - 40} 460`} color={ROLE.noise} progress={lerp(frame, [L[0] + 10, L[0] + 80], [0, 1])} />
      </Layer>
      <Label x={960} y={475} size={30} weight={700} center color={ROLE.noise} opacity={fade(frame, L[0] + 30)}>
        add noise: easy, no learning needed
      </Label>
      {/* the way back */}
      <Layer opacity={fade(frame, L[1])}>
        <Arrow id="id2" d={`M ${x(5) + size - 40} 560 L ${x(0) + 40} 560`} color={ROLE.net} progress={lerp(frame, [L[1] + 10, L[1] + 60], [0, 1])} width={5} />
      </Layer>
      <Label x={960} y={580} size={30} weight={700} center color={ROLE.net} opacity={fade(frame, L[1] + 20)}>
        remove noise, one small step at a time: a neural network learns this
      </Label>
      {/* a new picture from noise: the reverse process, right (noise) to left */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const p = (5 - i) / 5; // 0 = pure noise (right), 1 = finished picture (left)
        return <PixelImage key={i} im={imageAt(1, p, "xt")} x={x(i) + 20} y={660} size={150} border={i === 0 ? ROLE.data : ROLE.net} opacity={fade(frame, L[2] + (5 - i) * 18, 12)} />;
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 860, display: "flex", justifyContent: "center", gap: 30, opacity: fade(frame, L[3]) }}>
        <Card x={0} y={0} w={0} h={0} style={{ position: "relative", width: "auto", height: "auto", padding: "14px 28px" }}>
          <Label x={0} y={0} size={26} mono style={{ position: "relative" }} color={COLORS.muted}>
            2015 · Sohl-Dickstein et al. · the idea
          </Label>
        </Card>
        <Card x={0} y={0} w={0} h={0} accent={ROLE.net} style={{ position: "relative", width: "auto", height: "auto", padding: "14px 28px" }}>
          <Label x={0} y={0} size={26} mono style={{ position: "relative" }} color={COLORS.text}>
            2020 · <span style={{ color: ROLE.net }}>DDPM</span> · Ho, Jain, Abbeel
          </Label>
        </Card>
      </div>
    </AbsoluteFill>
  );
};
