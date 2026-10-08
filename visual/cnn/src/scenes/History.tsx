import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, lerp, pop } from "../anim";
import { Label } from "../components/Text";
import { COLORS, MONO } from "../theme";
import { useLines } from "../timeline";

const MODELS = [
  { year: "1998", name: "LeNet-5", color: COLORS.cyan, facts: ["Yann LeCun et al.", "read handwritten digits on bank checks", "≈ 60 thousand weights"] },
  { year: "2012", name: "AlexNet", color: COLORS.yellow, facts: ["won ImageNet by a huge margin", "8 layers, ≈ 60 million weights", "trained on GPUs, used ReLU"] },
  { year: "2014", name: "VGG-16", color: COLORS.green, facts: ["16 layers deep", "only small 3 × 3 filters, stacked", "≈ 138 million weights"] },
  { year: "2015", name: "ResNet", color: COLORS.magenta, facts: ["152 layers deep", "skip connections: x + F(x)", "won ImageNet 2015"] },
];
const X0 = 130;
const W = 395;
const GAP = 30;
const LINE_Y = 250;

// ResNet's idea in one picture: the input skips around two layers and is added back.
const SkipDiagram: React.FC<{ color: string }> = ({ color }) => (
  <svg width={300} height={90} viewBox="0 0 300 90">
    <line x1={10} y1={60} x2={290} y2={60} stroke={COLORS.muted} strokeWidth={3} />
    <rect x={70} y={45} width={50} height={30} rx={5} fill={COLORS.panel} stroke={COLORS.text} strokeWidth={2} />
    <rect x={145} y={45} width={50} height={30} rx={5} fill={COLORS.panel} stroke={COLORS.text} strokeWidth={2} />
    <path d="M 40 60 C 40 5, 230 5, 230 50" fill="none" stroke={color} strokeWidth={4} />
    <circle cx={235} cy={60} r={13} fill={COLORS.panel} stroke={color} strokeWidth={3} />
    <text x={235} y={67} fill={color} fontSize={22} fontWeight={700} textAnchor="middle">+</text>
  </svg>
);

export const History: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  // When each card appears: one per line; VGG and ResNet share the last line.
  const starts = [L[1], L[2], L[3], L[3] + Math.round((L[4] - L[3]) * 0.42)];
  const lineDraw = lerp(frame, [L[0], L[0] + 40], [0, 1]);

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <line x1={X0} y1={LINE_Y} x2={X0 + (4 * W + 3 * GAP) * lineDraw} y2={LINE_Y} stroke={COLORS.panelBorder} strokeWidth={6} strokeLinecap="round" />
      </svg>
      {MODELS.map((m, i) => {
        const x = X0 + i * (W + GAP);
        const p = pop(frame, fps, starts[i]);
        const o = Math.min(1, p);
        return (
          <React.Fragment key={m.name}>
            <div style={{ position: "absolute", left: x + W / 2 - 16, top: LINE_Y - 16, width: 32, height: 32, borderRadius: 16, background: m.color, transform: `scale(${p})`, boxShadow: `0 0 24px ${m.color}` }} />
            <Label x={x + W / 2} y={LINE_Y - 80} size={40} mono weight={700} color={m.color} center opacity={o}>
              {m.year}
            </Label>
            <div
              style={{
                position: "absolute",
                left: x,
                top: 310,
                width: W,
                height: 470,
                boxSizing: "border-box",
                padding: "28px 30px",
                borderRadius: 20,
                background: COLORS.panel,
                border: `2px solid ${m.color}`,
                opacity: o,
                transform: `translateY(${(1 - p) * 40}px)`,
              }}
            >
              <div style={{ fontSize: 48, fontWeight: 800, color: COLORS.text }}>{m.name}</div>
              <div style={{ marginTop: 18, fontSize: 27, lineHeight: 1.45, color: COLORS.text }}>
                {m.facts.map((f) => (
                  <div key={f} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                    <span style={{ color: m.color }}>•</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              {m.name === "ResNet" ? <SkipDiagram color={m.color} /> : null}
            </div>
          </React.Fragment>
        );
      })}
      <Label x={960} y={820} size={28} color={COLORS.muted} center opacity={fade(frame, starts[3] + 30)}>
        Same building blocks, <span style={{ fontFamily: MONO, color: COLORS.text }}>deeper</span> and <span style={{ fontFamily: MONO, color: COLORS.text }}>smarter</span> stacking.
      </Label>
    </AbsoluteFill>
  );
};
