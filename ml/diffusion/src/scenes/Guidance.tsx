import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, fadeOut } from "../anim";
import { Arrow, Layer, NetBlock } from "../components/Diagram";
import { PointCloud } from "../components/PointCloud";
import { Label } from "../components/Text";
import { TRACE } from "../data";
import { COLORS, MONO, ROLE, SHAPE_COLORS } from "../theme";
import { useLines } from "../timeline";

// Conditioning, the 3-shape model, classifier-free guidance at w = 0, 1, 3.
const SH = TRACE.shapes;
const DATA_COLORS = Array.from({ length: SH.data.length / 2 }, (_, k) => SHAPE_COLORS[k % 3]);
const panel = (w: string) => {
  const runs = SH.runs[w];
  const points = runs.flatMap((r) => r.points);
  const colors = runs.flatMap((r, c) => new Array(r.points.length / 2).fill(SHAPE_COLORS[c]));
  return { points, colors, on: runs.map((r) => r.onShape) };
};
const PANELS = ["0", "1", "3"].map((w) => ({ w, ...panel(w) }));

export const Guidance: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const top = fadeOut(frame, L[3] - 5, 12);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: top }}>
        {/* the condition goes into the network */}
        <AbsoluteFill style={{ opacity: fade(frame, L[0]) }}>
          <div style={{ position: "absolute", left: 150, top: 230, display: "flex", flexDirection: "column", gap: 20, fontFamily: MONO, fontSize: 28, fontWeight: 800 }}>
            <div style={{ color: ROLE.noise }}>xₜ</div>
            <div style={{ color: ROLE.time }}>t</div>
            <div style={{ color: ROLE.guide, padding: "4px 12px", border: `3px solid ${ROLE.guide}`, borderRadius: 10 }}>c = "a cat" / class</div>
          </div>
          <Layer>
            <Arrow id="g1" d="M 470 290 L 560 330" />
            <Arrow id="g2" d="M 470 340 L 560 345" />
            <Arrow id="g3" d="M 470 395 L 560 365" color={ROLE.guide} />
            <Arrow id="g4" d="M 840 345 L 920 345" />
          </Layer>
          <NetBlock x={570} y={345} w={260} h={200} shape="shrink" color={ROLE.net} label="ε_θ(xₜ, t, c)" labelSize={34} />
          <Label x={930} y={325} size={30} mono color={ROLE.net}>
            ε̂
          </Label>
        </AbsoluteFill>
        {/* the 3-shape data */}
        <PointCloud x={1120} y={200} size={460} range={3.4} layers={[{ points: SH.data, color: COLORS.text, colors: DATA_COLORS, radius: 2 }]} label="training data: ring · square · triangle" opacity={fade(frame, L[1])} />
        <Label x={1350} y={680} size={22} center color={COLORS.muted} opacity={fade(frame, L[1] + 30)}>
          label hidden (c = ∅) about 1 time in 7
        </Label>
        {/* CFG formula */}
        <Label x={960} y={760} size={38} mono center opacity={fade(frame, L[2])}>
          ε̂ = ε(xₜ, ∅) + <span style={{ color: ROLE.guide }}>w</span> · ( ε(xₜ, <span style={{ color: ROLE.guide }}>c</span>) − ε(xₜ, ∅) )
        </Label>
        <Label x={960} y={830} size={24} center color={COLORS.muted} opacity={fade(frame, L[2] + 40)}>
          classifier-free guidance (Ho & Salimans, 2021)
        </Label>
      </AbsoluteFill>

      {/* w = 0, 1, 3 */}
      <AbsoluteFill style={{ opacity: fade(frame, L[3]) }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", gap: 40, fontFamily: MONO, fontSize: 24 }}>
          {["ring", "square", "triangle"].map((n, c) => (
            <span key={n} style={{ color: SHAPE_COLORS[c] }}>● asked for {n}</span>
          ))}
        </div>
        {PANELS.map((p, i) => (
          <React.Fragment key={p.w}>
            <PointCloud x={110 + i * 590} y={260} size={520} range={3.4} layers={[{ points: p.points, color: COLORS.text, colors: p.colors, radius: 1.7, alpha: 0.75 }]} label={`w = ${p.w}`} labelColor={ROLE.guide} opacity={fade(frame, i === 2 ? L[4] : L[3] + 10 + i * 40)} />
            <Label x={370 + i * 590} y={800} size={24} mono center color={COLORS.text} opacity={fade(frame, i === 2 ? L[4] + 20 : L[3] + 30 + i * 40)}>
              on the asked shape: {Math.round((100 * p.on.reduce((s, v) => s + v, 0)) / 3)} %
            </Label>
          </React.Fragment>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
