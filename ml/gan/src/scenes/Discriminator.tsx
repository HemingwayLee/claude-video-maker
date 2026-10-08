import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { Arrow, Axes, type Chart, Layer, linePath, px, py } from "../components/Diagram";
import { Face } from "../components/Face";
import { Slab } from "../components/Slab";
import { Label } from "../components/Text";
import { FACE_Z, faceFromZ, gaussian } from "../data";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const REAL = faceFromZ(FACE_Z[2]);
const FAKE = faceFromZ(gaussian("disc-fake", 8));
const MID = 360;

// A CNN discriminator: each strided convolution halves the size.
const LAYERS = [
  { x: 380, h: 200, t: 16, label: "32×32×64" },
  { x: 600, h: 130, t: 26, label: "16×16×128" },
  { x: 780, h: 80, t: 40, label: "8×8×256" },
  { x: 930, h: 46, t: 56, label: "4×4×512" },
];

const CHART: Chart = { x: 600, y: 600, w: 640, h: 240, x0: -6, x1: 6, y0: 0, y1: 1 };
const SIG_X = Array.from({ length: 121 }, (_, i) => -6 + i / 10);
const sigmoid = (s: number) => 1 / (1 + Math.exp(-s));

export const Discriminator: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  // Which input D is looking at, and the number it produces.
  const half = (L[2] + L[3]) / 2;
  const improving = lerp(frame, [L[3] + 10, L[3] + 100], [0, 1]);
  const isReal = frame < half;
  const quality = isReal ? 1 : 0.45 + 0.5 * improving;
  const logit = isReal ? 2.4 : -2.3 + 2.2 * improving;
  const p = sigmoid(logit);
  const swap = isReal ? 1 : pop(frame, fps, half, 14);

  const net = frame >= L[1] + 75;
  const chart = fade(frame, L[2]);
  const verdict = p > 0.7 ? { text: "REAL", color: ROLE.real } : p < 0.3 ? { text: "FAKE", color: COLORS.red } : { text: "unsure…", color: COLORS.yellow };

  return (
    <AbsoluteFill>
      {/* the image in */}
      <div style={{ position: "absolute", left: 110, top: MID - 100, opacity: fade(frame, L[0]), transform: `scale(${swap})` }}>
        <Face p={isReal ? REAL : FAKE} size={200} quality={quality} noiseSeed="disc-fake" border={isReal ? ROLE.real : ROLE.gen} />
      </div>
      <Label x={210} y={MID + 115} size={24} color={isReal ? ROLE.real : ROLE.gen} weight={700} center opacity={fade(frame, L[0])}>
        {isReal ? "a real image" : "a fake from G"}
      </Label>

      {/* the layers */}
      {LAYERS.map((layer, i) => {
        const at = L[1] + i * 15;
        const s = pop(frame, fps, at, 15);
        return (
          <React.Fragment key={layer.label}>
            <div style={{ opacity: Math.min(1, s) }}>
              <Slab x={layer.x} y={MID - layer.h / 2} h={layer.h} t={layer.t} color={ROLE.disc} />
            </div>
            <Label x={layer.x + layer.t / 2 + layer.h * 0.2} y={MID + Math.max(layer.h / 2, 60) + 20} size={20} mono color={COLORS.muted} center opacity={fade(frame, at)}>
              {layer.label}
            </Label>
          </React.Fragment>
        );
      })}
      <Label x={720} y={MID + 160} size={28} weight={700} color={ROLE.disc} center opacity={fade(frame, L[1] + 30)}>
        convolutions: size ÷2 at every layer
      </Label>
      <Layer opacity={fade(frame, L[0])}>
        <Arrow id="da" d={`M 320 ${MID} L 370 ${MID}`} progress={lerp(frame, [L[1], L[1] + 10], [0, 1])} />
        <Arrow id="db" d={`M 1080 ${MID} L 1150 ${MID}`} progress={lerp(frame, [L[1] + 60, L[1] + 72], [0, 1])} />
        <Arrow id="dc" d={`M 1310 ${MID} L 1380 ${MID}`} progress={lerp(frame, [L[2], L[2] + 12], [0, 1])} />
      </Layer>

      {/* one number out */}
      <div
        style={{
          position: "absolute",
          left: 1165,
          top: MID - 50,
          width: 130,
          height: 100,
          borderRadius: 14,
          border: `3px solid ${ROLE.disc}`,
          background: COLORS.panel,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: MONO,
          fontSize: 38,
          fontWeight: 700,
          opacity: fade(frame, L[1] + 70),
        }}
      >
        {net ? (logit > 0 ? "+" : "") + logit.toFixed(1) : ""}
      </div>
      <Label x={1230} y={MID + 65} size={22} color={COLORS.muted} center opacity={fade(frame, L[1] + 70)}>
        one number (logit)
      </Label>

      {/* sigmoid → probability */}
      <div style={{ position: "absolute", left: 1395, top: MID - 80, opacity: fade(frame, L[2]) }}>
        <div style={{ fontSize: 26, color: COLORS.muted }}>D(image) = σ(logit)</div>
        <div style={{ fontFamily: MONO, fontSize: 72, fontWeight: 800, color: ROLE.disc }}>{p.toFixed(2)}</div>
        <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: 2, color: verdict.color }}>{verdict.text}</div>
      </div>

      <Layer opacity={chart}>
        <Axes c={CHART} xLabel="logit" />
        <line x1={px(CHART, 0)} y1={CHART.y} x2={px(CHART, 0)} y2={CHART.y + CHART.h} stroke={COLORS.panelBorder} strokeWidth={2} />
        <line x1={CHART.x} y1={py(CHART, 0.5)} x2={CHART.x + CHART.w} y2={py(CHART, 0.5)} stroke={COLORS.panelBorder} strokeWidth={2} strokeDasharray="6 6" />
        <path d={linePath(CHART, SIG_X, SIG_X.map(sigmoid))} fill="none" stroke={ROLE.disc} strokeWidth={5} />
        <circle cx={px(CHART, logit)} cy={py(CHART, p)} r={13} fill={COLORS.yellow} stroke="#fff" strokeWidth={3} />
        {[0, 0.5, 1].map((v) => (
          <text key={v} x={CHART.x - 14} y={py(CHART, v) + 8} fill={COLORS.muted} fontSize={22} textAnchor="end" fontFamily={MONO}>
            {v}
          </text>
        ))}
        <text x={CHART.x + CHART.w - 10} y={py(CHART, 1) + 30} fill={ROLE.real} fontSize={22} textAnchor="end">
          → 1: real
        </text>
        <text x={CHART.x + 10} y={py(CHART, 0) - 14} fill={COLORS.red} fontSize={22}>
          → 0: fake
        </text>
      </Layer>
      <Label x={300} y={630} size={30} weight={700} color={COLORS.yellow} width={260} opacity={fade(frame, L[3] + 20)}>
        the fakes keep getting better…
      </Label>
    </AbsoluteFill>
  );
};
