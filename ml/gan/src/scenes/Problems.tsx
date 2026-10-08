import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, linear, pop } from "../anim";
import { areaPath, Axes, type Chart, linePath, px, py } from "../components/Diagram";
import { Card, Label } from "../components/Text";
import { REAL, XS } from "../data";
import { COLORS, ROLE } from "../theme";
import { useLines } from "../timeline";

const CARD_W = 540;
const CARD_Y = 190;
const CARD_H = 540;
const CARDS_X = [100, 690, 1280];
const chartIn = (x: number, x0: number, x1: number, y0: number, y1: number): Chart => ({ x: x + 40, y: CARD_Y + 200, w: CARD_W - 80, h: 220, x0, x1, y0, y1 });

// Mode collapse (illustration): all of G's samples pile onto one bump.
const C1 = chartIn(CARDS_X[0], -5, 5, 0, 1);
const collapsed = XS.map((x) => Math.exp(-0.5 * ((x - 2) / 0.45) ** 2) / (0.45 * Math.sqrt(2 * Math.PI)));

// Instability: the two losses keep oscillating instead of settling.
const C2 = chartIn(CARDS_X[1], 0, 1, -1.4, 1.4);
const TS = Array.from({ length: 200 }, (_, i) => i / 199);

// Vanishing gradients: D is sure every fake is fake, so log(1 − D) is flat.
const C3 = chartIn(CARDS_X[2], -8, 2, 0, 1);
const LOGITS = Array.from({ length: 101 }, (_, i) => -8 + i / 10);
const sigmoid = (s: number) => 1 / (1 + Math.exp(-s));

const FIXES = ["Wasserstein loss (WGAN)", "gradient penalty", "spectral normalization", "two learning rates (TTUR)", "progressive growing"];

const Title: React.FC<{ x: number; n: number; text: string; color: string; opacity: number }> = ({ x, n, text, color, opacity }) => (
  <Label x={x + 30} y={CARD_Y + 26} size={34} weight={800} color={color} opacity={opacity}>
    <span style={{ color: COLORS.muted, marginRight: 12 }}>{n}</span>
    {text}
  </Label>
);

export const Problems: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLines();

  const a = fade(frame, L[1]);
  const b = fade(frame, L[2]);
  const c = fade(frame, L[3]);
  const wave = linear(frame, [L[2], L[2] + 120], [0, 1]);
  const fakes = [-6.5, -5.8, -7.1, -6.1];

  return (
    <AbsoluteFill>
      {/* 1. mode collapse */}
      <Card x={CARDS_X[0]} y={CARD_Y} w={CARD_W} h={CARD_H} accent={a > 0 && frame < L[2] ? ROLE.gen : undefined} opacity={a} />
      <Title x={CARDS_X[0]} n={1} text="Mode collapse" color={ROLE.gen} opacity={a} />
      <Label x={CARDS_X[0] + 30} y={CARD_Y + 80} size={24} color={COLORS.muted} width={CARD_W - 60} opacity={a}>
        G keeps making the few outputs that work, and ignores the rest of the data.
      </Label>
      <svg width={1920} height={1080} style={{ position: "absolute", opacity: a }}>
        <Axes c={C1} xLabel="x" />
        <path d={areaPath(C1, XS, REAL)} fill={ROLE.real} fillOpacity={0.22} stroke={ROLE.real} strokeWidth={3} />
        <path d={areaPath(C1, XS, collapsed.map((v) => v * fade(frame, L[1] + 30, 25)))} fill={ROLE.gen} fillOpacity={0.3} stroke={ROLE.gen} strokeWidth={3} />
        <text x={px(C1, -2)} y={py(C1, 0.45)} fill={ROLE.real} fontSize={20} textAnchor="middle">
          never made
        </text>
      </svg>
      <Label x={CARDS_X[0] + 30} y={CARD_Y + 470} size={20} color={COLORS.muted} opacity={a}>
        (illustration; the run in this video did not collapse)
      </Label>

      {/* 2. instability */}
      <Card x={CARDS_X[1]} y={CARD_Y} w={CARD_W} h={CARD_H} accent={b > 0 && frame < L[3] ? COLORS.yellow : undefined} opacity={b} />
      <Title x={CARDS_X[1]} n={2} text="Instability" color={COLORS.yellow} opacity={b} />
      <Label x={CARDS_X[1] + 30} y={CARD_Y + 80} size={24} color={COLORS.muted} width={CARD_W - 60} opacity={b}>
        Each player's best move changes the other's target. They can circle forever.
      </Label>
      <svg width={1920} height={1080} style={{ position: "absolute", opacity: b }}>
        <Axes c={C2} xLabel="training time →" />
        <path d={linePath(C2, TS.filter((t) => t <= wave), TS.filter((t) => t <= wave).map((t) => 0.9 * Math.sin(t * 22)))} fill="none" stroke={ROLE.disc} strokeWidth={4} />
        <path d={linePath(C2, TS.filter((t) => t <= wave), TS.filter((t) => t <= wave).map((t) => -0.9 * Math.sin(t * 22 + 0.6)))} fill="none" stroke={ROLE.gen} strokeWidth={4} />
        <text x={C2.x + 10} y={C2.y + 20} fill={ROLE.disc} fontSize={20}>
          D loss
        </text>
        <text x={C2.x + 10} y={C2.y + C2.h - 6} fill={ROLE.gen} fontSize={20}>
          G loss
        </text>
      </svg>

      {/* 3. vanishing gradients */}
      <Card x={CARDS_X[2]} y={CARD_Y} w={CARD_W} h={CARD_H} accent={c > 0 && frame < L[4] ? ROLE.disc : undefined} opacity={c} />
      <Title x={CARDS_X[2]} n={3} text="Vanishing gradients" color={ROLE.disc} opacity={c} />
      <Label x={CARDS_X[2] + 30} y={CARD_Y + 80} size={24} color={COLORS.muted} width={CARD_W - 60} opacity={c}>
        D is too good: every fake gets D ≈ 0, where the curve is flat. G learns nothing.
      </Label>
      <svg width={1920} height={1080} style={{ position: "absolute", opacity: c }}>
        <Axes c={C3} xLabel="D's logit" />
        <path d={linePath(C3, LOGITS, LOGITS.map(sigmoid))} fill="none" stroke={ROLE.disc} strokeWidth={4} />
        <line x1={px(C3, -7.6)} y1={py(C3, 0.002)} x2={px(C3, -5)} y2={py(C3, 0.002)} stroke={COLORS.yellow} strokeWidth={4} />
        {fakes.map((f, i) => (
          <circle key={i} cx={px(C3, f)} cy={py(C3, sigmoid(f))} r={10} fill={ROLE.gen} stroke="#fff" strokeWidth={2} opacity={fade(frame, L[3] + 20 + i * 5)} />
        ))}
        <text x={px(C3, -6.3)} y={py(C3, 0.2)} fill={COLORS.yellow} fontSize={20} textAnchor="middle">
          slope ≈ 0
        </text>
        <text x={px(C3, -6.3)} y={py(C3, 0.11)} fill={ROLE.gen} fontSize={20} textAnchor="middle">
          the fakes
        </text>
      </svg>

      {/* fixes */}
      <Label x={100} y={770} size={28} weight={700} color={COLORS.green} opacity={fade(frame, L[4])}>
        fixes:
      </Label>
      <div style={{ position: "absolute", left: 200, top: 762, display: "flex", gap: 14, flexWrap: "wrap", width: 1640 }}>
        {FIXES.map((f, i) => {
          const p = pop(frame, fps, L[4] + 10 + i * 8);
          return (
            <div key={f} style={{ padding: "8px 20px", borderRadius: 30, border: `3px solid ${COLORS.green}`, color: COLORS.green, fontSize: 26, fontWeight: 700, opacity: Math.min(1, p), transform: `scale(${p})` }}>
              {f}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
