import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { Arrow, Layer } from "../components/Diagram";
import { Chip } from "../components/Token";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const CX = 960;
const BOX_W = 400;
const WORDS = ["the", "cat", "sat", "down"];

const Box: React.FC<{ y: number; h: number; color: string; text: string; opacity: number; glow?: number }> = ({ y, h, color, text, opacity, glow = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: CX - BOX_W / 2,
      top: y,
      width: BOX_W,
      height: h,
      borderRadius: 14,
      border: `3px solid ${color}`,
      background: `${color}22`,
      boxShadow: glow > 0 ? `0 0 ${30 * glow}px ${color}` : undefined,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 30,
      fontWeight: 800,
      color,
      opacity,
    }}
  >
    {text}
  </div>
);

const Row: React.FC<{ y: number; opacity: number; color: string }> = ({ y, opacity, color }) => (
  <>
    {WORDS.map((w, i) => (
      <Chip key={w} x={CX - 230 + i * 118} y={y} w={104} h={46} size={22} text={w} color={color} opacity={opacity} />
    ))}
  </>
);

const NOTES = [
  { color: ROLE.attn, title: "Multi-head attention", text: "words exchange information" },
  { color: COLORS.green, title: "Residual connection", text: "output = x + Attention(x)" },
  { color: COLORS.cyan, title: "Layer normalization", text: "rescale each vector: mean 0, spread 1" },
  { color: ROLE.ffn, title: "Feed-forward network", text: "the same small network, applied to each word separately" },
  { color: COLORS.text, title: "Same shape out", text: "4 vectors in → 4 vectors out" },
];

export const Block: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const pulse = 0.5 + 0.5 * Math.sin(frame / 6);
  const on = (i: number) => fade(frame, L[i]);
  const active = (i: number) => (frame >= L[i] && frame < L[i + 1] ? pulse : 0);

  return (
    <AbsoluteFill>
      {/* the block, bottom to top */}
      <Row y={820} opacity={on(0)} color={ROLE.token} />
      <Box y={660} h={70} color={ROLE.attn} text="Multi-head attention" opacity={on(0)} glow={active(0)} />
      <Box y={560} h={50} color={COLORS.green} text="Add & Norm" opacity={on(1)} glow={active(1) + active(2)} />
      <Box y={420} h={70} color={ROLE.ffn} text="Feed-forward" opacity={on(3)} glow={active(3)} />
      <Box y={320} h={50} color={COLORS.green} text="Add & Norm" opacity={on(4)} glow={active(4)} />
      <Row y={200} opacity={fade(frame, L[4] + 20)} color={COLORS.text} />

      <Layer>
        <Arrow id="b1" d={`M ${CX} 815 L ${CX} 740`} progress={on(0)} />
        <Arrow id="b2" d={`M ${CX} 655 L ${CX} 620`} progress={on(1)} />
        <Arrow id="b3" d={`M ${CX} 555 L ${CX} 500`} progress={on(3)} />
        <Arrow id="b4" d={`M ${CX} 415 L ${CX} 380`} progress={on(4)} />
        <Arrow id="b5" d={`M ${CX} 315 L ${CX} 256`} progress={fade(frame, L[4] + 15)} />
        {/* residual connections skip around each sub-layer */}
        <Arrow id="r1" d={`M ${CX} 780 L ${CX + 290} 780 L ${CX + 290} 585 L ${CX + BOX_W / 2 + 10} 585`} color={COLORS.green} width={5} progress={lerp(frame, [L[1], L[1] + 30], [0, 1])} flow={frame >= L[1] && frame < L[2] ? frame : undefined} />
        <Arrow id="r2" d={`M ${CX} 532 L ${CX + 290} 532 L ${CX + 290} 345 L ${CX + BOX_W / 2 + 10} 345`} color={COLORS.green} width={5} progress={lerp(frame, [L[4], L[4] + 30], [0, 1])} />
        <rect x={CX - 330} y={300} width={660} height={460} rx={20} fill="none" stroke={COLORS.muted} strokeWidth={3} strokeDasharray="12 10" opacity={fade(frame, L[4] + 30)} />
      </Layer>
      <div style={{ position: "absolute", left: CX + 300, top: 690, fontSize: 22, fontWeight: 700, color: COLORS.green, opacity: on(1) }}>skip</div>
      <div style={{ position: "absolute", left: CX - 320, top: 306, fontSize: 24, fontWeight: 800, color: COLORS.muted, opacity: fade(frame, L[4] + 30) }}>one block</div>

      {/* notes, one per line */}
      <div style={{ position: "absolute", left: 110, top: 220, width: 470 }}>
        {NOTES.map((n, i) => (
          <div key={n.title} style={{ marginBottom: 26, opacity: on(i) * (frame >= L[i] && frame < L[i + 1] ? 1 : 0.55) }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: n.color }}>{n.title}</div>
            <div style={{ fontSize: 24, color: COLORS.text, marginTop: 4 }}>{n.text}</div>
          </div>
        ))}
      </div>

      {/* the feed-forward network, up close */}
      <div style={{ position: "absolute", left: 1370, top: 330, opacity: on(3) }}>
        <svg width={440} height={330}>
          {[4, 8, 4].map((n, layer) =>
            Array.from({ length: n }, (_, k) => {
              const x = 60 + layer * 150;
              const y = 40 + (k + 0.5) * (240 / n);
              return (
                <React.Fragment key={`${layer}-${k}`}>
                  {layer < 2
                    ? Array.from({ length: [4, 8, 4][layer + 1] }, (_, m) => (
                        <line key={m} x1={x} y1={y} x2={x + 150} y2={40 + (m + 0.5) * (240 / [4, 8, 4][layer + 1])} stroke={ROLE.ffn} strokeOpacity={0.3} strokeWidth={1.5} />
                      ))
                    : null}
                  <circle cx={x} cy={y} r={11} fill={COLORS.panel} stroke={ROLE.ffn} strokeWidth={3} />
                </React.Fragment>
              );
            }),
          )}
          {["512", "2048", "512"].map((t, i) => (
            <text key={i} x={60 + i * 150} y={312} fill={COLORS.muted} fontSize={20} fontFamily={MONO} textAnchor="middle">
              {t}
            </text>
          ))}
        </svg>
        <div style={{ fontSize: 22, color: COLORS.muted, width: 420 }}>expand, apply ReLU, shrink back. The same weights for every word.</div>
      </div>
    </AbsoluteFill>
  );
};
