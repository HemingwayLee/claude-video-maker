import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, linear } from "../anim";
import { PointCloud } from "../components/PointCloud";
import { Label } from "../components/Text";
import { TRACE } from "../data";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

// The same trained network, sampled with 1000 (DDPM), 50, 10 and 3 (DDIM) steps.
const SP = TRACE.spiral;
const PANELS = [
  { name: "DDPM · 1000 steps", points: SP.ddpm.snaps[SP.ddpm.snaps.length - 1].points, d: SP.ddpm.distance, snaps: null as null | { points: number[] }[] },
  { name: "DDIM · 50 steps", points: SP.ddim["50"].points, d: SP.ddim["50"].distance, snaps: null },
  { name: "DDIM · 10 steps", points: SP.ddim["10"].points, d: SP.ddim["10"].distance, snaps: SP.ddim["10"].snaps },
  { name: "DDIM · 3 steps", points: SP.ddim["3"].points, d: SP.ddim["3"].distance, snaps: SP.ddim["3"].snaps },
];

export const Ddim: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const play = linear(frame, [L[1], L[2] - 20], [0, 1]);
  return (
    <AbsoluteFill>
      {PANELS.map((p, i) => {
        let pts = p.points;
        if (p.snaps && play < 1) {
          const k = Math.min(p.snaps.length - 1, Math.floor(play * (p.snaps.length - 1) + 1e-9));
          pts = p.snaps[k].points;
        }
        const good = p.d < 0.08;
        return (
          <React.Fragment key={p.name}>
            <PointCloud x={95 + i * 445} y={250} size={400} range={3.4} layers={[{ points: SP.data, color: COLORS.muted, alpha: 0.2, radius: 1.3 }, { points: pts, color: i === 0 ? ROLE.net : ROLE.guide, radius: 1.9 }]} label={p.name} labelColor={i === 0 ? ROLE.net : ROLE.guide} opacity={fade(frame, L[0] + 10 + i * 15)} />
            <Label x={295 + i * 445} y={670} size={24} mono center color={good ? ROLE.data : p.d < 0.2 ? COLORS.orange : COLORS.red} opacity={fade(frame, L[1] + 20 + i * 15)}>
              distance {p.d.toFixed(3)}
            </Label>
          </React.Fragment>
        );
      })}
      <Label x={960} y={160} size={26} center color={COLORS.muted} opacity={fade(frame, L[0] + 30)}>
        the same trained network · only the sampler changes · real data: {SP.dataDistance.toFixed(3)}
      </Label>
      <div style={{ position: "absolute", left: 0, right: 0, top: 750, display: "flex", justifyContent: "center", gap: 30, opacity: fade(frame, L[2]) }}>
        {["progressive distillation (2022)", "consistency models (2023)", "→ 1 to 4 steps"].map((t) => (
          <div key={t} style={{ padding: "12px 26px", borderRadius: 30, border: `3px solid ${ROLE.guide}`, color: COLORS.text, fontFamily: "Menlo, monospace", fontSize: 26, fontWeight: 700 }}>
            {t}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
