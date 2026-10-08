import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, pop } from "../anim";
import { Grid } from "../components/Grid";
import { Label } from "../components/Text";
import { KERNELS } from "../data";
import { COLORS, diverging, MONO } from "../theme";
import { useLines } from "../timeline";

const ICON = 150;

const ConvIcon = () => <Grid data={KERNELS.vertical} cell={44} color={(w) => diverging(w, 1.4)} showValues fontSize={16} />;
const ReluIcon = () => (
  <svg width={ICON} height={ICON} viewBox="0 0 100 100">
    <line x1={5} y1={60} x2={95} y2={60} stroke={COLORS.muted} strokeWidth={2} />
    <line x1={50} y1={5} x2={50} y2={95} stroke={COLORS.muted} strokeWidth={2} />
    <path d="M 5 60 L 50 60 L 90 15" fill="none" stroke={COLORS.green} strokeWidth={7} strokeLinejoin="round" />
  </svg>
);
const PoolIcon = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
    <Grid data={[[1, 3], [4, 6]]} cell={44} color={(v) => (v === 6 ? COLORS.cyan : "rgba(76,201,240,0.2)")} showValues fontSize={18} />
    <span style={{ color: COLORS.muted, fontSize: 30 }}>→</span>
    <Grid data={[[6]]} cell={44} color={() => COLORS.cyan} showValues fontSize={18} />
  </div>
);
const DenseIcon = () => (
  <svg width={ICON} height={ICON} viewBox="0 0 100 100">
    {[20, 40, 60, 80].map((a) => [30, 50, 70].map((b) => <line key={`${a}${b}`} x1={20} y1={a} x2={80} y2={b} stroke={COLORS.magenta} strokeWidth={1.5} opacity={0.6} />))}
    {[20, 40, 60, 80].map((y) => <circle key={y} cx={20} cy={y} r={7} fill={COLORS.panel} stroke={COLORS.magenta} strokeWidth={3} />)}
    {[30, 50, 70].map((y) => <circle key={y} cx={80} cy={y} r={7} fill={COLORS.panel} stroke={COLORS.magenta} strokeWidth={3} />)}
  </svg>
);

const STEPS = [
  { name: "Convolution", does: "finds local patterns with small shared filters", color: COLORS.yellow, Icon: ConvIcon, at: 0.08 },
  { name: "ReLU", does: "adds non-linearity: negatives → 0", color: COLORS.green, Icon: ReluIcon, at: 0.37 },
  { name: "Pooling", does: "shrinks maps, keeps the strongest signal", color: COLORS.cyan, Icon: PoolIcon, at: 0.6 },
  { name: "Fully connected", does: "combines the evidence and decides", color: COLORS.magenta, Icon: DenseIcon, at: 0.76 },
];

export const Recap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();
  const finale = fade(frame, L[1], 20);

  return (
    <AbsoluteFill>
      {STEPS.map((s, i) => {
        const p = pop(frame, fps, L[0] + Math.round((L[1] - L[0]) * s.at));
        return (
          <div
            key={s.name}
            style={{
              position: "absolute",
              left: 115 + i * 430,
              top: 170,
              width: 400,
              height: 420,
              boxSizing: "border-box",
              padding: 28,
              borderRadius: 20,
              background: COLORS.panel,
              border: `3px solid ${s.color}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transform: `scale(${p})`,
              opacity: 1 - finale * 0.6,
            }}
          >
            <div style={{ height: ICON, display: "flex", alignItems: "center" }}>
              <s.Icon />
            </div>
            <div style={{ fontSize: 38, fontWeight: 800, color: s.color, marginTop: 30 }}>{s.name}</div>
            <div style={{ fontSize: 27, color: COLORS.text, textAlign: "center", marginTop: 14, lineHeight: 1.35 }}>{s.does}</div>
          </div>
        );
      })}
      <Label x={960} y={630} size={30} mono center color={COLORS.muted} opacity={fade(frame, L[0] + Math.round((L[1] - L[0]) * 0.85)) * (1 - finale)}>
        image → [conv → ReLU → pool] × N → flatten → dense → softmax → “cat”
      </Label>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 640,
          textAlign: "center",
          opacity: finale,
          transform: `scale(${0.9 + 0.1 * finale})`,
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800, color: COLORS.text }}>
          That's a <span style={{ color: COLORS.yellow }}>CNN</span>.
        </div>
      </div>
    </AbsoluteFill>
  );
};
