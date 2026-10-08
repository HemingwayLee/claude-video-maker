import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fade, linear } from "../anim";
import { Grid } from "../components/Grid";
import { Card, Label } from "../components/Text";
import { CAT, KERNELS } from "../data";
import { COLORS, diverging, gray, MONO } from "../theme";
import { useLines } from "../timeline";

const RANDOM = [
  [0.3, -0.7, 0.1],
  [0.9, 0.2, -0.4],
  [-0.2, 0.5, 0.8],
];
const LEARNED = KERNELS.vertical;

// Loss curve: noisy exponential decay, fixed so every render is identical.
const curve = (t: number) => 0.08 + 1.55 * Math.exp(-4 * t) + 0.05 * Math.sin(t * 40) * (1 - t);
const CHART = { x: 1250, y: 560, w: 540, h: 260 };

export const Training: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLines();

  // 0 = untrained, 1 = trained.
  const progress = linear(frame, [L[2] + 15, L[3] + 60], [0, 1]);
  const kernel = RANDOM.map((row, r) => row.map((w, c) => w + (LEARNED[r][c] - w) * progress));
  const pCat = 0.2 + 0.72 * progress;
  const pDog = 0.6 + (0.06 - 0.6) * progress;
  const probs = [
    { name: "cat", p: pCat },
    { name: "dog", p: pDog },
    { name: "bird", p: 1 - pCat - pDog },
  ];
  const loss = -Math.log(pCat);
  const guess = probs.reduce((a, b) => (b.p > a.p ? b : a));

  const backprop = fade(frame, L[2], 15);
  const dash = (frame * 2) % 40;

  const curvePath = Array.from({ length: 101 }, (_, i) => {
    const t = (i / 100) * progress;
    const x = CHART.x + t * CHART.w;
    const y = CHART.y + CHART.h - (curve(t) / 1.7) * CHART.h;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  return (
    <AbsoluteFill>
      {/* the forward pass */}
      <div style={{ position: "absolute", left: 110, top: 200, opacity: fade(frame, L[1]) }}>
        <Grid data={CAT} cell={10} color={gray} gap={0} />
      </div>
      <Label x={190} y={370} size={24} color={COLORS.muted} center opacity={fade(frame, L[1])}>
        training image
      </Label>
      <Label x={300} y={245} size={44} color={COLORS.muted} opacity={fade(frame, L[1])}>
        →
      </Label>
      <Card x={370} y={200} w={260} h={160} accent={COLORS.cyan} opacity={fade(frame, L[0])}>
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 54, fontWeight: 800, color: COLORS.cyan }}>CNN</div>
      </Card>
      <Label x={660} y={245} size={44} color={COLORS.muted} opacity={fade(frame, L[1] + 10)}>
        →
      </Label>
      <Card x={730} y={180} w={390} h={200} opacity={fade(frame, L[1] + 10)}>
        <div style={{ padding: "18px 24px" }}>
          <div style={{ fontSize: 24, color: COLORS.muted, marginBottom: 10 }}>
            guess: <span style={{ color: guess.name === "cat" ? COLORS.green : COLORS.red, fontWeight: 700 }}>{guess.name}</span>
          </div>
          {probs.map((p) => (
            <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12, height: 40 }}>
              <div style={{ width: 60, fontSize: 24, textAlign: "right" }}>{p.name}</div>
              <div style={{ width: 200 * p.p, height: 24, borderRadius: 4, background: p.name === "cat" ? COLORS.yellow : COLORS.muted }} />
              <div style={{ fontFamily: MONO, fontSize: 22, color: COLORS.muted }}>{Math.round(p.p * 100)}%</div>
            </div>
          ))}
        </div>
      </Card>
      <Label x={925} y={395} size={26} center opacity={fade(frame, L[1] + 25)}>
        correct answer: <span style={{ color: COLORS.green, fontWeight: 700 }}>cat</span>
      </Label>
      <Label x={1150} y={245} size={44} color={COLORS.muted} opacity={fade(frame, L[1] + 35)}>
        →
      </Label>
      <Card x={1220} y={200} w={300} h={160} accent={COLORS.red} opacity={fade(frame, L[1] + 35)}>
        <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 26, color: COLORS.muted }}>loss (how wrong)</div>
          <div style={{ fontFamily: MONO, fontSize: 56, fontWeight: 700, color: COLORS.red }}>{loss.toFixed(2)}</div>
        </div>
      </Card>

      {/* the backward pass */}
      <svg width={1920} height={1080} style={{ position: "absolute", opacity: backprop }}>
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.magenta} />
          </marker>
        </defs>
        <path
          d="M 1370 365 C 1370 480, 500 480, 500 370"
          fill="none"
          stroke={COLORS.magenta}
          strokeWidth={5}
          strokeDasharray="14 10"
          strokeDashoffset={dash}
          markerEnd="url(#arrow)"
        />
      </svg>
      <Label x={935} y={470} size={28} weight={700} color={COLORS.magenta} center opacity={backprop}>
        backpropagation: nudge every weight to lower the loss
      </Label>

      {/* one filter, learning */}
      <Label x={330} y={555} size={26} color={COLORS.muted} opacity={fade(frame, L[0] + 10)}>
        one filter's weights
      </Label>
      <div style={{ position: "absolute", left: 330, top: 600, opacity: fade(frame, L[0] + 10) }}>
        <Grid
          data={kernel}
          cell={72}
          color={(w) => (frame < L[1] ? COLORS.panel : diverging(w, 1.2))}
          showValues
          fontSize={22}
          format={(w) => (frame < L[1] ? "?" : w.toFixed(1))}
          style={{ outline: `3px solid ${COLORS.yellow}`, outlineOffset: 4, borderRadius: 6 }}
        />
      </div>
      <div style={{ position: "absolute", left: 600, top: 620, width: 560, fontSize: 28, lineHeight: 1.5, color: COLORS.text }}>
        <div style={{ opacity: fade(frame, L[1]) }}>start: random numbers</div>
        <div style={{ opacity: fade(frame, L[3]) }}>
          after training: a <span style={{ color: COLORS.orange, fontWeight: 700 }}>vertical edge detector</span>
        </div>
        <div style={{ opacity: fade(frame, L[2] + 15), fontFamily: MONO, fontSize: 24, color: COLORS.muted, marginTop: 14 }}>
          images seen: {Math.round(progress * 50000).toLocaleString("en-US")}
        </div>
      </div>

      {/* loss curve */}
      <svg width={1920} height={1080} style={{ position: "absolute", opacity: fade(frame, L[2]) }}>
        <line x1={CHART.x} y1={CHART.y} x2={CHART.x} y2={CHART.y + CHART.h} stroke={COLORS.muted} strokeWidth={2} />
        <line x1={CHART.x} y1={CHART.y + CHART.h} x2={CHART.x + CHART.w} y2={CHART.y + CHART.h} stroke={COLORS.muted} strokeWidth={2} />
        <path d={curvePath} fill="none" stroke={COLORS.red} strokeWidth={4} />
        <text x={CHART.x} y={CHART.y - 14} fill={COLORS.muted} fontSize={24}>loss</text>
        <text x={CHART.x + CHART.w} y={CHART.y + CHART.h + 32} fill={COLORS.muted} fontSize={24} textAnchor="end">training time →</text>
      </svg>
    </AbsoluteFill>
  );
};
