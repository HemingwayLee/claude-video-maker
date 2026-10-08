import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, lerp } from "../anim";
import { Card, Label } from "../components/Text";
import { COLORS, MONO, ROLE } from "../theme";
import { useLines } from "../timeline";

const W = 840;
const H = 320;
const POS = [
  [90, 170],
  [990, 170],
  [90, 530],
  [990, 530],
];

const MODELS = [
  { name: "Transformer", year: 2017, params: 65e6, label: "65 M" },
  { name: "BERT-large", year: 2018, params: 340e6, label: "340 M" },
  { name: "GPT-2", year: 2019, params: 1.5e9, label: "1.5 B" },
  { name: "GPT-3", year: 2020, params: 175e9, label: "175 B" },
];

const Title: React.FC<{ i: number; n: string; text: string; color: string; opacity: number }> = ({ i, n, text, color, opacity }) => (
  <Label x={POS[i][0] + 28} y={POS[i][1] + 20} size={32} weight={800} color={color} opacity={opacity}>
    <span style={{ color: COLORS.muted, marginRight: 10 }}>{n}</span>
    {text}
  </Label>
);

export const Why: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();
  const on = (i: number) => fade(frame, L[i]);
  const grow = lerp(frame, [L[2] + 15, L[2] + 75], [0, 1]);

  return (
    <AbsoluteFill>
      {POS.map(([x, y], i) => (
        <Card key={i} x={x} y={y} w={W} h={H} opacity={on(i)} accent={frame >= L[i] && frame < L[i + 1] ? (i === 3 ? COLORS.red : ROLE.attn) : undefined} />
      ))}

      {/* 1. parallel */}
      <Title i={0} n="1" text="Parallel" color={ROLE.attn} opacity={on(0)} />
      <div style={{ opacity: on(0) }}>
        <Label x={POS[0][0] + 30} y={POS[0][1] + 110} size={22} color={COLORS.muted}>
          RNN
        </Label>
        {Array.from({ length: 8 }, (_, k) => (
          <div key={`r${k}`} style={{ position: "absolute", left: POS[0][0] + 170 + k * 76, top: POS[0][1] + 105, width: 70, height: 36, borderRadius: 6, background: COLORS.blue, opacity: lerp(frame, [L[0] + 10 + k * 8, L[0] + 16 + k * 8], [0.15, 1]) }} />
        ))}
        <Label x={POS[0][0] + 30} y={POS[0][1] + 185} size={22} color={ROLE.attn}>
          Transformer
        </Label>
        {Array.from({ length: 8 }, (_, k) => (
          <div key={`t${k}`} style={{ position: "absolute", left: POS[0][0] + 170, top: POS[0][1] + 165 + k * 12, width: 70, height: 9, borderRadius: 3, background: ROLE.attn, opacity: lerp(frame, [L[0] + 10, L[0] + 16], [0.15, 1]) }} />
        ))}
        <Label x={POS[0][0] + 260} y={POS[0][1] + 190} size={22} color={COLORS.text}>
          all 8 words at the same time → fast on GPUs
        </Label>
        <Label x={POS[0][0] + W - 40} y={POS[0][1] + 275} size={20} color={COLORS.muted} style={{ transform: "translateX(-100%)" }}>
          time →
        </Label>
      </div>

      {/* 2. short paths */}
      <Title i={1} n="2" text="Every word one step away" color={ROLE.attn} opacity={on(1)} />
      <svg width={1920} height={1080} style={{ position: "absolute", opacity: on(1) }}>
        {Array.from({ length: 8 }, (_, k) => {
          const x = POS[1][0] + 180 + k * 80;
          return (
            <React.Fragment key={k}>
              <circle cx={x} cy={POS[1][1] + 130} r={11} fill={COLORS.blue} />
              {k < 7 ? <line x1={x + 13} y1={POS[1][1] + 130} x2={x + 67} y2={POS[1][1] + 130} stroke={COLORS.blue} strokeWidth={3} /> : null}
              <circle cx={x} cy={POS[1][1] + 250} r={11} fill={ROLE.attn} />
            </React.Fragment>
          );
        })}
        <path d={`M ${POS[1][0] + 180} ${POS[1][1] + 238} C ${POS[1][0] + 300} ${POS[1][1] + 170}, ${POS[1][0] + 640} ${POS[1][1] + 170}, ${POS[1][0] + 740} ${POS[1][1] + 238}`} fill="none" stroke={ROLE.attn} strokeWidth={4} />
      </svg>
      <Label x={POS[1][0] + 30} y={POS[1][1] + 115} size={22} color={COLORS.muted} opacity={on(1)}>
        RNN
      </Label>
      <Label x={POS[1][0] + 30} y={POS[1][1] + 235} size={22} color={ROLE.attn} opacity={on(1)}>
        Transf.
      </Label>
      <Label x={POS[1][0] + 460} y={POS[1][1] + 150} size={22} color={COLORS.muted} center opacity={on(1)}>
        first → last word: 7 steps
      </Label>
      <Label x={POS[1][0] + 460} y={POS[1][1] + 270} size={22} color={ROLE.attn} center opacity={on(1)}>
        first → last word: 1 step
      </Label>

      {/* 3. scale */}
      <Title i={2} n="3" text="It scales" color={ROLE.attn} opacity={on(2)} />
      {MODELS.map((m, k) => {
        // Log scale: 10 M → 0, 1 T → 1.
        const t = (Math.log10(m.params) - 7) / 5;
        return (
          <div key={m.name} style={{ position: "absolute", left: POS[2][0] + 30, top: POS[2][1] + 85 + k * 56, display: "flex", alignItems: "center", gap: 14, opacity: on(2) }}>
            <div style={{ width: 230, fontSize: 24, fontWeight: 700, textAlign: "right" }}>
              {m.name} <span style={{ fontSize: 18, color: COLORS.muted, fontWeight: 500 }}>{m.year}</span>
            </div>
            <div style={{ width: 420 * t * Math.min(1, grow * 4 - k * 0.9 < 0 ? 0 : grow * 4 - k * 0.9), height: 34, borderRadius: 6, background: ROLE.attn }} />
            <div style={{ fontFamily: MONO, fontSize: 22, color: COLORS.text, opacity: lerp(grow * 4 - k * 0.9, [0.6, 1], [0, 1]) }}>{m.label}</div>
          </div>
        );
      })}
      <Label x={POS[2][0] + W - 30} y={POS[2][1] + 26} size={20} color={COLORS.muted} opacity={on(2)} style={{ transform: "translateX(-100%)" }}>
        parameters, log scale
      </Label>

      {/* 4. the price */}
      <Title i={3} n="!" text="The price: n² attention" color={COLORS.red} opacity={on(3)} />
      {[4, 8, 16].map((n, k) => {
        const cell = 14;
        const left = POS[3][0] + 40 + [0, 170, 400][k];
        const appear = fade(frame, L[3] + 15 + k * 20);
        return (
          <div key={n} style={{ opacity: on(3) * appear }}>
            <div style={{ position: "absolute", left, top: POS[3][1] + 300 - 20 - n * cell, width: n * cell, height: n * cell, backgroundColor: `${COLORS.red}18`, backgroundImage: `linear-gradient(${COLORS.red}aa 2px, transparent 2px), linear-gradient(90deg, ${COLORS.red}aa 2px, transparent 2px)`, backgroundSize: `${cell}px ${cell}px`, border: `2px solid ${COLORS.red}` }} />
            <div style={{ position: "absolute", left: left + n * cell + 10, top: POS[3][1] + 250, fontFamily: MONO, fontSize: 20, color: COLORS.text }}>
              {n} words
              <br />
              <span style={{ color: COLORS.red }}>{n * n} pairs</span>
            </div>
          </div>
        );
      })}
      <Label x={POS[3][0] + 40} y={POS[3][1] + 85} size={24} color={COLORS.text} width={420} opacity={fade(frame, L[3] + 70)}>
        2× longer text → 4× more work
      </Label>
    </AbsoluteFill>
  );
};
