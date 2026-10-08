import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { Grid } from "../components/Grid";
import { Label } from "../components/Text";
import { BOX, convolve, KERNELS } from "../data";
import { COLORS, diverging, MONO } from "../theme";
import { useLines } from "../timeline";

const MAP = convolve(BOX, KERNELS.vertical); // the feature map from the convolution scene

// The ReLU graph: x and y from -3 to 3.
const G = { x: 140, y: 230, size: 520 };
const toX = (v: number) => G.x + ((v + 3) / 6) * G.size;
const toY = (v: number) => G.y + G.size - ((v + 3) / 6) * G.size;

export const Relu: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  const draw = lerp(frame, [L[0] + 15, L[0] + 60], [0, 1]);
  // Line 1: negatives flip to zero, column by column (columns 4 and 5).
  const flip = (c: number) => lerp(frame, [L[1] + 30 + (c - 4) * 15, L[1] + 50 + (c - 4) * 15], [0, 1]);
  const after = (v: number, c: number) => (v < 0 ? v * (1 - flip(c)) : v);

  const pathLen = 2 * G.size;
  return (
    <AbsoluteFill>
      {/* graph */}
      <svg width={1920} height={1080} style={{ position: "absolute", opacity: fade(frame, L[0]) }}>
        <line x1={G.x} y1={toY(0)} x2={G.x + G.size} y2={toY(0)} stroke={COLORS.muted} strokeWidth={2} />
        <line x1={toX(0)} y1={G.y} x2={toX(0)} y2={G.y + G.size} stroke={COLORS.muted} strokeWidth={2} />
        <text x={G.x + G.size + 10} y={toY(0) + 10} fill={COLORS.muted} fontSize={28} fontFamily={MONO}>x</text>
        <text x={toX(0) + 12} y={G.y + 10} fill={COLORS.muted} fontSize={28} fontFamily={MONO}>y</text>
        {/* the "if it were linear" ghost */}
        <line x1={toX(-3)} y1={toY(-3)} x2={toX(0)} y2={toY(0)} stroke={COLORS.blue} strokeWidth={3} strokeDasharray="8 8" opacity={0.5 * draw} />
        <path
          d={`M ${toX(-3)} ${toY(0)} L ${toX(0)} ${toY(0)} L ${toX(3)} ${toY(3)}`}
          fill="none"
          stroke={COLORS.green}
          strokeWidth={8}
          strokeLinejoin="round"
          strokeDasharray={pathLen}
          strokeDashoffset={pathLen * (1 - draw)}
        />
      </svg>
      <Label x={G.x + G.size / 2} y={G.y + G.size + 30} size={44} mono center weight={700} color={COLORS.green} opacity={fade(frame, L[0] + 40)}>
        ReLU(x) = max(0, x)
      </Label>
      <Label x={toX(-2.9)} y={toY(0) - 50} size={24} color={COLORS.blue} opacity={fade(frame, L[1])}>
        negative → 0
      </Label>
      <Label x={toX(0.6)} y={toY(2.8)} size={24} color={COLORS.orange} opacity={fade(frame, L[1])}>
        positive → unchanged
      </Label>

      {/* feature map before → after */}
      <Label x={940} y={190} size={28} color={COLORS.muted} opacity={fade(frame, L[1])}>
        feature map from the convolution
      </Label>
      <div style={{ position: "absolute", left: 940, top: 240, opacity: fade(frame, L[1]) }}>
        <Grid data={MAP} cell={78} color={(v) => diverging(v, 3)} showValues display={after} fontSize={28} format={(v) => (Math.abs(v) < 0.5 ? "0" : String(Math.round(v)))} />
      </div>
      <Label x={1440} y={420} size={48} weight={800} color={COLORS.green} opacity={fade(frame, L[1] + 30)}>
        ReLU
      </Label>
      <Label x={1440} y={480} size={26} color={COLORS.muted} opacity={fade(frame, L[1] + 30)} width={380}>
        keeps the edges it found, drops the “anti-matches”
      </Label>

      <div
        style={{
          position: "absolute",
          left: 940,
          top: 750,
          width: 880,
          fontSize: 28,
          color: COLORS.text,
          lineHeight: 1.45,
          opacity: fade(frame, L[2]),
        }}
      >
        Why bother? <span style={{ color: COLORS.muted }}>Linear ∘ linear = linear.</span> The bend at zero is what lets deep networks model curved, complex decision boundaries.
      </div>
    </AbsoluteFill>
  );
};
